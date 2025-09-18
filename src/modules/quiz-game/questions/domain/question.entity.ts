import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateQuestionDomainDto } from './dto/questions.input-dto';

export const bodyQuestionLength = {
  minLength: 10,
  maxLength: 500,
};

@Entity('question')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: false, collation: 'C' })
  body: string;

  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'::jsonb" })
  correctAnswers: string[];

  @Column({ type: 'boolean', default: false, nullable: false })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: null })
  updatedAt: Date;

  static create(dto: CreateQuestionDomainDto) {
    const question = new Question();
    question.body = dto.body;
    question.correctAnswers = dto.correctAnswers;
    return question;
  }
}
