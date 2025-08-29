import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from '../../../user-accounts/user/domain/user.entity';

@Entity('postLike')
export class PostLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.postLikes)
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => User, (user) => user.postLikes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  postId: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 10, nullable: false, collation: 'C' })
  status: string;

  @CreateDateColumn()
  addedAt: Date;
}
