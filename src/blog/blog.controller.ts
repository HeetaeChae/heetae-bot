import { Controller, Get, Query } from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get('test')
  async runTest() {}

  @Get('keyword')
  async createKeywords(
    @Query('category') category: string,
    @Query('primaryKeyword') primaryKeyword: string,
    @Query('longTailKeyword') longTailKeyword: string,
  ) {
    return this.blogService.saveKeyword(
      category,
      primaryKeyword,
      longTailKeyword,
    );
  }

  @Get('tistory')
  async handleTistoryPost() {
    return this.blogService.handleTistoryPosting('health');
  }
}
