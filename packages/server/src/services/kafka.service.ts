import { Injectable, Inject } from '@nestjs/common';
import {
  TestBedAdapter,
  AdapterLogger,
  LogLevel,
  AdapterMessage,
  AdapterProducerRecord,
  RecordMetadata,
  FeatureCollectionType,
} from 'node-test-bed-adapter';
import { DefaultWebSocketGateway } from '../gateway/default-websocket.gateway.js';
import { FeatureCollection } from 'geojson';
import {
  IAlert,
  IAssistanceMessage,
  IAssistanceResource,
  ICbrnFeatureCollection,
  IContext,
  IMission,
  ISensor,
} from 'c2app-models-utils';
import { MessagesService } from '../messages/messages.service.js';

const SimEntityFeatureCollectionTopic = 'simulation_entity_featurecollection';
const geojsonLayer = 'standard_geojson';
const contextTopic = 'context';
const capMessage = 'standard_cap';
const resourceTopic = 'resource';
const missionTopic = 'mission';
const sensorTopic = 'sensor';
const messageTopic = 'message_incoming';
const chemicalIncidentTopic = 'chemical_incident';
const plumeTopic = 'cbrn_geojson';
// const c2000Topic = 'c2000';
const log = AdapterLogger.instance;

@Injectable()
export class KafkaService {
  public adapter: TestBedAdapter;
  public messageQueue: AdapterMessage[] = [];
  public busy = false;

  constructor(
    @Inject(DefaultWebSocketGateway) private readonly socket: DefaultWebSocketGateway,
    @Inject(MessagesService) private readonly messagesService: MessagesService
  ) {
    this.createAdapter().catch((e) => {
      log.error(e);
    });
  }

  public createAdapter(): Promise<TestBedAdapter> {
    return new Promise(async (resolve) => {
      log.info('Init KafkaService');
      this.adapter = new TestBedAdapter({
        groupId: process.env.GROUP_ID || `safr_${Math.round(Math.random() * 1000)}`,
        kafkaHost: process.env.KAFKA_HOST || 'localhost:3501',
        schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
        consume: process.env.CONSUME
          ? process.env.CONSUME.split(',').map((t) => t.trim())
          : [
            SimEntityFeatureCollectionTopic,
            capMessage,
            contextTopic,
            geojsonLayer,
            missionTopic,
            resourceTopic,
            sensorTopic,
            chemicalIncidentTopic,
            plumeTopic,
            messageTopic,
          ],
        logging: {
          logToConsole: LogLevel.Info,
          logToKafka: LogLevel.Warn,
        },
      });
      this.adapter.on('error', (_e) => {
        // On error, try to connect again
        this.adapter.connect().catch((e) => {
          log.error(e);
        });
      });
      this.adapter.on('message', (message: AdapterMessage) => {
        this.messageQueue.push(message);
        this.handleMessage();
      });
      this.adapter.on('ready', () => {
        log.info('Kafka is connected');
        resolve(this.adapter);
      });
      this.adapter.connect().catch((e) => {
        log.error(e);
      });
    });
  }

  public send(payloads: AdapterProducerRecord, cb: (error?: any, data?: RecordMetadata[]) => any): any {
    if (this.adapter.isConnected) {
      this.adapter.send(payloads, cb);
    } else {
      log.warn('Test-bed not connected');
      cb(null, []);
    }
  }

