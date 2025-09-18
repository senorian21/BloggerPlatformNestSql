export class CreateQuestionDomainDto {
  body: string;
  correctAnswers: string[];
}

export class UpdateQuestionDomainDto extends CreateQuestionDomainDto {}
