import { Controller, Get, Query } from '@nestjs/common';
import { stringify } from 'querystring';
import { TistoryService } from './tistory.service';

@Controller('blog')
export class BlogController {
  constructor(private tistoryService: TistoryService) {}

  @Get('test')
  async runTest() {}

  @Get('keyword')
  async createKeywords(
    @Query('category') category: string,
    @Query('primaryKeyword') primaryKeyword: string,
    @Query('longTailKeyword') longTailKeyword: string,
  ) {
    return this.tistoryService.saveKeyword(
      category,
      primaryKeyword,
      longTailKeyword,
    );
  }

  @Get('tistory')
  async handleTistoryPost() {
    return this.tistoryService.handleTistoryPosting('health');
  }
}
