import { Controller, Get } from '@nestjs/common';
import { SafrConfig } from 'c2app-models-utils';

@Controller()
export class AppController {
  @Get('version')
  version() {
    return { version: 'v0.0.1' };
  }

  @Get('config')
  config() {
    console.log('Get config');
    return {
      VECTOR_TILE_SERVER: process.env.VECTOR_TILE_SERVER,
      SOCKET_PATH: process.env.SOCKET_PATH,
    } as SafrConfig;
  }
}
