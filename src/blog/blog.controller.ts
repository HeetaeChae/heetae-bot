import { Controller, Get, Param } from '@nestjs/common';
import { BlogV2PostService } from './v2/blog-v2-post.service';
import { BlogV2KeywordService } from './v2/blog-v2-keyword.service';
import { BlogV1PostService } from './v1/blog-v1-post.service';
import { BlogV1KeywordService } from './v1/blog-v1-keyword.service';

@Controller('api/blog')
export class BlogController {
  constructor(
    private blogV1PostService: BlogV1PostService,
    private blogV1KeywordService: BlogV1KeywordService,
    private blogV2PostService: BlogV2PostService,
    private blogV2KeywordService: BlogV2KeywordService,
  ) {}

  @Get('create-keyword/v2/:city')
  async createKeyword(@Param('city') city: string) {
    return this.blogV2KeywordService.createKeyword(city);
  }

  @Get('create-post/v2')
  async createPost() {
    return this.blogV2PostService.createPost();
  }
}
