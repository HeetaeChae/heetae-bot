import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { UtilsService } from './utils.service';
import { DateService } from './date.service';
import { GptService } from './gpt.service';
import { SupabaseService } from './supabase.service';
import { PexelsService } from './pexels.service';
import { YouTubeService } from './yotube.service';
import { WrtnService } from './wrtn.service';
import { TistoryService } from './tistory.service';

@Module({
  imports: [],
  providers: [
    PuppeteerService,
    UtilsService,
    DateService,
    GptService,
    SupabaseService,
    PexelsService,
    YouTubeService,
    WrtnService,
    TistoryService,
  ],
  exports: [
    PuppeteerService,
    UtilsService,
    DateService,
    GptService,
    SupabaseService,
    PexelsService,
    YouTubeService,
    WrtnService,
    TistoryService,
  ],
})
export class CommonModule {}
