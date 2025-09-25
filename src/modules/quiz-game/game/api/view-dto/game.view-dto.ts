import { GameStatus } from '../../domain/game.entity';

export class GameViewDto {
  id: string;
  firstPlayerProgress: {
    answers: { questionId: string; answerStatus: string; addedAt: Date }[];
    player: { id: string; login: string };
    score: number;
  };
  secondPlayerProgress: {
    answers: { questionId: string; answerStatus: string; addedAt: Date }[];
    player: { id: string; login: string };
    score: number;
  };
  questions: { id: string; body: string }[] | null;
  status: GameStatus;
  pairCreatedDate: Date;
  startGameDate: Date | null;
  finishGameDate: Date | null;

  static mapToView(rawGame: any[]): GameViewDto {
    const dto = new GameViewDto();

    const firstPlayerAnswers = rawGame
      .filter((r) => r.firstPlayerAnswer_questionId)
      .map((r) => ({
        questionId: r.firstPlayerAnswer_questionId,
        answerStatus: r.firstPlayerAnswer_answerStatus,
        addedAt: r.firstPlayerAnswer_addedAt,
      }));

    const secondPlayerAnswers = rawGame
      .filter((r) => r.secondPlayerAnswer_questionId)
      .map((r) => ({
        questionId: r.secondPlayerAnswer_questionId,
        answerStatus: r.secondPlayerAnswer_answerStatus,
        addedAt: r.secondPlayerAnswer_addedAt,
      }));

    const questions = rawGame
      .filter((r) => r.questionId)
      .map((r) => ({
        id: r.questionId,
        body: r.questionBody,
      }));

    const base = rawGame[0];

    dto.id = base.id;
    dto.firstPlayerProgress = {
      answers: firstPlayerAnswers,
      player: {
        id: base.firstPlayerId,
        login: base.firstPlayerLogin,
      },
      score: 0, // расчёт очков можно добавить отдельно
    };
    dto.secondPlayerProgress = {
      answers: secondPlayerAnswers,
      player: {
        id: base.secondPlayerId,
        login: base.secondPlayerLogin,
      },
      score: 0,
    };
    dto.questions = base.status === GameStatus.Active ? questions : null;
    dto.status = base.status;
    dto.pairCreatedDate = base.pairCreatedDate;
    dto.startGameDate = base.startGameDate;
    dto.finishGameDate = base.finishGameDate;

    return dto;
  }
}
