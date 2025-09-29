import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { loginInputDto } from './input-dto/login.input-dto';
import { PasswordRecoveryInputDto } from '../dto/password-recovery.input-dto';
import { newPasswordInputDto } from './input-dto/new-password.input-dto';
import { registrationConfirmationUser } from './input-dto/registration-confirmation.input-dto';
import { registrationInputDto } from './input-dto/registration.input-dto';
import { RegistrationEmailResending } from './input-dto/registration-email-resending.input-dto';
import { ExtractUserFromRequest } from '../../guards/decorators/param/user.decorator';
import { UserContextDto } from '../dto/user-context.dto';
import { JwtAuthGuard } from '../../guards/bearer/jwt-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PasswordRecoveryCommand } from '../application/usecases/password-recovery.usecase';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { NewPasswordCommand } from '../application/usecases/new-password.usecase';
import { RegistrationConfirmationUserCommand } from '../application/usecases/registration-confirmation-user.usecase';
import { RegisterUserCommand } from '../application/usecases/register-user.usecase';
import { RegistrationEmailResendingCommand } from '../application/usecases/registration-email-resending.usecase';
import { AboutUserQuery } from '../application/queries/me.query-handler';
import { AuthViewDto } from './view-dto/auth.view-dto';
import { Response, Request } from 'express';
import { RateLimitInterceptor } from '../../guards/rate/rate-limiter.guard';
import { RefreshTokenFromRequest } from '../../guards/decorators/param/refresh-token.decorator';
import { RefreshTokenContextDto } from '../dto/refreshToken.dto';
import { RefreshTokenCommand } from '../application/usecases/refresh-token.usecase';
import { RefreshAuthGuard } from '../../guards/refresh/refresh-token-auth.guard';
import { LogoutCommand } from '../application/usecases/logout.usecase';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('password-recovery')
  //@UseGuards(RateLimitInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto) {
    await this.commandBus.execute<PasswordRecoveryCommand, void>(
      new PasswordRecoveryCommand(dto),
    );
  }

  @Post('login')
  //@UseGuards(RateLimitInterceptor)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: loginInputDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip: string =
      req.socket.remoteAddress ||
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) ||
      'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';
    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserCommand(dto, userAgent!, ip));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    return { accessToken };
  }

  @Post('new-password')
  //@UseGuards(RateLimitInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: newPasswordInputDto) {
    await this.commandBus.execute<NewPasswordCommand, void>(
      new NewPasswordCommand(dto),
    );
  }
  @Post('registration-confirmation')
  //@UseGuards(RateLimitInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(@Body() dto: registrationConfirmationUser) {
    await this.commandBus.execute<RegistrationConfirmationUserCommand, void>(
      new RegistrationConfirmationUserCommand(dto),
    );
  }
  @Post('registration')
  //@UseGuards(RateLimitInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() dto: registrationInputDto) {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }
  @Post('registration-email-resending')
  //@UseGuards(RateLimitInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(@Body() dto: RegistrationEmailResending) {
    await this.commandBus.execute<RegistrationEmailResendingCommand, void>(
      new RegistrationEmailResendingCommand(dto),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@ExtractUserFromRequest() user: UserContextDto) {
    const userEntity = await this.queryBus.execute<
      AboutUserQuery,
      AuthViewDto | null
    >(new AboutUserQuery(user.id));
    return userEntity;
  }

  @Post('refresh-token')
  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @RefreshTokenFromRequest() refreshTokenReq: RefreshTokenContextDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken; refreshToken }
    >(
      new RefreshTokenCommand(
        refreshTokenReq.deviceName,
        refreshTokenReq.ip,
        refreshTokenReq.userId,
        refreshTokenReq.deviceId,
      ),
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });
    return { accessToken: accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshAuthGuard)
  async logout(
    @RefreshTokenFromRequest() refreshTokenReq: RefreshTokenContextDto,
  ) {
    await this.commandBus.execute<LogoutCommand, void>(
      new LogoutCommand(refreshTokenReq.userId, refreshTokenReq.deviceId),
    );
  }
}
