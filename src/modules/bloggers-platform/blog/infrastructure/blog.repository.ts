import { Injectable } from '@nestjs/common';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import {InjectDataSource, InjectRepository} from '@nestjs/typeorm';
import {DataSource, IsNull, Repository} from 'typeorm';
import { BlogDto } from '../dto/blog.dto';
import {Blog} from "../domain/blog.entity";

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
  ) {}

  async findById(id: number): Promise<Blog | null> {
    return await this.blogRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async deleteBlog(blogId: number): Promise<void> {
    const deletedAt = new Date();
    await this.dataSource.query(
      `
    UPDATE "Blog" 
    SET "deletedAt" = $1
    WHERE id = $2`,
      [deletedAt, blogId],
    );
  }

  async softDeleteBlog(blogId: number): Promise<void> {
    await this.blogRepository.softDelete(blogId);
  }

  async save(dto: CreateBlogDto): Promise<void> {
    await this.blogRepository.save(dto);
  }
}
