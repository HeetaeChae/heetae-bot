import { Controller, Get, Param, Post } from '@nestjs/common';
import { AgodaService } from './agoda.service';

@Controller('agoda')
export class AgodaController {
  constructor(private readonly agodaService: AgodaService) {}

  @Get('hotels/:city')
  async getAgodaHotelsByCity(@Param('city') city: string) {
    return this.agodaService.getAgodaHotelInfosByCity(city);
  }
}
