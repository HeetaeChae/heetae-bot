import { Controller, Get, Param, Query } from '@nestjs/common';
import { GptService } from 'src/common/gpt.service';
import { TripdotcomHotelTop5Service } from './tripdotcom-hotel-top5.service';
import { Star } from './tripdotcom.dto';

@Controller('tripdotcom')
export class TripdotcomController {
  constructor(
    private readonly tripdotcomHotelTop5Service: TripdotcomHotelTop5Service,
    private readonly gptService: GptService,
  ) {}

  @Get('hotel-top5/:city')
  async getHotelTop5(@Param('city') city: string, @Query('star') star: Star) {
    return this.tripdotcomHotelTop5Service.getHotelTop5(city, star);
  }

  @Get('test-gpt')
  async testGpt() {
    const prompt =
      '입력된 도시를 소개하는 멘트를 20글자 내외로 생성.\n도시: 서울.\n예시: 전통이 살아 숨쉬는 일본의 옛 수도 교토.';
    try {
      const chatResponse = await this.gptService.generateGptResponse(prompt);
      console.log(chatResponse);
    } catch (error) {
      console.error(error.message);
      console.error(error);
    }
  }
}
