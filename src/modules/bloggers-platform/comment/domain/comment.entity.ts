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
import { Post } from '../../post/domain/post.entity';
import { User } from '../../../user-accounts/user/domain/user.entity';
import {
  CreateCommentDomainDto,
  UpdateCommentDomainDto,
} from './dto/create-comment.domain.dto';
import { CommentLike } from './commentLike.entity';

export const contentConstraints = {
  minLength: 20,
  maxLength: 300,
};

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 300, nullable: false, collation: 'C' })
  content: string;

  @Column({ type: 'integer', nullable: false, default: 0 })
  likeCount: number;

  @Column({ type: 'integer', nullable: false, default: 0 })
  dislikeCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Post, (post) => post.comments)
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: number;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comments)
  commentLikes: CommentLike[];

  static create(dto: CreateCommentDomainDto, postId: number, userId: number) {
    const newComment = new Comment();
    newComment.content = dto.content;
    newComment.postId = postId;
    newComment.userId = userId;
    return newComment;
  }

  update(dto: UpdateCommentDomainDto) {
    this.content = dto.content;
  }
}
