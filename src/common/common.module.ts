import { Module } from '@nestjs/common';
import { PuppeteerService } from './services/puppeteer.service';
import { UtilsService } from './services/utils.service';
import { DateService } from './services/date.service';
import { GptService } from './services/gpt.service';
import { SupabaseService } from './services/supabase.service';
import { PexelsService } from './services/pexels.service';
import { YouTubeService } from './services/yotube.service';
import { WrtnService } from './services/wrtn.service';
import { TistoryService } from './services/tistory.service';

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
