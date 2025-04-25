import { Controller, Get, Query } from '@nestjs/common';
import { BlogV1Service } from './blog-v1.service';
import { BlogV2Service } from './blog-v2.service';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogV1Service: BlogV1Service,
    private blogV2Service: BlogV2Service,
  ) {}

  @Get('test')
  async runTest() {
    return this.blogService.testHandleRange();
  }

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

  @Get('dev-hotel-posting')
  async devHotelPosting() {
    return this.blogV2Service.devBlogPosting();
  }

  /*
  @Get('tistory')
  async handleTistoryPost() {
    return this.blogService.handleTistoryPosting('health');
  }
  */
}
