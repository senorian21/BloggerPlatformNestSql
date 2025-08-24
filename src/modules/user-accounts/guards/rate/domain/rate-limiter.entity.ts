import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Repository,
} from 'typeorm';

@Entity({ name: 'rateLimiter' })
export class RateLimiter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  IP: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  URL: string;

  @CreateDateColumn()
  date: Date;
}
