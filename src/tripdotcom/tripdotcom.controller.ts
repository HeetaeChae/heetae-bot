import { Controller, Get, Param, Query } from '@nestjs/common';
import { TripdotcomHotelTop3Service } from './tripdotcom-hotel-top3.service';
import { Star } from './tripdotcom.dto';

@Controller('tripdotcom')
export class TripdotcomController {
  constructor(
    private readonly tripdotcomHotelTop3Service: TripdotcomHotelTop3Service,
  ) {}

  @Get('hotel-top3/:city')
  async getHotelTop3(@Param('city') city: string, @Query('star') star: Star) {
    return this.tripdotcomHotelTop3Service.getHotelTop3(city, star);
  }

  @Get('bot-test')
  async botTest() {
    return this.tripdotcomHotelTop3Service.botTest();
  }
}
