import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogV1PostService } from './v1/blog-v1-post.service';
import { BlogV1KeywordService } from './v1/blog-v1-keyword.service';
import { BlogV2PostService } from './v2/blog-v2-post.service';
import { BlogV2KeywordService } from './v2/blog-v2-keyword.service';

@Module({
  imports: [CommonModule],
  providers: [
    BlogService,
    BlogV1PostService,
    BlogV1KeywordService,
    BlogV2PostService,
    BlogV2KeywordService,
  ],
  exports: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
