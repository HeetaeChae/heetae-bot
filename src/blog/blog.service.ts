import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import { SupabaseService } from 'src/common/services/supabase.service';
import { GptService } from 'src/common/services/gpt.service';
import { PexelsService } from 'src/common/services/pexels.service';
import { YouTubeService } from 'src/common/services/yotube.service';
import { WrtnService } from 'src/common/services/wrtn.service';
import { TistoryService } from 'src/common/services/tistory.service';

import * as crypto from 'crypto';
import {
  getPromptForHashtags,
  getPromptForImgQuery,
} from 'src/common/contants/prompts';
import { getImgTag, getYoutubeLinkTag } from 'src/common/contants/tags';
import { DateService } from 'src/common/services/date.service';
import { UtilsService } from 'src/common/services/utils.service';
import { PuppeteerService } from 'src/common/services/puppeteer.service';
import { ConfigService } from '@nestjs/config';

globalThis.crypto = crypto as Crypto;

type Category = 'health' | 'pet' | 'business';

@Injectable()
export class BlogService {
  constructor(
    private supabaseService: SupabaseService,
    private gptService: GptService,
    private pexelsService: PexelsService,
    private youtubeService: YouTubeService,
    private wrtnService: WrtnService,
    private tistoryService: TistoryService,
    private dateService: DateService,
    private utilsService: UtilsService,
    private puppeteerService: PuppeteerService,
    private configService: ConfigService,
  ) {}

  async saveKeyword(
    category: string,
    primaryKeyword: string,
    longTailKeyword: string,
  ): Promise<{ status: 200; message: string }> {
    try {
      const { data } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .insert({
          category,
          primary_keyword: primaryKeyword,
          long_tail_keyword: longTailKeyword,
        })
        .select('id');

      const id = data[0]?.id;
      const message = `생성된 키워드 id: ${id}`;

      return { status: 200, message };
    } catch (error) {
      throw new Error();
    }
  }

  // [SUPABSE] 마지막 키워드 데이터 가져오기
  async getLastKeywordData(
    category: Category,
  ): Promise<{ primary: string | null }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .select('primary_keyword')
      .eq('category', category)
      .order('posted_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw new Error();
    }

