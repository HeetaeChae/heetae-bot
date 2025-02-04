import { Controller, Get, Param, Query } from '@nestjs/common';
import { TripdotcomHotelTop5Service } from './tripdotcom-hotel-top5.service';
import { Star } from './tripdotcom.dto';

@Controller('tripdotcom')
export class TripdotcomController {
  constructor(
    private readonly tripdotcomHotelTop5Service: TripdotcomHotelTop5Service,
  ) {}

  @Get('hotel-top5/:city')
  async getHotelTop5(@Param('city') city: string, @Query('star') star: Star) {
    return this.tripdotcomHotelTop5Service.getHotelTop5(city, star);
  }
}
