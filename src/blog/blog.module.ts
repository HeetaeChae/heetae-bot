import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';

@Module({
  imports: [CommonModule],
  providers: [BlogService],
  exports: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
