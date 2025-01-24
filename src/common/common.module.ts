import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';

@Module({
  providers: [PuppeteerService, UtilsService],
  exports: [PuppeteerService, UtilsService],
})
export class CommonModule {}
