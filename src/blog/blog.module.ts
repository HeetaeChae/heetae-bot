import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogV1Service } from './v1/blog-v1.service';
import { BlogV2Service } from './v2/blog-v2.service';
import { BlogV1KeywordService } from './v1/blog-v1-keyword.service';
import { BlogV2KeywordService } from './v2/blog-v2-keyword.service';

@Module({
  imports: [CommonModule],
  providers: [
    BlogService,
    BlogV1Service,
    BlogV2Service,
    BlogV1KeywordService,
    BlogV2KeywordService,
  ],
  exports: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
