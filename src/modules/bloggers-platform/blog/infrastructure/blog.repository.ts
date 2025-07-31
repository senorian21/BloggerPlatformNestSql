import { Injectable } from '@nestjs/common';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogDto } from '../dto/blog.dto';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async findById(id: number): Promise<BlogDto | null> {
    const [blog] = await this.dataSource.query(
      'SELECT * FROM "Blog" WHERE id = $1 ' + 'AND "deletedAt" IS NULL',
      [id],
    );
    return blog || null;
  }

  async updateBlog(blogId: number, dto: UpdateBlogDto): Promise<void> {
    await this.dataSource.query(
      `UPDATE "Blog"
             SET name = $1, description = $2, "websiteUrl" = $3
             WHERE id = $4`,
      [dto.name, dto.description, dto.websiteUrl, blogId],
    );
  }

  async createBlog(dto: CreateBlogDto): Promise<number> {
    const result = await this.dataSource.query(
      `
      INSERT INTO "Blog" (name, description, "websiteUrl")
      VALUES ($1, $2, $3)
        RETURNING id
    `,
      [dto.name, dto.description, dto.websiteUrl],
    );

    return result[0].id;
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
}
