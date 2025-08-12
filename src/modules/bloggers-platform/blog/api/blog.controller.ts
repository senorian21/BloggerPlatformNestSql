import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetBlogsQueryParams } from './input-dto/get-blog-query-params.input-dto';
import { GetPostQueryParams } from '../../post/api/input-dto/get-post-query-params.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetAllBlogsQuery } from '../application/queries/get-all-blogs.query-handler';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogByIdQuery } from '../application/queries/get-blog-by-id.query-handler';
import { CreatePostCommand } from '../../post/application/usecases/create-post.usecase';
import { GetAllPostQuery } from '../../post/application/queries/get-all-post.query-handler';
import { PostViewDto } from '../../post/api/view-dto/post.view-dto';
import { GetPostByIdQuery } from '../../post/application/queries/get-post-by-id.query-handler';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/auth/dto/user-context.dto';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  async getBlogById(@Param('id') blogId: number) {
    return this.queryBus.execute<GetBlogByIdQuery, BlogViewDto>(
      new GetBlogByIdQuery(blogId),
    );
  }

  @Get()
  async getAll(@Query() query: GetBlogsQueryParams) {
    return this.queryBus.execute<
      GetAllBlogsQuery,
      PaginatedViewDto<BlogViewDto[]>
    >(new GetAllBlogsQuery(query));
  }

  @Get('/:blogId/posts')
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPost(
    @Query() query: GetPostQueryParams,
    @Param('blogId', ParseIntPipe) blogId: number,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ) {
    const userId = user?.id;
    return this.queryBus.execute<
      GetAllPostQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetAllPostQuery(query, blogId, userId));
  }
}
