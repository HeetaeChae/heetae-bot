import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from 'src/common/common.module';
import { TripdotcomHotelTop3Service } from './tripdotcom-hotel-top3.service';
import { TripdotcomController } from './tripdotcom.controller';

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [TripdotcomController],
  providers: [TripdotcomHotelTop3Service],
})
export class TripdotcomModule {}
