import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { SupabaseService } from 'src/common/supabase.service';
import { GptService } from 'src/common/gpt.service';
import { UtilsService } from 'src/common/utils.service';
import { PexelsService } from 'src/common/pexels.service';
import { YouTubeService } from 'src/common/yotube.service';
import { blogPrompts } from 'src/prompts/blog-prompts';

import * as crypto from 'crypto';
globalThis.crypto = crypto as Crypto;

type Category = 'health' | 'pet' | 'business';

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

  async getLastPrimaryKeyword(category: Category): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .select('primary_keyword')
        .eq('category', category)
        .order('posted_at', { ascending: false })
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
        .is('posted_at', null);

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

  async getContentListFromWrtn(keyword: string): Promise<void> {
    try {
      const { browser, page } = await this.puppeteerService.getBrowser();

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto('https://wrtn.ai'),
      ]);

      // 모달 닫기
      await this.utilsService.delayRandomTime('slow');
      await page.click('.css-12wvnvt', { delay: 1000 });

      // 프롬프트 타이핑
      await this.utilsService.delayRandomTime('quick');
      await page.type(
        '.css-156cis4',
        blogPrompts.wrtn('숙면의 중요성').replace(/\n/g, ' '),
        { delay: 30 },
      );
      await page.keyboard.press('Enter');

      // html 긁기
      await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 0.5)); // 1분 대기

      const domTree = await page.evaluate((selector) => {
        function serializeElement(element: Element) {
          console.log(element);
          if (!element) return null; // 요소가 없을 경우 예외 처리

          // 텍스트 노드만 있는 경우 처리
          if (element.nodeType === Node.TEXT_NODE) {
            const trimmedText = element.nodeValue.trim();
            return trimmedText ? { type: 'text', content: trimmedText } : null;
          }

          // 요소의 태그명 가져오기
          const tagName = element.tagName.toLowerCase();

          // 자식 요소들 객체화 (재귀 호출)
          const children = Array.from(element.childNodes)
            .map(serializeElement)
            .filter((child) => child !== null); // 빈 값 제거

          // 최종 구조 반환
          return {
            type: tagName,
            content:
              children.length > 0 ? children : element.textContent.trim(),
          };
        }

        // 🔥 특정 요소 내부만 분석
        const targetElement = document.querySelector(selector);
        return serializeElement(targetElement);
      }, '#chat-room-message-1 > .css-1j17jy3'); // 🔥 여기에 특정 요소의 선택자 입력

      console.log(domTree);
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
        .neq('posted_at', null)
        .eq('primaryKeyword', primaryKeyword)
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

  async createHtmlContent(contentList: { type: string; content: string }[]) {
    let htmlContent = [];
    for (const contentData of contentList) {
      const { type, content } = contentData;

      if (type === 'h1') {
      }
      if (type === 'h2') {
      }
      if (type === 'h3') {
      }
      if (type === 'p') {
      }
      if (type === 'span') {
      }
      if (type === 'ul') {
      }
      if (type === 'li') {
      }
    }

    return htmlContent;
  }

  async uploadTistoryPosting() {
    return '';
  }

  async updateRelatingData(
    relatingId: number,
    postingUrl: string,
  ): Promise<void> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .update({ related_posting_url: postingUrl })
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

  async handleTistoryPosting(category: Category) {
    // 키워드 데이터 가져오기
    const lastPrimaryKeyword = await this.getLastPrimaryKeyword(category);
    const keywordData = await this.getKeywordData(category, lastPrimaryKeyword);
    // 콘텐트 리스트 가져오기
    const contentList = await this.getContentListFromWrtn(
      keywordData.longTailKeyword,
    );
    console.log(contentList);
    /*
    // 포스팅할 컨텐츠 생성
    const htmlContent = await this.createHtmlContent(contentList);
    // 포스팅 업로드
    const postingUrl = await this.uploadTistoryPosting();
    // 첨부할 데이터 가져오기
    const relatingData = await this.getRelatingData(keywordData.primaryKeyword);
    // 첨부된 데이터 업데이트
    await this.updateRelatingData(relatingData.id, postingUrl);
    // 키워드 데이터 업데이트
    await this.updateKeywordData(
      keywordData.id,
      postingUrl,
      relatingData.postingUrl,
    );
    */
  }

  @Cron('0 8-23/3 * * *')
  async scheduleTistoryHealthPosting() {
    await this.delayScheduling();
    await this.handleTistoryPosting('health');
  }
}
