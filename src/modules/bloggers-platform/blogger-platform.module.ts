import { Module } from '@nestjs/common';
import { Blog, BolgShema } from './blog/domain/blog.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './blog/api/blog.controller';
import { BlogsRepository } from './blog/infrastructure/blog.repository';
import { BlogService } from './blog/application/blog.service';
import { BlogQueryRepository } from './blog/infrastructure/query/blog.query-repository';
import { PostQueryRepository } from './post/infrastructure/query/post.query-repository';
import { PostRepository } from './post/infrastructure/post.repository';
import { Post, PostSchema } from './post/domain/post.entity';
import { PostService } from './post/application/post.service';
import { PostController } from './post/api/post.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BolgShema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  controllers: [BlogController, PostController],
  providers: [
    BlogsRepository,
    BlogQueryRepository,
    BlogService,
    PostQueryRepository,
    PostRepository,
    PostService,
  ],
  exports: [],
})
export class BloggerPlatformModule {}
