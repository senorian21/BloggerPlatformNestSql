import {IQueryHandler, QueryHandler} from "@nestjs/cqrs";

import {GameQueryRepository} from "../../infrastructure/query/game.query-repository";
import {GameViewDto} from "../../api/view-dto/game.view-dto";


export class GetGameByIdQuery {
    constructor(public gameId: string) {}
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdQueryHandler
    implements IQueryHandler<GetGameByIdQuery, GameViewDto>
{
    constructor(private gameQueryRepository: GameQueryRepository) {}

    async execute(query: GetGameByIdQuery): Promise<GameViewDto> {
        return this.gameQueryRepository.getGameViewByIdOrNotFoundFail(query.gameId);
    }
}