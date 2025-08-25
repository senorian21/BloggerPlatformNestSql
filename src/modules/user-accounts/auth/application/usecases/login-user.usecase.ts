import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/auth-tokens.inject-constants';
import { loginInputDto } from '../../dto/login.input-dto';
import { AuthService } from '../service/auth.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { randomUUID } from 'crypto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { Session } from '../../../security/domain/session.entity';

export class LoginUserCommand {
  constructor(
    public dto: loginInputDto,
    public deviceName: string,
    public ip: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements
    ICommandHandler<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private authService: AuthService,
    private authRepository: AuthRepository,
  ) {}

  async execute({
    dto,
    deviceName,
    ip,
  }: LoginUserCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const result = await this.authService.checkUserCredentials(
      dto.loginOrEmail,
      dto.password,
    );
    const userId = result!.id;

    const existSession = await this.authRepository.findSession({
      userId,
      deviceName: deviceName,
    });

    let deviceId: string;
    if (existSession) {
      deviceId = existSession.deviceId;
    } else {
      deviceId = randomUUID();
    }

    const refreshToken = this.refreshTokenContext.sign({
      userId,
      deviceId,
      deviceName,
      ip,
    });

    const { iat, exp } = this.refreshTokenContext.verify(refreshToken);
    if (!iat || !exp) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token not verified',
      });
    }

    if (existSession) {
      existSession.updateSession(iat, exp);
      await this.authRepository.saveSession(existSession);
    } else {
      const newSession = Session.create(
        userId,
        iat,
        exp,
        deviceId,
        ip,
        deviceName,
      );
      await this.authRepository.saveSession(newSession);
    }

    const accessToken = this.accessTokenContext.sign({ userId });

    return { accessToken, refreshToken };
  }
}