  private async handleMessage() {
    while (this.messageQueue.length > 0 && !this.busy) {
      this.busy = true;
      const { topic, value } = this.messageQueue.shift();
      console.log(JSON.stringify(value))
      switch (topic) {
        case geojsonLayer:
        case SimEntityFeatureCollectionTopic:
          if (value && value.hasOwnProperty('layerId') && value['layerId'] === 'CLEAR_ALL_COLLECTIONS') {
            this.messagesService.clearAllCollections();
          } else {
            const geojson = KafkaService.normalizeGeoJSON(value as FeatureCollection);
            console.log(JSON.stringify(geojson))
            this.socket.server.emit('geojson', geojson);
            this.messagesService.create('geojson', geojson);
          }
          break;
        case capMessage:
          const alert = value as IAlert;
          this.socket.server.emit('alert', alert);
          this.messagesService.create('alerts', alert);
          break;
        case contextTopic:
          const context = KafkaService.prepareContext(value as IContext);
          this.socket.server.emit('context', context);
          this.messagesService.create('contexts', context);
          break;
        case missionTopic:
          this.socket.server.emit('mission', value as IMission);
          this.messagesService.create('missions', value);
          break;
        case resourceTopic:
          this.socket.server.emit('resource', value as IAssistanceResource);
          this.messagesService.create('resources', value);
          break;
        case sensorTopic:
          this.socket.server.emit('sensor', value as ISensor);
          this.messagesService.create('sensors', value);
          break;
        case chemicalIncidentTopic:
          this.socket.server.emit('chemical_incident', value as ISensor);
          this.messagesService.create('chemical_incidents', value);
          break;
        case plumeTopic:
          const plume = KafkaService.preparePlume(value as ICbrnFeatureCollection);
          this.socket.server.emit('plume', plume);
          this.messagesService.create('plumes', plume);
          break;
        case messageTopic:
          const msg = value as IAssistanceMessage;
          const { resource } = msg;
          // Send message only to the resource that is mentioned
          if (this.socket.callsignToSocketId.get(resource)) {
            this.socket.server.to(this.socket.callsignToSocketId.get(resource)).emit('sas_message', msg);
            this.messagesService.create('sas_messages', msg);
          } else {
            console.log('Alert for ID: ' + msg.resource + ', resource not logged in!');
          }
          break;
        default:
          this.messagesService.create(`${topic}s`, value);
          log.warn(`Unknown topic: ${topic}: ${value}`);
          break;
      }
      this.busy = false;
    }
  }

  private static normalizeGeoJSON(collection: FeatureCollection) {
    (collection as any).id = (collection as any).id || (collection as any).layerId;
    for (const feature of collection.features) {
      feature.geometry = Object.entries(feature.geometry).map(([_key, value]) => value).shift();
      feature.properties = Object.entries(feature.properties).reduce((acc, [key, value]) => {
        acc[key] = typeof value.string !== 'undefined'
          ? value.string
          : typeof value.int !== 'undefined'
            ? value.int
            : typeof value.double !== 'undefined'
              ? value.double
              : value;
        return acc;
      }, {} as Record<string, any>)
    }
    return collection as FeatureCollection;
  }

  private static preparePlume(collection: ICbrnFeatureCollection) {
    for (const feature of collection.features) {
      if (feature.geometry[`nl.tno.assistance.geojson.geometry.Point`]) {
        feature.geometry = feature.geometry[`nl.tno.assistance.geojson.geometry.Point`];
      } else if (feature.geometry[`nl.tno.assistance.geojson.geometry.MultiPoint`]) {
        feature.geometry = feature.geometry[`nl.tno.assistance.geojson.geometry.MultiPoint`];
      } else if (feature.geometry[`nl.tno.assistance.geojson.geometry.LineString`]) {
        feature.geometry = feature.geometry[`nl.tno.assistance.geojson.geometry.LineString`];
      } else if (feature.geometry[`nl.tno.assistance.geojson.geometry.MultiLineString`]) {
        feature.geometry = feature.geometry[`nl.tno.assistance.geojson.geometry.MultiLineString`];
      } else if (feature.geometry[`nl.tno.assistance.geojson.geometry.Polygon`]) {
        feature.geometry = feature.geometry[`nl.tno.assistance.geojson.geometry.Polygon`];
      } else if (feature.geometry[`nl.tno.assistance.geojson.geometry.MultiPolygon`]) {
        feature.geometry = feature.geometry[`nl.tno.assistance.geojson.geometry.MultiPolygon`];
      }
    }
    return collection as ICbrnFeatureCollection;
  }

  private static prepareContext(context: IContext) {
    if (context.geometry[`nl.tno.assistance.geojson.geometry.Polygon`]) {
      context.geometry = context.geometry[`nl.tno.assistance.geojson.geometry.Polygon`];
    } else if (context.geometry[`nl.tno.assistance.geojson.geometry.MultiPolygon`]) {
      context.geometry = context.geometry[`nl.tno.assistance.geojson.geometry.MultiPolygon`];
    }
    return context as IContext;
  }
}
