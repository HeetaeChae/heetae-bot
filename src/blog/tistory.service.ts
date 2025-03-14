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
import { WrtnService } from 'src/common/wrtn.service';
import { htmlStyleMap } from 'src/contants/styles';

import * as crypto from 'crypto';
import { keywordCreating } from 'src/contants/prompts';
globalThis.crypto = crypto as Crypto;

interface ElementTree {
  tag: string;
  text: string | null;
  elementTree: ElementTree[];
}
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
    private wrtnService: WrtnService,
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
      throw new InternalServerErrorException(
        `supabse: blog_keywords 데이터 생성 오류.\n${error.message}`,
      );
    }
  }

  async getLastPrimaryKeyword(category: Category): Promise<string | null> {
    try {
      const { data } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .select('primary_keyword')
        .eq('category', category)
        .order('posted_at', { ascending: false })
        .limit(1);

      return data[0]?.primary_keyword || null;
    } catch (error) {
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
      const { data } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .select('*')
        .neq('primary_keyword', lastPrimaryKeyword)
        .eq('category', category)
        .is('posted_at', null);

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
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabase: keyword data 가져오기 오류.\n${error.message}`,
      });
    }
  }

  async getRelatingData(
    primaryKeyword: string,
  ): Promise<{ id: number; postingUrl: string } | null> {
    try {
      const { data } = await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .select('*')
        .not('posted_at', 'is', null)
        .eq('primaryKeyword', primaryKeyword)
        .is('related_posting_url', null);

      console.log(data);

      if (!data) {
        return null;
      }

      const randomIdx = Math.floor(Math.random() * data.length);
      const { id, posting_url } = data[randomIdx];

      return {
        id,
        postingUrl: posting_url,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabase: keyword data 가져오기 오류.\n${error.message}`,
      });
    }
  }

  async updateRelatingData(
    relatingId: number,
    postingUrl: string,
  ): Promise<void> {
    try {
      await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .update({ related_posting_url: postingUrl })
        .eq('id', relatingId);
    } catch (error) {
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
      await this.supabaseService
        .getClient()
        .from('blog_keywords')
        .update({
          updated_at: currentTime,
          posted_at: currentTime,
          posting_url: postingUrl,
          relating_posting_url: relatingPostingUrl,
        })
        .eq('id', keywordId);
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `supabse: keyword 데이터 업데이트 오류.\n${error.message}`,
      });
    }
  }

  async createPostingContents(
    elementTree: any,
    longTailKeyword: string,
    relatingPostingUrl: string | null,
  ) {
    const getKeywordFromGpt = async (prompt: string) => {
      // 여기 문제. temperate 관련.
      return await this.gptService.generateGptResponse(prompt, 0.7);
    };
    const getImgUrlTag = async (text: string) => {
      const imgKeyword = await getKeywordFromGpt(keywordCreating(text));
      const photo = await this.pexelsService.getPexelsPhotos(imgKeyword);
      console.log('photo', photo);
      return `<img src="${photo?.src?.original}" alt="${photo?.alt}" />`;
    };
    const getYotubeLinkTag = async (longTailKeyword: string) => {
      const youtubeItems = await this.youtubeService.getYoutubeItems(
        longTailKeyword,
        1,
      );
      console.log('youtubeItems', youtubeItems);
      return `<a src="${youtubeItems[0]?.link || ''}" />`;
    };
    const getRelatingPostingUrlTag = (relatingPostingUrl: string | null) => {
      return relatingPostingUrl ? `<a src="${relatingPostingUrl}" />` : '';
    };
    const getHashTags = async (longTailKeyword: string): Promise<string> => {
      return '#테스트#해시태그#임시#하하';
    };

    /*
          const tag = wrtnElement.tagName.toLowerCase();
          let text =
            Array.from(wrtnElement.childNodes)
              .find((childNode) => childNode.nodeType === 3)
              ?.textContent.trim() || null;
          const elements = [];

          const children = wrtnElement.children;

          for (const child of children) {
            const serialized = serializeWrtnElement(child);
            if (serialized.tag === 'strong') {
              text = serialized.text + text;
              continue;
            }
            elements.push(serialized);
          }

          return { tag, text, elements: elements.length > 0 ? elements : null };
    */
    const renderElements = async (elements: any) => {
      let HTML = '';

      for (const element of elements) {
        const { tag, text } = element;
        if (tag === 'h3') {
          // 이미지 추가
          HTML += await getImgUrlTag(text);
        }
        HTML += `<${tag}>`;
        HTML += text || '';
        HTML += element.elements ? await renderElements(element.elements) : '';
        HTML += `</${tag}>`;
      }

      return HTML;
    };
    let HTMLContent = await renderElements(elementTree.elements);
    // 유튜브 링크 추가
    HTMLContent += await getYotubeLinkTag(longTailKeyword);
    // 관련 링크 추가
    HTMLContent += getRelatingPostingUrlTag(relatingPostingUrl);

    console.log(HTMLContent);
  }

  async handleTistoryPosting(category: Category) {
    // 키워드 데이터 가져오기
    const lastPrimaryKeyword = await this.getLastPrimaryKeyword(category);
    const keywordData = await this.getKeywordData(category, lastPrimaryKeyword);
    // element 가져오기
    const elementTree = await this.wrtnService.getElementTree(
      keywordData.longTailKeyword,
    );
    console.log(keywordData.longTailKeyword, elementTree);
    // 첨부할 데이터 가져오기
    const relatingData = await this.getRelatingData(keywordData.primaryKeyword);
    await this.createPostingContents(
      elementTree,
      keywordData.longTailKeyword,
      relatingData?.postingUrl || null,
    );

    /*
    // 포스팅할 컨텐츠 생성
    // 포스팅 업로드
    const postingUrl = await this.uploadTistoryPosting();
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
    await this.handleTistoryPosting('health');
  }
}
