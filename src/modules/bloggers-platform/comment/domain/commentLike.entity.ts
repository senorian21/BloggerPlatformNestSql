import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../../user-accounts/user/domain/user.entity';
import { Comment } from './comment.entity';

@Entity('commentLike')
export class CommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Comment, (comment) => comment.commentLikes)
  @JoinColumn({ name: 'commentId' })
  comments: Comment;

  @Column()
  commentId: number;

  @ManyToOne(() => User, (user) => user.commentLike)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 10, nullable: false, collation: 'C' })
  status: string;

  @CreateDateColumn()
  addedAt: Date;
}
