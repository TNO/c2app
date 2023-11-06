import { Module } from '@nestjs/common';
import { DefaultWebSocketGateway } from './default-websocket.gateway.js';

@Module({
  providers: [DefaultWebSocketGateway],
  exports: [DefaultWebSocketGateway],
})
export class GatewayModule { }
