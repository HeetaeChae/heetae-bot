import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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

  async generateGptResponse(prompt: string) {
    try {
      const response = await this.openAi.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });
      return response.choices[0]?.message?.content;
    } catch (error) {
      console.error(error);
    }
  }
}
