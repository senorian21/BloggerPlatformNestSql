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
import { CreatePostDto } from '../../post/api/input-dto/post.input-dto';
import { CreateBlogDto } from './input-dto/blog.input-dto';
import { UpdateBlogDto } from './input-dto/updats-blog.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
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
import {DeletePostCommand} from "../../post/application/usecases/delete-post.usecase";
import {UpdatePostDto} from "../../post/api/input-dto/updats-post.input-dto";
import {UpdatePostCommand} from "../../post/application/usecases/update-post.usecase";

@Controller('sa/blogs')
export class SaBlogController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(@Body() dto: CreateBlogDto) {
    const blogId = await this.commandBus.execute<CreateBlogCommand, number>(
      new CreateBlogCommand(dto),
    );
    return this.queryBus.execute<GetBlogByIdQuery, BlogViewDto>(
      new GetBlogByIdQuery(blogId),
    );
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id', ParseIntPipe) blogId: number,
    @Body() dto: UpdateBlogDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateBlogCommand(blogId, dto));
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id', ParseIntPipe) blogId: number): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(blogId));
  }

  @Get()
  async getAll(@Query() query: GetBlogsQueryParams) {
    return this.queryBus.execute<
      GetAllBlogsQuery,
      PaginatedViewDto<BlogViewDto[]>
    >(new GetAllBlogsQuery(query));
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  async createPostByIdBlog(
    @Param('id') blogId: number,
    @Body() dto: CreatePostDto,
  ) {
    const postId = await this.commandBus.execute<CreatePostCommand, number>(
      new CreatePostCommand(dto, blogId),
    );
    return this.queryBus.execute<GetPostByIdQuery, string>(
      new GetPostByIdQuery(postId),
    );
  }

  @Delete(':id/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
      @Param('id') blogId: number,
      @Param('postId') postId: number) {
    await this.commandBus.execute(new DeletePostCommand(postId, blogId));
  }

  @Put(':id/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
      @Param('id') blogId: number,
      @Param('postId') postId: number,
      @Body() dto: UpdatePostDto):Promise<void> {
    await this.commandBus.execute<UpdatePostCommand, void>(
      new UpdatePostCommand(dto, postId, blogId),
    );
  }

  @Get("/:blogId/posts")
  @UseGuards(JwtOptionalAuthGuard)
  async getAllPost(
      @Query() query: GetPostQueryParams,
      @Param('blogId', ParseIntPipe) blogId: number,
      @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ) {
    const userId = user?.id
    return this.queryBus.execute<
        GetAllPostQuery,
        PaginatedViewDto<PostViewDto[]>
    >(new GetAllPostQuery(query, blogId, userId));
  }

}
