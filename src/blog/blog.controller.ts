import { Controller, Get, Query } from '@nestjs/common';
import { BlogV1Service } from './blog-v1.service';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogV1Service: BlogV1Service,
  ) {}

  @Get('test')
  async runTest() {
    return this.blogService.clickBlankTest();
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
    return this.blogV1Service.devHotelPosting();
  }

  /*
  @Get('tistory')
  async handleTistoryPost() {
    return this.blogService.handleTistoryPosting('health');
  }
  */
}
