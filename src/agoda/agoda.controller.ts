import { Controller, Get, Param, Query } from '@nestjs/common';
import { Star } from './agoda.dto';
import { AgodaService } from './agoda.service';

@Controller('agoda')
export class AgodaController {
  constructor(private readonly agodaService: AgodaService) {}

  @Get('hotel-infos/:city')
  async getHotelInfosByCity(
    @Param('city') city: string,
    @Query('star') star: Star,
  ) {
    return this.agodaService.getHotelInfosByCity(city, star);
  }
}
