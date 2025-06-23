import { Module } from '@nestjs/common';
import { Blog, BolgShema } from './blog/domain/blog.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './blog/api/blog.controller';
import { BlogsRepository } from './blog/infrastructure/blog.repository';
import { BlogService } from './blog/application/blog.service';
import { BlogQueryRepository } from './blog/infrastructure/query/blog.query-repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BolgShema }]),
  ],
  controllers: [BlogController],
  providers: [BlogsRepository, BlogQueryRepository, BlogService],
  exports: [],
})
export class BloggerPlatformModule {}
