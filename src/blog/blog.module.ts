import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { TistoryService } from './tistory.service';
import { BlogController } from './blog.controller';

@Module({
  imports: [CommonModule],
  providers: [TistoryService],
  exports: [TistoryService],
  controllers: [BlogController],
})
export class BlogModule {}
