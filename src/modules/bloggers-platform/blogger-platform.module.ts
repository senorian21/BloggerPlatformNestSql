import { Module } from '@nestjs/common';
import { BlogController } from './blog/api/blog.controller';
import { BlogsRepository } from './blog/infrastructure/blog.repository';
import { BlogQueryRepository } from './blog/infrastructure/query/blog.query-repository';
import { PostQueryRepository } from './post/infrastructure/query/post.query-repository';
import { PostRepository } from './post/infrastructure/post.repository';
import { PostController } from './post/api/post.controller';
import { CommentsQueryRepository } from './comment/infrastructure/query/comments.query-repository';
import { CommentController } from './comment/api/comment.controller';
import { CreateBlogUseCase } from './blog/application/usecases/create-blog.usecase';
import { UpdateBlogUseCase } from './blog/application/usecases/update-blog.usecase';
import { DeleteBlogUseCase } from './blog/application/usecases/delete-blog.usecase';
import { GetBlogByIdQueryHandler } from './blog/application/queries/get-blog-by-id.query-handler';
import { GetAllBlogsQueryHandler } from './blog/application/queries/get-all-blogs.query-handler';
import { CreatePostUseCase } from './post/application/usecases/create-post.usecase';
import { DeletePostUseCase } from './post/application/usecases/delete-post.usecase';
import { UpdatePostUseCase } from './post/application/usecases/update-post.usecase';
import { GetPostByIdQueryHandler } from './post/application/queries/get-post-by-id.query-handler';
import { GetAllPostQueryHandler } from './post/application/queries/get-all-post.query-handler';
import { GetAllCommentsQueryHandler } from './comment/application/queries/get-all-comments.query-handler';
import { GetCommentsByIdQueryHandler } from './comment/application/queries/get-comments-by-id.query-handler';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CreateCommentUseCase } from './post/application/usecases/create-comment.usecase';
import { CommentRepository } from './comment/infrastructure/comment.repository';
import { DeleteCommentUseCase } from './comment/application/usecases/delete-comment.usecase';
import { UpdateCommentUseCase } from './comment/application/usecases/update-comment.usecase';
import { LikeStatusCommentUseCase } from './comment/application/usecases/create-like-or-dislike-comment.usecase';
import { LikeStatusPostUseCase } from './post/application/usecases/post-like-status.usecase';
import { SaBlogController } from './blog/api/sa-blog.controller';

const commandHandlers = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  CreatePostUseCase,
  DeletePostUseCase,
  UpdatePostUseCase,
  CreateCommentUseCase,
];

const queryHandlers = [
  GetBlogByIdQueryHandler,
  GetAllBlogsQueryHandler,
  GetPostByIdQueryHandler,
  GetAllPostQueryHandler,
  GetAllCommentsQueryHandler,
  GetCommentsByIdQueryHandler,
  DeleteCommentUseCase,
  UpdateCommentUseCase,
  LikeStatusCommentUseCase,
  LikeStatusPostUseCase,
];

@Module({
  imports: [
    UserAccountsModule,
  ],
  controllers: [
    BlogController,
    SaBlogController,
    PostController,
    CommentController,
  ],
  providers: [
    BlogsRepository,
    BlogQueryRepository,
    PostQueryRepository,
    PostRepository,
    CommentsQueryRepository,
    CommentRepository,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [],
})
export class BloggerPlatformModule {}
