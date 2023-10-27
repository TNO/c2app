import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller.js';
import { KafkaService } from './services/kafka.service.js';
import { DefaultWebSocketGateway } from './gateway/default-websocket.gateway.js';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from './messages/messages.module.js';
import { MessagesService } from './messages/messages.service.js';

@Module({
  imports: [HttpModule, ConfigModule.forRoot(), MessagesModule],
  controllers: [AppController],
  providers: [DefaultWebSocketGateway, KafkaService, MessagesService],
})
export class AppModule {}
