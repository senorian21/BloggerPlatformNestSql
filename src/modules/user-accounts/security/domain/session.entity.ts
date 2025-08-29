import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/domain/user.entity';

@Entity({ name: 'session' })
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: false })
  deviceId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  deviceName: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  ip: string;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  static create(
    userId: number,
    iat: number,
    exp: number,
    deviceId: string,
    ip: string,
    deviceName: string,
  ) {
    const newSession = new Session();

    const createdAt = new Date(iat * 1000);
    const expiresAt = new Date(exp * 1000);

    newSession.deviceId = deviceId;
    newSession.userId = userId;
    newSession.createdAt = createdAt;
    newSession.expiresAt = expiresAt;
    newSession.ip = ip;
    newSession.deviceName = deviceName;

    return newSession;
  }

  updateSession(iat: number, exp: number) {
    this.createdAt = new Date(iat * 1000);
    this.expiresAt = new Date(exp * 1000);
  }
}
