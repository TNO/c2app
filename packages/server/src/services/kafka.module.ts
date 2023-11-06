import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service.js';
import { MessagesModule } from '../messages/messages.module.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
  imports: [MessagesModule, GatewayModule],
  providers: [KafkaService],
})
export class KafkaModule { }
