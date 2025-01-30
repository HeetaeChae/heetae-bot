import { Controller, Get, Param } from '@nestjs/common';
import { AgodaService } from './agoda.service';

@Controller('agoda')
export class AgodaController {
  constructor(private readonly agodaService: AgodaService) {}

  @Get('hotel-infos/:city')
  async getHotelInfosByCity(@Param('city') city: string) {
    return this.agodaService.getHotelInfosByCity(city);
  }
}
