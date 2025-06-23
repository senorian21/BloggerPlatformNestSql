import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogService } from '../application/blog.service';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { BlogQueryRepository } from '../infrastructure/query/blog.query-repository';
import { GetBlogsQueryParams } from './input-dto/get-blog-query-params.input-dto';

@Controller('blogs')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogQueryRepository: BlogQueryRepository,
  ) {}

  @Post()
  async createBlog(@Body() dto: CreateBlogDto) {
    const blogId = await this.blogService.createBlog(dto);
    return this.blogQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(@Param('id') blogId: string, @Body() dto: UpdateBlogDto) {
    await this.blogService.updateBlog(blogId, dto);
  }

  @Get(':id')
  async getBlogById(@Param('id') blogId: string) {
    return this.blogQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @Get()
  async getAll(@Query() query: GetBlogsQueryParams) {
    return this.blogQueryRepository.getAll(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') blogId: string) {
    await this.blogService.deleteBlog(blogId);
  }
}
