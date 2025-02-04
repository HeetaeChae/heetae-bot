import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';
import { DateService } from './date.service';
import { GptService } from './gpt.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [PuppeteerService, UtilsService, DateService, GptService],
  exports: [PuppeteerService, UtilsService, DateService, GptService],
})
export class CommonModule {}
