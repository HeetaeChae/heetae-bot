import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { InternalServerError } from 'openai';

@Injectable()
export class GptService {
  private readonly openAi: OpenAI;

  constructor(private configService: ConfigService) {
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('gpt요청에 필요한 OPENAI_API_KEY를 가져오지 못했습니다.');
    }
    this.openAi = new OpenAI({
      apiKey: openAiApiKey,
    });
  }

  async generateGptResponse(prompt: string, temperature: number) {
    try {
      const response = await this.openAi.chat.completions.create({
        model: 'o3-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature,
      });
      return response.choices[0]?.message?.content;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: `gpt: gpt 요청중 오류.\n${error.message}`,
      });
    }
  }
}
