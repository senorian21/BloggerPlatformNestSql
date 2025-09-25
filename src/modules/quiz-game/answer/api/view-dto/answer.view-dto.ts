export class PlayerAnswerDto {
  questionId: number;
  answerStatus: string | null;
  addedAt: Date | null;

  static mapping(raw: {
    questionId: number;
    answerStatus: string | null;
    addedAt: Date | null;
  }): PlayerAnswerDto {
    const dto = new PlayerAnswerDto();
    dto.questionId = raw.questionId;
    dto.answerStatus = raw.answerStatus;
    dto.addedAt = raw.addedAt;
    return dto;
  }
}
