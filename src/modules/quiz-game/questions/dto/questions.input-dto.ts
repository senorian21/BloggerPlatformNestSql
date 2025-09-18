export class CreateQuestionDto {
  body: string;
  correctAnswers: string[];
}

export class UpdateQuestionDto extends CreateQuestionDto {}
