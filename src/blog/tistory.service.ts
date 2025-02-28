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
import { PexelsService } from 'src/common/pexels.service';
import { YouTubeService } from 'src/common/yotube.service';
import { ConfigService } from '@nestjs/config';
globalThis.crypto = crypto as Crypto;

@Injectable()
export class TistoryService {
  constructor(
    private puppeteerService: PuppeteerService,
    private supabaseService: SupabaseService,
    private gptService: GptService,
    private utilsService: UtilsService,
    private pexelsService: PexelsService,
    private youtubeService: YouTubeService,
    private configService: ConfigService,
  ) {}

  async delayScheduling() {
    const delayMinutes = Math.floor(Math.random() * 60);
    const delayMilliseconds = delayMinutes * 60 * 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
  }

  async saveKeyword(
    category: string,
    primaryKeyword: string,
    longTailKeyword: string,
  ): Promise<{ status: 200; message: string }> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .insert({
          category,
          primary_keyword: primaryKeyword,
          long_tail_keyword: longTailKeyword,
        })
        .select('id');

      if (error) throw error;

      const id = data[0]?.id;
      const message = `생성된 키워드 id: ${id}`;

      return { status: 200, message };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `supabse: blog_keywords 데이터 생성 오류.\n${error.message}`,
      );
    }
  }

  async getLastPrimaryKeyword(category: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .select('primary_keyword')
        .eq('category', category)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data[0]?.primary_keyword || null;
    } catch (error) {
      console.error(error);
      throw new Error(
        `supabase: 마지막 primary_keyword 가져오기 오류.\n${error.message}`,
      );
    }
  }

  async getKeywordData(
    category: string,
    lastPrimaryKeyword: string | null,
  ): Promise<{
    id: number;
    primaryKeyword: string;
    longTailKeyword: string;
  }> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .select('*')
        .neq('primary_keyword', lastPrimaryKeyword)
        .eq('category', category)
        .eq('is_used', false);

      if (error) throw error;
      if (!data.length) {
        throw new NotFoundException({
          statusCode: 404,
          message: 'supabase: keyword data 데이터 없음.',
        });
      }

      const randomIdx = Math.floor(Math.random() * data.length);
      const {
        id,
        primary_keyword: primaryKeyword,
        long_tail_keyword: longTailKeyword,
      } = data[randomIdx];

      return { id, primaryKeyword, longTailKeyword };
    } catch (error) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabase: keyword data 가져오기 오류.\n${error.message}`,
      });
    }
  }

  async getContentListFromWrtn(
    keyword: string,
  ): Promise<{ type: string; content: string }[]> {
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
      const parentEl = await page.$('#chat-room-message-1 > .css-1j17jy3');
      const contentList = await parentEl.evaluate((el) => {
        return Array.from(el.children).map((child) => ({
          type: child.tagName.toLowerCase(),
          content: (child as HTMLElement).innerText.trim(),
        }));
      }, parentEl);

      await browser.close();
      return contentList;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `wrtn,puppeteer: puppeteer로 뤼튼 ai 작동중 오류. ${error.message}`,
      });
    }
  }

  async getRelatingData(
    primaryKeyword: string,
  ): Promise<{ id: number; postingUrl: string } | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .select('*')
        .eq('primaryKeyword', primaryKeyword)
        .eq('is_used', true)
        .eq('related_posting_url', null);

      if (error) {
        throw error;
      }
      if (!data.length) {
        return null;
      }

      const randomIdx = Math.floor(Math.random() * data.length);
      const { id, posting_url } = data[randomIdx];

      return {
        id,
        postingUrl: posting_url,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabase: keyword data 가져오기 오류.\n${error.message}`,
      });
    }
  }

  async createPostingContents(
    contentList: { type: string; content: string }[],
  ) {
    let contents = [];
    for (const content of contentList) {
      switch (content.type) {
        case 'h1':
          break;
        case 'h2':
          break;
        case 'h3':
          break;
        case 'p':
          break;
        case 'ul':
          break;
        case 'li':
          break;
      }
    }

    return contents;
  }

  async uploadTistoryPosting() {
    return '';
  }

  async updateRelatingData(relatingId: number): Promise<void> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .update({ relating_posting_url: true })
        .eq('id', relatingId);

      if (error) throw error;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabse: relating 데이터 업데이트 오류.\n${error.message}`,
      });
    }
  }

  async updateKeywordData(
    keywordId: number,
    postingUrl: string,
    relatingPostingUrl: string,
  ): Promise<void> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .update({
          updated_at: '',
          is_used: true,
          posting_url: postingUrl,
          relating_posting_url: relatingPostingUrl,
        })
        .eq('id', keywordId);

      if (error) throw error;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabse: keyword 데이터 업데이트 오류.\n${error.message}`,
      });
    }
  }

  async handleTistoryPosting() {
    // 키워드 데이터 가져오기
    const category = 'health';
    const lastPrimaryKeyword = await this.getLastPrimaryKeyword(category);
    const keywordData = await this.getKeywordData(category, lastPrimaryKeyword);
    // 첨부할 데이터 가져오기
    const relatingData = await this.getRelatingData(keywordData.primaryKeyword);
    // 콘텐트 리스트 가져오기
    const contentList = await this.getContentListFromWrtn(
      keywordData.longTailKeyword,
    );
    // 포스팅할 컨텐츠 생성
    const contents = await this.createPostingContents(contentList);
    // 포스팅 업로드
    const postingUrl = await this.uploadTistoryPosting();
    // 첨부된 데이터 업데이트
    await this.updateRelatingData(relatingData.id);
    // 키워드 데이터 업데이트
    await this.updateKeywordData(
      keywordData.id,
      postingUrl,
      relatingData.postingUrl,
    );
  }

  @Cron('0 8-23/3 * * *')
  async scheduleTistoryPosting() {
    await this.delayScheduling();
    await this.handleTistoryPosting();
  }

  async getPhotosFromPexels() {
    const photos = await this.pexelsService.getPexelsPhotos('duck');
    return photos;
  }

  async getItemsFromYoutube() {
    const items = await this.youtubeService.getYoutubeItems(
      '환절기 감기 예방법',
      5,
    );
    return items;
  }

  async connectToTistory() {
    const { browser, page } = await this.puppeteerService.getBrowser();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://www.google.com'),
    ]);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://www.tistory.com'),
    ]);

    // 로그인 클릭
    await this.utilsService.delayRandomTime('slow');
    await page.click('.my_tistory.box_mylogin .txt_login');

    // 모달 로그인 클릭
    await this.utilsService.delayRandomTime('slow');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('.login_tistory .txt_login'),
    ]);

    // 계정 입력
    await this.utilsService.delayRandomTime('slow');
    await page.type(
      '#loginId--1',
      this.configService.get<string>('TISTORY_EMAIL'),
      { delay: Math.random() * (300 - 100) + 100 },
    );
    await page.type(
      '#password--2',
      this.configService.get<string>('TISTORY_PASS'),
      { delay: Math.random() * (300 - 100) + 100 },
    );

    // 접속 클릭
    await this.utilsService.delayRandomTime('quick');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('.submit'),
    ]);

    // 글쓰기 페이지로
    await this.utilsService.delayRandomTime('slow');
    const hrefs = await page.$$eval('.link_tab', (els) =>
      els.map((el) => el.getAttribute('href')).filter((href) => href !== '#'),
    );
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto(hrefs[0]),
    ]);

    // html 글쓰기 모드로 변환
    await this.utilsService.delayRandomTime('slow');
    await page.keyboard.press('Escape');
    await this.utilsService.delayRandomTime('quick');
    await page.click('#editor-mode-layer-btn-open');
    await this.utilsService.delayRandomTime('quick');
    const menus = await page.$$('#mceu_31-body');
    console.log(menus);
    await menus[2].click();
    await page.keyboard.press('Enter');

    browser.close();
  }
}
