import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogV1Service } from './blog-v1.service';

@Module({
  imports: [CommonModule],
  providers: [BlogService, BlogV1Service],
  exports: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
