import {
  CreateBlogDomainDto,
  UpdateBlogDomainDto,
} from './dto/create-blog.domain.dto';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../post/domain/post.entity';

export const nameConstraints = {
  minLength: 3,
  maxLength: 15,
};

export const descriptionConstraints = {
  minLength: 3,
  maxLength: 500,
};

export const websiteUrlConstraints = {
  minLength: 3,
  maxLength: 100,
};

@Entity('blog')
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: false, collation: 'C' })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: false, collation: 'C' })
  description: string;

  @Column({ type: 'varchar', length: 200, nullable: false, collation: 'C' })
  websiteUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isMembership: boolean;

  @OneToMany(() => Post, (post) => post.blog)
  posts: Post[];

  static create(dto: CreateBlogDomainDto) {
    const newBlog = new Blog();
    newBlog.name = dto.name;
    newBlog.description = dto.description;
    newBlog.websiteUrl = dto.websiteUrl;
    return newBlog;
  }

  update(dto: UpdateBlogDomainDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}