    return { primary: (data?.primary_keyword as string) ?? null };
  }

  // [SUPABSE] 키워드 데이터 가져오기
  async getKeywordData(
    category: string,
    lastPrimaryKeyword: string | null,
  ): Promise<{
    id: number;
    primary: string;
    longTail: string;
  }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .select('*')
      .neq('primary_keyword', lastPrimaryKeyword)
      .eq('category', category)
      .is('posted_at', null)
      .limit(1)
      .single();

    if (!data) {
      throw new Error();
    }
    if (error) {
      throw new Error();
    }

    const { id, primary_keyword: primary, long_tail_keyword: longTail } = data;
    return { id, primary, longTail };
  }

  // [SUPABASE] 첨부할 데이터 가져오기
  async getRelatingData(
    primaryKeyword: string,
  ): Promise<{ id: number; postingUrl: string }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .select('*')
      .not('posted_at', 'is', null)
      .eq('primary_keyword', primaryKeyword)
      .is('related_posting_url', null)
      .limit(1);

    if (error) {
      throw new Error();
    }

    return {
      id: data[0]?.id ?? null,
      postingUrl: data[0]?.posting_url ?? null,
    };
  }

  // [SUPABASE] 첨부 데이터 업데이트
  async updateRelatingData(
    relatingId: number,
    postingUrl: string,
  ): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .update({ related_posting_url: postingUrl })
      .eq('id', relatingId);

    if (error) {
      throw new Error();
    }
  }

  // [SUPABSE] 키워드 데이터 업데이트
  async updateKeywordData(
    id: number,
    postingUrl: string,
    relatingPostingUrl: string,
  ): Promise<void> {
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const { error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .update({
        updated_at: currentTime,
        posted_at: currentTime,
        posting_url: postingUrl,
        relating_posting_url: relatingPostingUrl,
      })
      .eq('id', id);

    if (error) {
      throw new Error();
    }
  }

  //
  async createRelatingPostingUrlTag(relatingPostingUrl: string | null) {
    return relatingPostingUrl ? `<a src="${relatingPostingUrl}" />` : '';
  }

  // [GPT] 해시태그 리스트 생성하기
  async createHashTagList(keyword: string): Promise<string[]> {
    const prompt = getPromptForHashtags(keyword);
    const hashtags = await this.gptService.generateGptResponse(prompt, 0.7);
    const hastagList = hashtags.split(', ');

    return hastagList;
  }

  // [PEXELS, GPT] 이미지 태그 리스트 생성하기
  async createImgTagList(keyword: string, count: number) {
    const prompt = getPromptForImgQuery(keyword);
    const query = await this.gptService.generateGptResponse(prompt, 0.7);
    const photos = await this.pexelsService.getPexelsPhotos(query, count);
    const imgTagList = photos.map((photo: any) =>
      getImgTag(photo?.src?.small, photo?.alt),
    );
    return imgTagList;
  }

  // [YOUTUBE] 유튜브 링크 태그 생성하기
  async createYotubeLinkTag(keyword: string) {
    const youtubeItems = await this.youtubeService.getYoutubeItems(keyword, 1);
    const youtubeInfo = youtubeItems[0] ?? null;

    if (!youtubeInfo) {
      return '';
    }

    const youtubeLinkTag = getYoutubeLinkTag(
      youtubeInfo?.link,
      youtubeInfo?.title,
      youtubeInfo?.description,
      youtubeInfo?.channelTitle,
      youtubeInfo?.thumbnailUrl,
    );
    return youtubeLinkTag;
  }

  // [CONTENTS] 포스팅 내용 생성
  async createPostingContent(tagList: string[], keyword: string) {
    const imgCount = tagList.filter((tag) => tag.includes('h3')).length;
    const imgTagList = await this.createImgTagList(keyword, imgCount);

    let imgTagOrder = 0;

    const newTagList = [];

    for (const tag of tagList) {
      if (tag.includes('h3')) {
        const imgTag = imgTagList[imgTagOrder];
        newTagList.push(imgTag);
        imgTagOrder += 1;
      }
      newTagList.push(tag);
    }

    const youtubeLinkTag = await this.createYotubeLinkTag(keyword);
    newTagList.push(youtubeLinkTag);

    return newTagList.join('');
  }

  async testHandleRange() {
    const targetMin = 0;
    const targetMax = 100000;

    const { browser, page } = await this.puppeteerService.getBrowser();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://www.google.com/travel/search?q=후쿠오카'),
    ]);

    await page.click(
      '.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.ksBjEc.lKxP2d.LQeN7.bRx3h.x4Vnpe.yJQRU.sIWnMc.hNyRxf.cd29Sd',
    );

    await this.utilsService.delayRandomTime('quick');

    const sliderEl = await page.waitForSelector(
      '.undefined.Cs7q4e.UlwoYd.VfPpkd-SxecR.VfPpkd-SxecR-OWXEXe-ALTDOd.VfPpkd-SxecR-OWXEXe-vhhrIe',
    );
    const sliderBox = await sliderEl.boundingBox();

    const minX = sliderBox.x;
    const maxX = sliderBox.x + sliderBox.width;
    const y = sliderBox.y + sliderBox.height / 2;

    await page.mouse.move(minX, y);
    await page.mouse.down();

    let minPrice = 0;
    let curMinX = minX;
    while (minPrice <= targetMin) {
      curMinX += 3;
      await page.mouse.move(curMinX, y);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const priceText = await page.$$eval(
        '.VfPpkd-MIfjnf-uDEFge-fmcmS',
        (els) => els[0]?.textContent?.replace(/[^\d]/g, ''),
      );
      const price = Number(priceText);
      minPrice = price;
    }

    await page.mouse.up();

    await page.mouse.move(maxX, y);
    await page.mouse.down();

    let maxPrice = 1000000;
    let curMaxX = maxX;
    while (maxPrice >= targetMax) {
      curMaxX -= 3;
      await page.mouse.move(curMaxX, y);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const priceText = await page.$$eval(
        '.VfPpkd-MIfjnf-uDEFge-fmcmS',
        (els) => els[1]?.textContent?.replace(/[^\d]/g, ''),
      );
      const price = Number(priceText);
      maxPrice = price;
    }

    await page.mouse.up();
  }
}
