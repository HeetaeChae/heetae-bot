import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PuppeteerService } from 'src/common/puppeteer.service';
import { SupabaseService } from 'src/common/supabase.service';

// Node.js 환경에서 crypto 모듈 설정
import * as crypto from 'crypto';
import { GptService } from 'src/common/gpt.service';
globalThis.crypto = crypto as Crypto;

@Injectable()
export class TistoryService {
  constructor(
    private puppeteerService: PuppeteerService,
    private supabaseService: SupabaseService,
    private gptService: GptService,
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

  async getGptResponse(keyword: string) {
    const prompt = `
    {
      "title": "글 제목 (10자 ~ 15자.)",
      "intro": "도입부 (100자 ~ 200자.)",
      "outline": "개요 (50자 ~ 100자.)",
      "contents": [
        {
          "title": "본문 제목",
          "keyword": "본문 내용과 관련된 키워드 (영어 한단어)",
          "content": "본문 내용 (500자 ~ 1000자)"
        }
      ],
      "table": {
        "column": [
          "컬럼 명"
        ],
        "rows": [
          [
            "로우 값"
          ]
        ]
      },
      "summary": [
        {
          "title": "글 요약 제목",
          "list": [
            "글 요약 내용 (50자 ~ 100자)"
          ]
        }
      ],
      "closing": "마무리 (100자 ~ 200자.)"
    }
    
    과제: 블로그 글을 작성해야 한다. 위와 같이 주어진 JSON 형식에 맞게 글을 작성하라.
    주제: "${keyword}"
    조건: 
    - ":"를 사용하지 않는다. 예) 외이도염: 증상, 원인, 치료법.
    - AI 의 글이라는 느낌이 없도록 작성. 
    - 신뢰성이 느껴지는 문어체로 작성.
    - 글자수는 총 2000자 이상, 3000자 이하여야 함. 
    - "intro"에서 독자에게 끝까지 읽어보기를 독려.
    - "table"을 제외한 모든 배열의 개수는 3 이상이여야 한다.  
    - "keyword"는 영어 한 단어이다. 
    - "closing"에서 해당 주제에 대한 비젼을 제시하는 내용이 있어야 함.
    `;

    const response = await this.gptService.generateGptResponse(prompt);

    if (!response) {
      throw new Error('gpt 응답이 없습니다.');
    }

    return response;
  }

  @Cron('0 8-23,0 * * *')
  async scheduleTistoryPost() {
    const { keyword } = await this.getKeywordBySupabase();
    const jsonContent = await this.getGptResponse('외이도염');
    console.log(jsonContent);
    const contentData = JSON.parse(jsonContent);

    console.log(contentData);
  }
}
