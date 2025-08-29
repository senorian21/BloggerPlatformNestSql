import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../../user-accounts/user/domain/user.entity';
import { Post } from './post.entity';

@Entity({ name: 'newestLikes' })
export class NewestLikes {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  addedAt: Date;

  @ManyToOne(() => User, (user) => user.newestLikes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Post, (post) => post.newestLikes)
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: number;
}
