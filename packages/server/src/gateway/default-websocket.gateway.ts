import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { FeatureCollection, Feature } from 'geojson';
import { uuid4 } from '../utils/index.js';
import { Server, Socket } from 'socket.io';
import {
  IServerMessage,
  IServerGroup,
  IGroupsInit,
  IGroupCreate,
  IGroupUpdate,
  IGroupDelete,
  ICHT,
  IReturnGroup,
  INameUpdate,
} from 'c2app-models-utils';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: true } })
export class DefaultWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private clients: number = 0;
  private groups: Map<string, IServerGroup> = new Map<string, IServerGroup>();
  public callsignToSocketId: Map<string, string> = new Map<string, string>();
  private URL: string;
  private pop_URL: string = 'http://localhost:3333/detailed';

  constructor(private httpService: HttpService, private configService: ConfigService) {
    this.URL =
      this.configService && this.configService.get<string>('DISPERSION_SERVICE')
        ? `${this.configService.get<string>('DISPERSION_SERVICE') + '/process'}`
        : 'http://localhost:8080/process';
  }

  /** Handlers */
  async handleConnection(client: Socket) {
    this.clients++;
    console.log('Connected: ' + client.id + ' Client count: ' + this.clients);
  }

  async handleDisconnect(client: Socket) {
    this.clients--;
    console.log('Disconnected: ' + client.id + ' Client count: ' + this.clients);
  }

  @SubscribeMessage('client-init')
  handleClientInit(client: Socket, data: IGroupsInit): string {
    this.callsignToSocketId.set(data.callsign, client.id);
    console.log('ID: ' + data.callsign + ' linked to Socket: ' + client.id);

    return this.getGroupIdsForCallsign(data.callsign);
  }

  @SubscribeMessage('client-create')
  handleClientCreate(client: Socket, data: IGroupCreate): string {
    const group = this.setGroupForId({ id: uuid4(), callsign: data.callsign, group: data.group, name: data.name });

    group.callsigns.forEach((callsign: string) => {
      this.server
        .to(this.callsignToSocketId.get(callsign))
        .emit('server-notification', this.getGroupIdsForCallsign(callsign));
    });

    return this.getGroupIdsForCallsign(data.callsign);
  }

  @SubscribeMessage('client-update')
  handleClientUpdate(client: Socket, data: INameUpdate): string {
    this.updateGroupNameForId(data);

    return this.getGroupIdsForCallsign(data.callsign);
  }

  @SubscribeMessage('client-delete')
  handleClientDelete(client: Socket, data: IGroupDelete): string {
    this.groups.delete(data.id);

    return this.getGroupIdsForCallsign(data.callsign);
  }

  @SubscribeMessage('client-message')
  handleMessage(client: Socket, data: IServerMessage): string {
    const group = this.groups.get(data.id);

    group.callsigns.forEach((callsign: string) => {
      this.server
        .to(this.callsignToSocketId.get(callsign))
        .emit('server-message', JSON.stringify({ message: data.message, id: data.id, sender: data.callsign }));
    });
    if (!group.callsigns.includes(group.owner)) {
      this.server
        .to(this.callsignToSocketId.get(group.owner))
        .emit('server-message', JSON.stringify({ message: data.message, id: data.id, sender: data.callsign }));
    }

    return data.message;
  }

  @SubscribeMessage('client-cht')
  async handleClientCHT(client: Socket, data: ICHT) {
    await this.httpService.post(this.URL, data.hazard).toPromise();
  }

  @SubscribeMessage('client-pop')
  async handleClientPop(client: Socket, data: { feature: Feature }) {
    const response = await this.httpService.post(this.pop_URL, data.feature).toPromise();
    return JSON.stringify(response.data);
  }

  /** Helper Funcs */
  getGroupIdsForCallsign(callsign: string): string {
    let returnArray: Array<IReturnGroup> = new Array<IReturnGroup>();

    this.groups.forEach((group: IServerGroup, uuid: string) => {
      if (group.owner == callsign || group.callsigns.includes(callsign)) {
        returnArray.push({ id: uuid, callsigns: group.callsigns, owner: group.owner, name: group.name });
      }
    });

    return JSON.stringify(returnArray);
  }

  setGroupForId(update: IGroupUpdate): IServerGroup {
    const featureCollection = update.group as FeatureCollection;

    const callsigns = [
      ...new Set(
        featureCollection.features.map((feature: Feature) => {
          return feature.properties.id;
        })
      ),
    ];

    this.groups.set(update.id, {
      features: featureCollection,
      callsigns: callsigns,
      owner: update.callsign,
      name: update.name,
    });
    return this.groups.get(update.id);
  }
  updateGroupNameForId(data: INameUpdate) {
    const obj = this.groups.get(data.id);
    obj.name = data.name;
  }
}
