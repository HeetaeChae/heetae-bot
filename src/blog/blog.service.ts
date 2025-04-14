import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import { SupabaseService } from 'src/common/services/supabase.service';
import { GptService } from 'src/common/services/gpt.service';
import { PexelsService } from 'src/common/services/pexels.service';
import { YouTubeService } from 'src/common/services/yotube.service';
import { WrtnService } from 'src/common/services/wrtn.service';
import { htmlStyleMap } from 'src/common/contants/styles';
import { TistoryService } from 'src/common/services/tistory.service';

import * as crypto from 'crypto';
import {
  getPromptForHashtags,
  getPromptForImgKeyword,
  getPromptForImgQuery,
} from 'src/common/contants/prompts';
import {
  getImgContainerTag,
  getImgTag,
  getIndexLiTag,
  getIndexTag,
  getYoutubeLinkTag,
} from 'src/common/contants/tags';
import { DateService } from 'src/common/services/date.service';
import { UtilsService } from 'src/common/services/utils.service';
import { PuppeteerService } from 'src/common/services/puppeteer.service';

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

  /*
  async handleTistoryPosting(category: Category) {
    // [START] 티스토리 포스팅 자동화 프로세스 시작!
    console.log(
      '##### [START] 티스토리 포스팅 자동화 프로세스 시작: ',
      this.dateService.getCurrentTime(),
    );

    // [SUPABSE] 마지막 대표 키워드 가져오기
    const lastKeywordData = await this.getLastKeywordData(category);
    console.log(
      '##### [SUPABSE] 마지막 키워드 데이터 가져오기: ',
      lastKeywordData,
    );

    // [SUPABSE] 키워드 데이터
    const keywordData = await this.getKeywordData(
      category,
      lastKeywordData.primary,
    );
    console.log('##### [SUPABSE] 키워드 데이터 가져오기: ', keywordData);

    // [WRTN] Element Tree 가져오기
    const elementData = await this.wrtnService.getElementData(
      keywordData.longTail,
    );
    console.log('##### [WRTN] Element Tree 가져오기: ', elementData);

    // [SUPABSE] 링크첨부 데이터 가져오기
    const relatingData = await this.getRelatingData(keywordData.primary);
    console.log('##### [SUPABSE] 링크첨부 데이터 가져오기: ', relatingData);

    // [CONTENTS] 컨텐츠 데이터 생성
    const contentsData = await this.createPostingContents(
      elementTree,
      keywordData.longTail,
      relatingData.postingUrl,
    );
    console.log('##### [CONTENTS] 컨텐츠 데이터 생성하기: ', contentsData);

    // [TISTORY] 티스토링 포스팅 업로드
    const postingData = await this.tistoryService.uploadPosting(
      contentsData.title,
      contentsData.HTMLContent,
      contentsData.hashTags,
    );
    console.log('##### [TISTORY] 티스토리 포스팅 업로드: ', postingData);

    // [SUPABASE] 첨부된 데이터 업데이트
    if (relatingData.id && relatingData.postingUrl) {
      await this.updateRelatingData(relatingData.id, relatingData.postingUrl);
    }

    // 키워드 데이터 업데이트
    await this.updateKeywordData(
      keywordData.id,
      postingUrl,
      relatingData.postingUrl,
    );

    // [START] 티스토리 포스팅 자동화 프로세스 종료!
    console.log(
      '##### [START] 티스토리 포스팅 자동화 프로세스 종료: ',
      this.dateService.getCurrentTime(),
    );
  }

  @Cron('0 8-23/3 * * *')
  async scheduleTistoryPostingAboutHealth() {
    await this.handleTistoryPosting('health');
  }
  */

  async testRenderPart() {
    const category = 'health';

    // [START] 티스토리 포스팅 자동화 프로세스 시작!
    console.log(
      '##### [START] 티스토리 포스팅 자동화 프로세스 시작: ',
      this.dateService.getCurrentTime(),
    );

    // [SUPABSE] 마지막 대표 키워드 가져오기
    const lastKeywordData = await this.getLastKeywordData(category);
    console.log(
      '##### [SUPABSE] 마지막 키워드 데이터 가져오기: ',
      lastKeywordData,
    );

    // [SUPABSE] 키워드 데이터 가져오기
    const keywordData = await this.getKeywordData(
      category,
      lastKeywordData.primary,
    );
    console.log('##### [SUPABSE] 키워드 데이터 가져오기: ', keywordData);

    // [WRTN] Element 데이터 가져오기
    const elementData = await this.wrtnService.getElementData(
      keywordData.longTail,
    );
    console.log('##### [WRTN] Element Tree 가져오기: ', elementData);

    // [SUPABSE] 링크첨부 데이터 가져오기
    const relatingData = await this.getRelatingData(keywordData.primary);
    console.log('##### [SUPABSE] 링크첨부 데이터 가져오기: ', relatingData);

    // [CONTENTS] HTML 태그 리스트 생성
    const tagList = this.utilsService.renderElementsToTagList(
      elementData.elements,
    );
    console.log('##### [CONTENTS] 태그 리스트 생성: ', tagList);

    // [CONTENTS] 포스팅 내용 생성
    const postingContent = await this.createPostingContent(
      tagList,
      keywordData.longTail,
    );
    console.log('##### [CONTENTS] 포스팅 내용 생성: ', postingContent);

    const postingIndex = this.utilsService.renderElementsToIndexTag(
      elementData.elements,
    );
    console.log('##### [CONTENTS] 포스팅 목차 생성: ', postingIndex);

    // [CONTENTS] 포스팅 타이틀 생성
    const postingTitle = this.utilsService.renderElementsToTitle(
      elementData.elements,
    );
    console.log('##### [CONTENTS] 포스팅 타이틀 생성: ', postingTitle);

    // [CONTENTS] 포스팅 해시태그 리스트 생성
    const hashTagList = await this.createHashTagList(keywordData.longTail);
    console.log('##### [CONTENTS] 포스팅 해시태그 리스트 생성: ', hashTagList);

    // [TISTORY] 티스토링 포스팅 업로드
    const postingData = await this.tistoryService.uploadPosting(
      postingTitle,
      postingIndex + postingContent,
      hashTagList,
    );
    console.log('##### [TISTORY] 티스토리 포스팅 업로드: ', postingData);

    // [SUPABASE] 첨부된 데이터 업데이트
    if (relatingData.id && relatingData.postingUrl) {
      await this.updateRelatingData(relatingData.id, relatingData.postingUrl);
    }

    // [START] 티스토리 포스팅 자동화 프로세스 종료!
    console.log(
      '##### [START] 티스토리 포스팅 자동화 프로세스 종료: ',
      this.dateService.getCurrentTime(),
    );
  }

  async gptLoginTest() {
    const { browser, page } = await this.puppeteerService.getBrowser();

    await page.goto('https://aistudio.google.com/prompts/new_chat');
    await this.utilsService.delayRandomTime('slow');
  }

  async clickBlankTest() {
    const { browser, page } = await this.puppeteerService.getBrowser();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.goto('https://kr.trip.com/hotels/?locale=ko-kr&curr=KRW'),
    ]);

    const priceOpenerEl = await page.waitForSelector('.calendar-container-v8');
    await priceOpenerEl.click();
    await this.utilsService.delayRandomTime('quick');

    const y = await page.evaluate(() => window.innerHeight);
    await page.mouse.click(1, y - 1); // 좌측 하단 클릭
  }
}
