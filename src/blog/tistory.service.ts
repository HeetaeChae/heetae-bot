import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { SupabaseService } from 'src/common/supabase.service';
import { GptService } from 'src/common/gpt.service';
import { UtilsService } from 'src/common/utils.service';

// Node.js 환경에서 crypto 모듈 설정
import * as crypto from 'crypto';
globalThis.crypto = crypto as Crypto;

@Injectable()
export class TistoryService {
  constructor(
    private puppeteerService: PuppeteerService,
    private supabaseService: SupabaseService,
    private gptService: GptService,
    private utilsService: UtilsService,
  ) {}

  // 0 ~ 60분 랜덤하게 딜레이
  async delayScheduling() {
    const delayMinutes = Math.floor(Math.random() * 60); // 0~59분 랜덤 생성
    const delayMilliseconds = delayMinutes * 60 * 1000; // 밀리초 변환

    await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
  }

  // 키워드 생성
  async saveKeyword(
    category: string,
    primaryKeyword: string,
    longTailKeyword: string,
  ) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .insert({
        category,
        primary_keyword: primaryKeyword,
        long_tail_keyword: longTailKeyword,
      })
      .select('id');

    if (error)
      throw new Error(
        `supabse: blog_keywords 데이터 생성 오류.\n${error.message}`,
      );

    const id = data[0]?.id;
    const message = `생성된 키워드 id: ${id}`;

    return { status: 200, message };
  }

  // 마지막 primary_keyword 값 가져오기
  async getLastPrimaryKeyword(category: string): Promise<string | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .select('primary_keyword')
      .eq('category', category)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(
        `supabase: 마지막 primary_keyword 가져오기 오류.\n${error.message}`,
      );
    }

    return data[0]?.primary_keyword || null;
  }

  // long_tail_keyword 값 가져오기
  async getKeywordData(
    category: string,
    lastPrimaryKeyword: string | null,
  ): Promise<{
    keywordId: number;
    primaryKeyword: string;
    longTailKeyword: string;
  }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .select('*')
      .neq('primary_keyword', lastPrimaryKeyword)
      .eq('category', category)
      .eq('is_used', false);

    if (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabase: keyword data 가져오기 오류.\n${error.message}`,
      });
    }

    if (!data.length) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'supabase: keyword data 데이터 없음.',
      });
    }

    const randomIdx = Math.floor(Math.random() * data.length);
    const { id, primary_keyword, long_tail_keyword } = data[randomIdx];

    return {
      keywordId: id,
      primaryKeyword: primary_keyword,
      longTailKeyword: long_tail_keyword,
    };
  }

  async getHtmlFromWriten(keyword: string) {
    try {
      const { browser, page } = await this.puppeteerService.getBrowser();
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto('https://wrtn.ai'),
      ]);

      // 모달 닫기
      await this.utilsService.delayRandomTime('slow');
      await page.click('.css-12wvnvt', { delay: 1000 });

      // 키워드 타이핑
      await this.utilsService.delayRandomTime('slow');
      await page.type('.css-156cis4', keyword, { delay: 500 });
      await page.keyboard.press('Enter');

      // html 긁기
      await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 10)); // 10분 대기
      const html = await page.$('#chat-room-message-1 > .css-1j17jy3');

      await browser.close();
      return html;
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `puppeteer: 뤼튼 ai 작동중 오류. ${error.message}`,
      });
    }
  }

  // relating_posting_url 값 가져오기
  async getRelatingData(
    primaryKeyword: string,
  ): Promise<{ relatingId: number; relatingPostingUrl: string } | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .select('*')
      .eq('primaryKeyword', primaryKeyword)
      .eq('is_used', true)
      .eq('related_posting_url', null);

    if (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabase: keyword data 가져오기 오류.\n${error.message}`,
      });
    }

    if (!data.length) {
      return null;
    }

    const randomIdx = Math.floor(Math.random() * data.length);
    const { id, posting_url } = data[randomIdx];

    return {
      relatingId: id,
      relatingPostingUrl: posting_url,
    };
  }

  async uploadTistoryPosting(
    contents: string,
    relatingPostingUrl: string | null,
  ) {}

  async updateRelatingData(relatingId: number) {}

  async handleTistoryPosting() {
    // 키워드 가져오기
    const category = 'health';
    const lastPrimaryKeyword = await this.getLastPrimaryKeyword(category);
    const { keywordId, primaryKeyword, longTailKeyword } =
      await this.getKeywordData(category, lastPrimaryKeyword);

    // html 가져오기
    const html = await this.getHtmlFromWriten(longTailKeyword);

    // 컨텐츠 html 생성
    const contents = '';

    // 첨부할 url 가져오기
    const relatingData = await this.getRelatingData(primaryKeyword);

    // 포스팅 업로드
    const postingUrl = await this.uploadTistoryPosting(
      contents,
      relatingData.relatingPostingUrl,
    );

    // 첨부된 데이터 업데이트

    if (relatingData) {
      await this.updateRelatingData(relatingData.relatingId);
    }

    console.log('keywordId', keywordId);
    console.log('longTailKeyword', longTailKeyword);
    console.log('html', html);

    return { keywordId, longTailKeyword, html };
  }

  @Cron('0 8-23/3 * * *')
  async scheduleTistoryPosting() {
    await this.delayScheduling();
    await this.handleTistoryPosting();
  }
}
