import { Answer } from '../../../answer/domain/answer.entity';

export class GameViewDto {
  id: string;

  firstPlayerProgress: {
    player: { id: number; login: string };
    score: number;
    answers: {
      questionId: number | null;
      answerStatus: string | null;
      addedAt: Date | null;
    }[];
  };

  secondPlayerProgress: {
    player: { id: number; login: string };
    score: number;
    answers: {
      questionId: number | null;
      answerStatus: string | null;
      addedAt: Date | null;
    }[];
  } | null;

  questions: { id: number; body: string }[] | null;

  status: string;
  pairCreatedDate: Date;
  startGameDate: Date | null;
  finishGameDate: Date | null;

  static mapToView(
    rawGame: any[],
    opts: {
      firstPlayerAnswers: Answer[];
      secondPlayerAnswers: Answer[];
    },
  ): GameViewDto {
    const dto = new GameViewDto();
    const base = rawGame[0];

    dto.id = base.id;
    dto.status = base.status;
    dto.pairCreatedDate = base.pairCreatedDate;

    // Вопросы (distinct, в порядке добавления в игру)
    const questions = rawGame
      .map((r) => ({ id: r.questionId, body: r.questionBody }))
      .filter((q) => q.id)
      .reduce(
        (acc, q) => {
          if (!acc.find((x) => x.id === q.id)) acc.push(q);
          return acc;
        },
        [] as { id: number; body: string }[],
      );

    // Прогресс первого игрока
    dto.firstPlayerProgress = {
      player: {
        id: base.firstPlayerId,
        login: base.firstPlayerLogin,
      },
      score: opts.firstPlayerAnswers.filter((a) => a.answerStatus === 'Correct')
        .length,
      answers: questions.map((q, idx) => {
        const answer = opts.firstPlayerAnswers[idx];
        return {
          questionId: q ? q.id : null,
          answerStatus: answer ? answer.answerStatus : null,
          addedAt: answer ? answer.addedAt : null,
        };
      }),
    };

    // Если игра в статусе ожидания второго игрока
    if (dto.status === 'PendingSecondPlayer') {
      dto.secondPlayerProgress = null;
      dto.questions = null;
      dto.startGameDate = null;
      dto.finishGameDate = null;
    } else {
      // Прогресс второго игрока
      dto.secondPlayerProgress = {
        player: {
          id: base.secondPlayerId,
          login: base.secondPlayerLogin,
        },
        score: opts.secondPlayerAnswers.filter(
          (a) => a.answerStatus === 'Correct',
        ).length,
        answers: questions.map((q, idx) => {
          const answer = opts.secondPlayerAnswers[idx];
          return {
            questionId: q ? q.id : null,
            answerStatus: answer ? answer.answerStatus : null,
            addedAt: answer ? answer.addedAt : null,
          };
        }),
      };

      dto.questions = questions;
      dto.startGameDate = base.startGameDate;
      dto.finishGameDate = base.finishGameDate;
    }

    return dto;
  }
}
