import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './input-dto/user.input-dto';
import { GetUserQueryParams } from './input-dto/get-user-query-params.input-dto';
import { BasicAuthGuard } from '../../guards/basic/basic-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/usecases/create-user.usecase';
import { DeleteUserCommand } from '../application/usecases/delete-user.usecase';
import { GetAllUsersQuery } from '../application/queries/get-all-users.query-handler';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from './view-dto/user.view-dto';
import { GetUserByIdQuery } from '../application/queries/get-users-by-id.query-handler';

@Controller('sa')
@UseGuards(BasicAuthGuard)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/users')
  async createUser(@Body() dto: CreateUserDto) {
    const userId = await this.commandBus.execute<CreateUserCommand, number>(
      new CreateUserCommand(dto),
    );
    return this.queryBus.execute<GetUserByIdQuery, UserViewDto>(
      new GetUserByIdQuery(userId),
    );
  }

  @Delete('/users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') userId: string) {
    await this.commandBus.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(Number(userId)),
    );
  }

  @Get('/users')
  async getAllUsers(@Query() query: GetUserQueryParams) {
    return this.queryBus.execute<
      GetAllUsersQuery,
      PaginatedViewDto<UserViewDto[]>
    >(new GetAllUsersQuery(query));
  }
}
