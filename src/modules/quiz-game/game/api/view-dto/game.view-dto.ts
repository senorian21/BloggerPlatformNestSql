import { Answer } from '../../../answer/domain/answer.entity';

export class GameViewDto {
  id: string;

  firstPlayerProgress: {
    player: { id: string; login: string };
    score: number;
    answers: {
      questionId: string | null;
      answerStatus: string | null;
      addedAt: Date | null;
    }[];
  };

  secondPlayerProgress: {
    player: { id: string; login: string };
    score: number;
    answers: {
      questionId: string | null;
      answerStatus: string | null;
      addedAt: Date | null;
    }[];
  } | null;

  questions: { id: string; body: string }[] | null;

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

    dto.id = String(base.id);
    dto.status = base.status;
    dto.pairCreatedDate = base.pairCreatedDate;

    // Вопросы (distinct, в порядке добавления в игру)
    const questions = rawGame
      .map((r) => ({
        id: r.questionId != null ? String(r.questionId) : null,
        body: r.questionBody,
      }))
      .filter((q) => q.id !== null)
      .reduce(
        (acc, q) => {
          if (!acc.find((x) => x.id === q.id)) {
            acc.push(q as { id: string; body: string });
          }
          return acc;
        },
        [] as { id: string; body: string }[],
      );

    // Маппер ответов: сопоставляем ответы с вопросами по индексу
    const mapAnswers = (answers: Answer[]) =>
      answers.map((a, idx) => ({
        questionId: questions[idx] ? questions[idx].id : null,
        answerStatus: a ? a.answerStatus : null,
        addedAt: a ? a.addedAt : null,
      }));

    // Прогресс первого игрока
    dto.firstPlayerProgress = {
      player: {
        id: String(base.firstPlayerUserId),
        login: base.firstPlayerLogin,
      },
      score: opts.firstPlayerAnswers.filter((a) => a.answerStatus === 'Correct')
        .length,
      answers: mapAnswers(opts.firstPlayerAnswers),
    };

    if (dto.status === 'PendingSecondPlayer') {
      dto.secondPlayerProgress = null;
      dto.questions = null;
      dto.startGameDate = null;
      dto.finishGameDate = null;
    } else {
      dto.secondPlayerProgress = {
        player: {
          id: String(base.secondPlayerUserId),
          login: base.secondPlayerLogin,
        },
        score: opts.secondPlayerAnswers.filter(
          (a) => a.answerStatus === 'Correct',
        ).length,
        answers: mapAnswers(opts.secondPlayerAnswers),
      };

      dto.questions = questions;
      dto.startGameDate = base.startGameDate;
      dto.finishGameDate = base.finishGameDate;
    }

    return dto;
  }
}
