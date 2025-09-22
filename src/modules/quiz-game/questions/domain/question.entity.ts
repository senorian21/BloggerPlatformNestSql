import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  CreateQuestionDomainDto,
  UpdateQuestionDomainDto,
} from './dto/questions.domain-dto';
import { PublishQuestionDomainDto } from './dto/publish-question.domain-dto';
import { GameQuestion } from './game-question.entity';

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

  @OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.question, {
    cascade: true,
  })
  gameQuestions: GameQuestion[];

  static create(dto: CreateQuestionDomainDto) {
    const question = new Question();
    question.body = dto.body;
    question.correctAnswers = dto.correctAnswers;
    return question;
  }

  update(dto: UpdateQuestionDomainDto) {
    const timeNow = new Date();
    this.body = dto.body;
    this.correctAnswers = dto.correctAnswers;
    this.updatedAt = timeNow;
  }

  publish(dto: PublishQuestionDomainDto) {
    const timeNow = new Date();
    this.published = dto.published;
    this.updatedAt = timeNow;
  }
}
