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
    if (error || !data.length) throw new Error('blog_keywords 생성 오류.');
    const id = data[0]?.id;
    const message = `생성된 키워드 id: ${id}`;
    return { status: 200, message };
  }

  // 키워드 가져오기
  async getKeyword(category: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_keywords')
      .select('*')
      .eq('category', category)
      .eq('is_used', false);
    if (error || !data.length) throw new Error(`blog_keywords 받기 오류.`);
    const randomIdx = Math.floor(Math.random() * data.length);
    const { id, long_tail_keyword } = data[randomIdx];
    return { id, keyword: long_tail_keyword };
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

  async stealTistoryPostings(keyword: string) {
    const { browser, page } = await this.puppeteerService.getBrowser();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://www.tistory.com/search'),
    ]);
    await this.utilsService.delayRandomTime('slow');
    await page.type('#blogSearchInput', keyword, { delay: 500 });
    await page.keyboard.press('Enter');
    await this.utilsService.delayRandomTime('slow');
    const postingUrls = await page.$$eval('.link_cont.zoom_cont', (elements) =>
      elements.map((element) => element.getAttribute('href')),
    );
    const references = [];
    for (let i = 0; i <= 2; i += 1) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(postingUrls[i]),
      ]);
      await this.utilsService.delayRandomTime('slow');
      const textArray = await page.$eval('.contents_style', (parent) =>
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
      const formattedText = textArray
        .map((text) => text.replace(/\s+/g, ' ').trim())
        .join(' ');
      references.push(formattedText);
    }
    await browser.close();
    return references
      .map((text, index) => `자료 ${index + 1}.\n${text}`)
      .join('\n\n');
  }

  async uploadTistoryPost() {
    // 키워드 가져오기
    const { id, keyword } = await this.getKeyword('health');
    console.log(keyword);
    // 참조자료 추출하기
    // const references = await this.stealTistoryPostings(keyword);
    // console.log(references);
    // 콘텐츠 생성하기
    const prompt = blogPrompts.creatingTistoryContents(keyword);
    const contents = await this.gptService.generateGptResponse(prompt, 1);
    console.log(contents);
    return contents;
    // 포스팅하기
  }
}
