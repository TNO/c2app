import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller.js';
import { KafkaService } from './services/kafka.service.js';
import { DefaultWebSocketGateway } from './gateway/default-websocket.gateway.js';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from './messages/messages.module.js';
import { MessagesService } from './messages/messages.service.js';
import { join } from 'path';
import { cwd } from 'process';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      serveRoot: "/layer_styles",
      rootPath: join(cwd(), 'layer_styles'),
    }),
    ServeStaticModule.forRoot({
      serveRoot: "/",
      rootPath: join(cwd(), 'public'),
    }),
    HttpModule, ConfigModule.forRoot(), MessagesModule],
  controllers: [AppController],
  providers: [DefaultWebSocketGateway, MessagesService, KafkaService],
})
export class AppModule { }
