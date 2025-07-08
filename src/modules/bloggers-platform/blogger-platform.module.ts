import { Module } from '@nestjs/common';
import { Blog, BolgShema } from './blog/domain/blog.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './blog/api/blog.controller';
import { BlogsRepository } from './blog/infrastructure/blog.repository';
import { BlogQueryRepository } from './blog/infrastructure/query/blog.query-repository';
import { PostQueryRepository } from './post/infrastructure/query/post.query-repository';
import { PostRepository } from './post/infrastructure/post.repository';
import { Post, PostSchema } from './post/domain/post.entity';
import { PostService } from './post/application/post.service';
import { PostController } from './post/api/post.controller';
import { Comment, CommentSchema } from './comment/domain/comment.entity';
import { CommentsQueryRepository } from './comment/infrastructure/query/comments.query-repository';
import { CommentController } from './comment/api/comment.controller';
import { CreateBlogUseCase } from './blog/application/usecases/create-blog.usecase';
import { UpdateBlogUseCase } from './blog/application/usecases/update-blog.usecase';
import { DeleteBlogUseCase } from './blog/application/usecases/delete-blog.usecase';
import { GetBlogByIdQueryHandler } from './blog/application/queries/get-blog-by-id.query-handler';
import { GetAllBlogsQueryHandler } from './blog/application/queries/get-all-blogs.query-handler';

const commandHandlers = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
];

const queryHandlers = [GetBlogByIdQueryHandler, GetAllBlogsQueryHandler];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BolgShema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  controllers: [BlogController, PostController, CommentController],
  providers: [
    BlogsRepository,
    BlogQueryRepository,
    PostQueryRepository,
    PostRepository,
    PostService,
    CommentsQueryRepository,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [],
})
export class BloggerPlatformModule {}
