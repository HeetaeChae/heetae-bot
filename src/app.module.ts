import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { TripdotcomModule } from './tripdotcom/tripdotcom.module';

@Module({
  imports: [ConfigModule.forRoot(), CommonModule, TripdotcomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
