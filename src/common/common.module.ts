import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';
import { DateService } from './date.service';

@Module({
  providers: [PuppeteerService, UtilsService, DateService],
  exports: [PuppeteerService, UtilsService, DateService],
})
export class CommonModule {}
