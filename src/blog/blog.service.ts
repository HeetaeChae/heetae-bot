import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import { SupabaseService } from 'src/common/supabase.service';
import { GptService } from 'src/common/gpt.service';
import { PexelsService } from 'src/common/pexels.service';
import { YouTubeService } from 'src/common/yotube.service';
import { WrtnService } from 'src/common/wrtn.service';
import { htmlStyleMap } from 'src/contants/styles';
import { TistoryService } from 'src/common/tistory.service';

import * as crypto from 'crypto';
import {
  getPromptForHashtags,
  getPromptForImgKeyword,
} from 'src/contants/prompts';
import {
  getImgContainerTag,
  getImgTag,
  getIndexListTag,
  getIndexTag,
  getYoutubeLinkTag,
} from 'src/contants/tags';
import { DateService } from 'src/common/date.service';

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
      .eq('primaryKeyword', primaryKeyword)
      .is('related_posting_url', null)
      .limit(1)
      .single();

    if (error) {
      throw new Error();
    }

    return { id: data?.id ?? null, postingUrl: data?.posting_url ?? null };
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

  // [PEXELS, GPT] 이미지 태그 생성하기
  async createImgTag(text: string, usedKeywordList: string[]) {
    const usedKeyword = usedKeywordList.join(', ') ?? '';
    const prompt = getPromptForImgKeyword(text, usedKeyword);
    const keyword = await this.gptService.generateGptResponse(prompt, 0.7);
    const photos = await this.pexelsService.getPexelsPhotos(keyword, 3);
    const imgTagList = photos.map((photo: any) =>
      getImgTag(photo?.src?.medium, photo?.alt),
    );
    const tag = getImgContainerTag(imgTagList.join(''));
    return { keyword, tag };
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

  // [TAG]
  async getIndexTagHTML(indexTexts: string[]) {
    const indexListTag = indexTexts.map((indexText, idx) =>
      getIndexListTag(idx + 1, indexText),
    );
    const indexTag = getIndexTag(indexListTag.join(''));
    return indexTag;
  }

  async createPostingContents(
    elementTree: any,
    longTailKeyword: string,
    relatingPostingUrl: string | null,
  ) {
    let title = '';
    let h2Texts = [];

    const renderElements = async (elements: any): Promise<string> => {
      let HTML = '';
      const usedImgKeywords = [];

      for (const element of elements) {
        const { tag, text } = element;

        if (tag === 'h1') {
          title = text;
          continue;
        }

        const styleAttr = htmlStyleMap[tag]
          ? `style="${htmlStyleMap[tag]}"`
          : '';
        const idAttr = tag === 'h2' ? `id="section${h2Texts.length + 1}"` : '';

        HTML += `<${tag} ${styleAttr} ${idAttr}>`;
        HTML += text || '';
        HTML += element.elements ? await renderElements(element.elements) : '';
        HTML += `</${tag}>`;

        if (tag === 'h3') {
          const imgTag = await this.createImgTag(text, usedImgKeywords);
          HTML += imgTag.tag;
          usedImgKeywords.push(imgTag.keyword);
        }
        if (tag === 'h2') {
          console.log('if', 'tag: ', tag, 'text: ', text);
          h2Texts.push(text);
        }
      }

      return HTML;
    };

    let HTMLContent = await renderElements(elementTree.elements);
    const indexTagHTML = getIndexTagHTML(h2Texts);
    HTMLContent = indexTagHTML + HTMLContent;

    HTMLContent += await getYotubeLinkTag(longTailKeyword);
    HTMLContent += getRelatingPostingUrlTag(relatingPostingUrl);

    const hashTags = await this.createHashTagList(longTailKeyword);

    return {
      title,
      HTMLContent,
      hashTags,
    };
  }

  async handleTistoryPosting(category: Category) {
    try {
      // [START] 티스토리 포스팅 자동화 프로세스 시작!
      console.log(
        '########## [START] 티스토리 포스팅 자동화 프로세스 시작: ',
        this.dateService.getCurrentTime(),
      );

      // [SUPABSE] 마지막 대표 키워드 가져오기
      const lastKeywordData = await this.getLastKeywordData(category);
      console.log(
        '########## [SUPABSE] 마지막 키워드 데이터: ',
        lastKeywordData,
      );

      // [SUPABSE] 키워드 데이터
      const keywordData = await this.getKeywordData(
        category,
        lastKeywordData.primary,
      );
      console.log('########## [SUPABSE] 키워드 데이터: ', keywordData);

      // [WRTN] Element Tree 가져오기
      const elementTree = await this.wrtnService.getElementTree(
        keywordData.longTail,
      );
      console.log('########## [WRTN] Element Tree: ', elementTree);

      // [SUPABSE] 링크첨부 데이터 가져오기
      const relatingData = await this.getRelatingData(keywordData.primary);
      console.log('########## [SUPABSE] 링크첨부 데이터: ', relatingData);

      // [CONTENTS] 컨텐츠 데이터 생성
      const contentsData = await this.createPostingContents(
        elementTree,
        keywordData.longTail,
        relatingData.postingUrl,
      );
      console.log('########## [CONTENTS] 컨텐츠 데이터: ', contentsData);

      // [TISTORY] 티스토링 포스팅 업로드
      const postingData = await this.tistoryService.uploadPosting(
        contentsData.title,
        contentsData.HTMLContent,
        contentsData.hashTags,
      );
      console.log('########## [TISTORY] 티스토리 포스팅 업로드: ', postingData);

      // [SUPABASE] 첨부된 데이터 업데이트
      if (relatingData.id && relatingData.postingUrl) {
        await this.updateRelatingData(relatingData.id, relatingData.postingUrl);
      }

      /*
      // 키워드 데이터 업데이트
      await this.updateKeywordData(
        keywordData.id,
        postingUrl,
        relatingData.postingUrl,
      );
      */

      // [START] 티스토리 포스팅 자동화 프로세스 종료!
      console.log(
        '########## [START] 티스토리 포스팅 자동화 프로세스 종료: ',
        this.dateService.getCurrentTime(),
      );
    } catch (err) {
      throw err;
    }
  }

  @Cron('0 8-23/3 * * *')
  async scheduleTistoryPostingAboutHealth() {
    await this.handleTistoryPosting('health');
  }
}
