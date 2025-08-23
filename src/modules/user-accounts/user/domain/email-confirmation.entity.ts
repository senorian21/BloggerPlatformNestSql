import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'emailConfirmation' })
export class EmailConfirmation {
  constructor() {}
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  confirmationCode: string;

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  expirationDate: Date;

  @Column({
    type: 'boolean',
    nullable: false,
  })
  isConfirmed: boolean;

  @OneToOne(() => User, (users) => users.emailConfirmation)
  @JoinColumn({ name: 'userId' })
  users: User;

  @Column()
  userId: number;
}
