import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgodaModule } from './agoda/agoda.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ConfigModule.forRoot(), AgodaModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
