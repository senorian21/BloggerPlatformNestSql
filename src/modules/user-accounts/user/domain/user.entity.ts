import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmailConfirmation } from './email-confirmation.entity';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { Session } from '../../security/domain/session.entity';
import { PostLike } from '../../../bloggers-platform/post/domain/postLike.entity';
import { NewestLikes } from '../../../bloggers-platform/post/domain/newestLikes.entity';
import { Comment } from '../../../bloggers-platform/comment/domain/comment.entity';
import { CommentLike } from '../../../bloggers-platform/comment/domain/commentLike.entity';
import { Player } from '../../../quiz-game/player/domain/player.entity';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({
    type: 'varchar',
    length: 10,
    unique: true,
    nullable: false,
    collation: 'C',
  })
  login: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
    collation: 'C',
  })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false, collation: 'C' })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(
    () => EmailConfirmation,
    (emailConfirmation) => emailConfirmation.users,
    { cascade: true },
  )
  emailConfirmation: EmailConfirmation;

  @OneToMany(() => Session, (session) => session.user, { cascade: true })
  sessions: Session[];

  @OneToMany(() => PostLike, (postLike) => postLike.user, { cascade: true })
  postLikes: PostLike[];

  @OneToMany(() => CommentLike, (commentLike) => commentLike.user, {
    cascade: true,
  })
  commentLike: CommentLike[];

  @OneToMany(() => Comment, (comment) => comment.user, { cascade: true })
  comments: Comment[];

  @OneToMany(() => NewestLikes, (newestLikes) => newestLikes.user, {
    cascade: true,
  })
  newestLikes: NewestLikes[];

  @OneToMany(() => Player, (player) => player.user, { cascade: true })
  players: Player[];

  static create(dto: CreateUserDomainDto, passwordHash: string) {
    const newUser = new User();
    newUser.email = dto.email;
    newUser.login = dto.login;
    newUser.passwordHash = passwordHash;

    const confirmationCode = randomUUID();
    const expirationDate = add(new Date(), { days: 7 });

    const confirmation = new EmailConfirmation();
    confirmation.isConfirmed = false;
    confirmation.confirmationCode = confirmationCode;
    confirmation.expirationDate = expirationDate;
    confirmation.users = newUser;

    newUser.emailConfirmation = confirmation;

    return newUser;
  }

  updateCodeAndExpirationDate(
    newConfirmationCode: string,
    newExpirationDate: Date,
  ): void {
    if (!this.emailConfirmation) {
      this.emailConfirmation = new EmailConfirmation();
      this.emailConfirmation.users = this;
    }
    this.emailConfirmation.confirmationCode = newConfirmationCode;
    this.emailConfirmation.expirationDate = newExpirationDate;
    this.emailConfirmation.isConfirmed = false;
  }

  updatePassword(newPasswordHash: string) {
    this.passwordHash = newPasswordHash;
  }
}
