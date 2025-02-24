import { Controller, Get, Query } from '@nestjs/common';
import { stringify } from 'querystring';
import { TistoryService } from './tistory.service';

@Controller('blog')
export class BlogController {
  constructor(private tistoryService: TistoryService) {}

  @Get('test')
  async runTest() {
    return this.tistoryService.stealTistoryPostings();
  }

  @Get('keywords')
  async createKeywords(
    @Query('category') category: string,
    @Query('keyword') keyword: string,
  ) {
    return this.tistoryService.createKeywords(category, keyword);
  }
}
