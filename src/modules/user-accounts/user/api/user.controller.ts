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
import { UserService } from '../application/user.service';
import { UserQueryRepository } from '../infrastructure/query/user.query-repository';
import { CreateUserDto } from './input-dto/user.input-dto';
import { GetUserQueryParams } from './input-dto/get-user-query-params.input-dto';
import { BasicAuthGuard } from '../../guards/basic/basic-auth.guard';

@Controller('users')
@UseGuards(BasicAuthGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private userQueryRepository: UserQueryRepository,
  ) {}

  @Post()
  async createPost(@Body() dto: CreateUserDto) {
    const userId = await this.userService.createUser(dto);
    return this.userQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') userId: string) {
    await this.userService.deleteUser(userId);
  }

  @Get()
  async getAllUsers(@Query() query: GetUserQueryParams) {
    return this.userQueryRepository.getAll(query);
  }
}
