import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('version')
  version() {
    return { "version": 'v0.0.1' };
  }
}
