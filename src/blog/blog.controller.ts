import { Controller, Get } from '@nestjs/common';
import { TistoryService } from './tistory.service';

@Controller('blog')
export class BlogController {
  constructor(private tistoryService: TistoryService) {}

  @Get('test')
  async runTest() {
    return this.tistoryService.scheduleTistoryPost();
  }
}
