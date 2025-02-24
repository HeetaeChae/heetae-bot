import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { SupabaseService } from 'src/common/supabase.service';
import { GptService } from 'src/common/gpt.service';
import { UtilsService } from 'src/common/utils.service';

// Node.js 환경에서 crypto 모듈 설정
import * as crypto from 'crypto';
import { blogPrompts } from 'src/prompts/blog-prompts';
globalThis.crypto = crypto as Crypto;

@Injectable()
export class TistoryService {
  constructor(
    private puppeteerService: PuppeteerService,
    private supabaseService: SupabaseService,
    private gptService: GptService,
    private utilsService: UtilsService,
  ) {}

  async getKeywordBySupabase() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keyword')
      .select('keyword')
      .eq('category', 'business')
      .eq('is_used', false);

    if (error) {
      throw new Error(`supabse 쿼리 오류 ${error.message}`);
    }

    if (data.length === 0 || !data) {
      throw new Error('supabse 데이터가 없습니다.');
    }

    const randomIdx = Math.floor(Math.random() * data.length);
    return data[randomIdx];
  }

  async createKeywords(category: string, keyword: string) {
    const prompt = blogPrompts.longTailKeywords(keyword);
    const gptJsonRes = await this.gptService.generateGptResponse(prompt, 0.7);
    const { long_tail_keywords: longTailKeywords } = JSON.parse(gptJsonRes);
    // blog_keyword 생성
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keyword')
      .insert({ category, content: keyword })
      .select('id');
    if (error || !data.length) throw new Error('blog_keyword 생성 오류.');
    const keywordId = data[0]?.id;
    // blog_long_tail_keyword 생성
    const longTailKeywordContents = [];
    for (const longTailKeyword of longTailKeywords) {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('blog_long_tail_keyword')
        .insert({ keyword_id: keywordId, content: longTailKeyword })
        .select('content');
      if (error || !data.length)
        throw new Error('blog_long_tail_keyword 생성 오류.');
      longTailKeywordContents.push(data[0]?.content);
    }
    const message = `생성된 키워드: ${longTailKeywordContents.join(',')}`;
    return { status: 200, message };
  }

  /*
  @Cron('0 8-23,0 * * *')
  async scheduleTistoryPost() {
    const { keyword } = await this.getKeywordBySupabase();
    const jsonContent = await this.getGptResponse('외이도염');
    console.log(jsonContent);
    const contentData = JSON.parse(jsonContent);

    console.log(contentData);
  }
  */

  async stealTistoryPostings() {
    const { browser, page } = await this.puppeteerService.getBrowser();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://www.tistory.com/search'),
    ]);
    await this.utilsService.delayRandomTime('slow');
    await page.type('#blogSearchInput', '기침감기 빨리 낫는법', { delay: 500 });
    await page.keyboard.press('Enter');
    await this.utilsService.delayRandomTime('slow');
    const postingUrls = await page.$$eval('.link_cont.zoom_cont', (elements) =>
      elements.map((element) => element.getAttribute('href')),
    );
    for (let i = 0; i <= 2; i += 1) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(postingUrls[i]),
      ]);
      await this.utilsService.delayRandomTime('slow');
      const textArray = await page.$eval(
        '.tt_article_useless_p_margin.contents_style',
        (parent) =>
          Array.from(parent.querySelectorAll(':scope > *')) // 최상위 자식 요소 선택
            .map((element) => {
              // a 태그가 최상위 요소가 아니더라도 내부에서 제거
              element.querySelectorAll('a').forEach((a) => a.remove());
              // 텍스트 가져오기
              return element.textContent.trim();
            })
            .filter(
              (text) =>
                text.length > 0 && // 빈 문자열 제거
                !text.includes(
                  '(adsbygoogle = window.adsbygoogle || []).push({});',
                ),
            ),
      );
      console.log(textArray);
      const formattedText = textArray
        .map((text) => text.replace(/\s+/g, ' ').trim())
        .join(' ');
      console.log(formattedText);
    }
    await this.utilsService.delayRandomTime('slow');
    await browser.close();
  }
}
