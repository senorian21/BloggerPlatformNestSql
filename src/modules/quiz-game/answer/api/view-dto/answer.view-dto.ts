export class PlayerAnswerDto {
  questionId: string;
  answerStatus: string | null;
  addedAt: Date | null;

  static mapping(raw: {
    questionId: string;
    answerStatus: string | null;
    addedAt: Date | null;
  }): PlayerAnswerDto {
    const dto = new PlayerAnswerDto();
    dto.questionId = raw.questionId.toString();
    dto.answerStatus = raw.answerStatus;
    dto.addedAt = raw.addedAt;
    return dto;
  }
}
