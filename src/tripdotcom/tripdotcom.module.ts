import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { TripdotcomHotelTop5Service } from './tripdotcom-hotel-top5.service';
import { TripdotcomController } from './tripdotcom.controller';

@Module({
  imports: [CommonModule],
  controllers: [TripdotcomController],
  providers: [TripdotcomHotelTop5Service],
})
export class TripdotcomModule {}
