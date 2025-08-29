import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blog/domain/blog.entity';
import {
  CreatePostDomainDto,
  UpdatePostDomainDto,
} from './dto/create-post.domain.dto';
import { PostLike } from './postLike.entity';
import { NewestLikes } from './newestLikes.entity';

export const titleConstraints = {
  minLength: 3,
  maxLength: 30,
};

export const shortDescriptionConstraints = {
  minLength: 3,
  maxLength: 100,
};

export const contentConstraints = {
  minLength: 3,
  maxLength: 1000,
};

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'varchar', length: 30, nullable: false, collation: 'C' })
  title: string;

  @Column({ type: 'varchar', length: 1000, nullable: false, collation: 'C' })
  content: string;

  @Column({ type: 'varchar', length: 100, nullable: false, collation: 'C' })
  shortDescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'integer', nullable: false, default: 0 })
  likeCount: number;

  @Column({ type: 'integer', nullable: false, default: 0 })
  dislikeCount: number;

  @ManyToOne(() => Blog, (blog) => blog.posts, { cascade: true })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @Column()
  blogId: number;

  @OneToMany(() => PostLike, (postLike) => postLike.post, { cascade: true })
  postLikes: PostLike[];

  @OneToMany(() => NewestLikes, (newestLikes) => newestLikes.post, {
    cascade: true,
  })
  newestLikes: NewestLikes[];

  static create(dto: CreatePostDomainDto) {
    const newPost = new Post();
    newPost.title = dto.title;
    newPost.content = dto.content;
    newPost.shortDescription = dto.shortDescription;
    newPost.blogId = dto.blogId;
    return newPost;
  }

  update(dto: UpdatePostDomainDto, blogId: number) {
    this.title = dto.title;
    this.content = dto.content;
    this.shortDescription = dto.shortDescription;
    this.blogId = blogId;
  }
}
