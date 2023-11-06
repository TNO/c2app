import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller.js';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from './messages/messages.module.js';
import { join } from 'path';
import { cwd } from 'process';
import { KafkaModule } from './services/kafka.module.js';
import { GatewayModule } from './gateway/gateway.module.js';

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
    HttpModule, ConfigModule.forRoot(), GatewayModule, MessagesModule, KafkaModule],
  controllers: [AppController],
})
export class AppModule { }
