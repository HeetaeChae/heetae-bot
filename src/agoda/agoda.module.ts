import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AgodaController } from './agoda.controller';
import { AgodaService } from './agoda.service';

@Module({
  imports: [CommonModule],
  controllers: [AgodaController],
  providers: [AgodaService],
})
export class AgodaModule {}
