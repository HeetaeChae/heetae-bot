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
import { TistoryService } from 'src/common/tistory.service';

import * as crypto from 'crypto';
import { getHashTagPrompt, getKeywordPrompt } from 'src/contants/prompts';
import {
  getImgContainerTag,
  getImgTag,
  getIndexListTag,
  getIndexTag,
  getYoutubeLinkTag,
} from 'src/contants/tags';
globalThis.crypto = crypto as Crypto;

type Category = 'health' | 'pet' | 'business';

@Injectable()
export class BlogService {
  constructor(
    private puppeteerService: PuppeteerService,
    private supabaseService: SupabaseService,
    private gptService: GptService,
    private utilsService: UtilsService,
    private pexelsService: PexelsService,
    private youtubeService: YouTubeService,
    private configService: ConfigService,
    private wrtnService: WrtnService,
    private tistoryService: TistoryService,
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
    const getImgUrlTag = async (text: string, usedImgKeywords: string[]) => {
      const usedImgKeyword = usedImgKeywords.join(', ');
      const prompt = getKeywordPrompt(text, usedImgKeyword);
      const imgKeyword = await this.gptService.generateGptResponse(prompt, 0.7);
      const photos = await this.pexelsService.getPexelsPhotos(imgKeyword, 3);
      const imgTagList = photos.map((photo) =>
        getImgTag(photo?.src?.medium, photo?.alt),
      );
      const imgTagHTML = getImgContainerTag(imgTagList.join(''));
      return { imgKeyword, imgTag: imgTagHTML };
    };
    const getYotubeLinkTag = async (longTailKeyword: string) => {
      const youtubeItems = await this.youtubeService.getYoutubeItems(
        longTailKeyword,
        1,
      );
      const youtubeInfo = youtubeItems[0];
      if (!youtubeInfo) '';
      const { channelTitle, title, description, link, thumbnailUrl } =
        youtubeInfo;
      const youtubeLinkTag = getYoutubeLinkTag(
        link,
        title,
        description,
        channelTitle,
        thumbnailUrl,
      );
      return youtubeLinkTag;
    };
    const getRelatingPostingUrlTag = (relatingPostingUrl: string | null) => {
      return relatingPostingUrl ? `<a src="${relatingPostingUrl}" />` : '';
    };
    const getHashTags = async (longTailKeyword: string): Promise<string[]> => {
      const prompt = getHashTagPrompt(longTailKeyword);
      const hashtag = await this.gptService.generateGptResponse(prompt, 0.7);
      return hashtag.split(', ');
    };
    const getIndexTagHTML = (indexTexts: string[]) => {
      const indexListTag = indexTexts.map((indexText, idx) =>
        getIndexListTag(idx + 1, indexText),
      );
      const indexTag = getIndexTag(indexListTag.join(''));
      return indexTag;
    };

    const hashTags = await getHashTags(longTailKeyword);
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
          const { imgKeyword, imgTag } = await getImgUrlTag(
            text,
            usedImgKeywords,
          );
          HTML += imgTag;
          usedImgKeywords.push(imgKeyword);
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

    console.log(title, HTMLContent, hashTags);

    return {
      title,
      HTMLContent,
      hashTags,
    };
  }

  async handleTistoryPosting(category: Category) {
    // 키워드 데이터 가져오기
    const lastPrimaryKeyword = await this.getLastPrimaryKeyword(category);
    const keywordData = await this.getKeywordData(category, lastPrimaryKeyword);
    // element 가져오기
    const elementTree = await this.wrtnService.getElementTree(
      keywordData.longTailKeyword,
    );
    // 첨부할 데이터 가져오기
    const relatingData = await this.getRelatingData(keywordData.primaryKeyword);
    const postingContents = await this.createPostingContents(
      elementTree,
      keywordData.longTailKeyword,
      relatingData?.postingUrl || null,
    );
    // 포스팅할 컨텐츠 생성
    const { title, HTMLContent, hashTags } = postingContents;
    // 포스팅 업로드
    const postingUrl = await this.tistoryService.uploadPosting(
      title,
      HTMLContent,
      hashTags,
    );

    /*
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
