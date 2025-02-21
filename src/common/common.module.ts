import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';
import { DateService } from './date.service';
import { GptService } from './gpt.service';
import { SupabaseService } from './supabase.service';

@Module({
  imports: [],
  providers: [
    PuppeteerService,
    UtilsService,
    DateService,
    GptService,
    SupabaseService,
  ],
  exports: [
    PuppeteerService,
    UtilsService,
    DateService,
    GptService,
    SupabaseService,
  ],
})
export class CommonModule {}
