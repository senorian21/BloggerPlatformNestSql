export class TopUserViewDto {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  player: {
    id: string;
    login: string;
  };

  static mapToView(raw: any): TopUserViewDto {
    const dto = new TopUserViewDto();
    dto.sumScore = Number(raw.sumScore);
    dto.avgScores = Number(raw.avgScores);
    dto.gamesCount = Number(raw.gamesCount);
    dto.winsCount = Number(raw.winsCount);
    dto.lossesCount = Number(raw.lossesCount);
    dto.drawsCount = Number(raw.drawsCount);
    dto.player = {
      id: String(raw.player_id),
      login: String(raw.player_login),
    };
    return dto;
  }
}
