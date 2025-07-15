import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RefreshAuthGuard } from '../../guards/refresh/refresh-token-auth.guard';
import { RefreshTokenFromRequest } from '../../guards/decorators/param/refresh-token.decorator';
import { RefreshTokenContextDto } from '../../auth/dto/refreshToken.dto';
import { DeleteDeviceByIdCommand } from '../application/usecases/delete-device-by-id.usecase';
import { DeleteAllDeviceExceptTheActiveOneCommand } from '../application/usecases/delete-all-devices-except-the-active-one.usercase';
import { GetAllSessionsByUserQuery } from '../application/queries/sessions-list-by-user.query-handler';
import { SessionViewDto } from './view-dto/session.view-dto';

@Controller('security')
export class DevicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Delete('devices/:deviceId')
  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDeviceById(
    @RefreshTokenFromRequest() refreshTokenReq: RefreshTokenContextDto,
    @Param('deviceId') deviceId: string,
  ) {
    await this.commandBus.execute<DeleteDeviceByIdCommand, void>(
      new DeleteDeviceByIdCommand(refreshTokenReq.userId, deviceId),
    );
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshAuthGuard)
  async deleteAllDevice(
    @RefreshTokenFromRequest() refreshTokenReq: RefreshTokenContextDto,
  ) {
    await this.commandBus.execute<
      DeleteAllDeviceExceptTheActiveOneCommand,
      void
    >(
      new DeleteAllDeviceExceptTheActiveOneCommand(
        refreshTokenReq.userId,
        refreshTokenReq.deviceId,
      ),
    );
  }

  @Get('devices')
  @UseGuards(RefreshAuthGuard)
  async getSessionList(
    @RefreshTokenFromRequest() refreshTokenReq: RefreshTokenContextDto,
  ) {
    const sessions = await this.queryBus.execute<
      GetAllSessionsByUserQuery,
      SessionViewDto[] | null
    >(new GetAllSessionsByUserQuery(refreshTokenReq.userId));
    return sessions;
  }
}
