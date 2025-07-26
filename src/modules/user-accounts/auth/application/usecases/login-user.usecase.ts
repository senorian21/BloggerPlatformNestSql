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
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionModelType,
} from '../../../sessions/domain/session.entity';

export class LoginUserCommand {
  constructor(
    public dto: loginInputDto,
    public deviceName: string,
    public ip: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements ICommandHandler<LoginUserCommand, { accessToken: string }>
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

    const userId = result.id;

    const existSession = await this.authRepository.findSession({
      userId,
      deviceName: deviceName,
    });

    try {
      let deviceId: string;

      if (existSession && existSession.deletedAt === null) {
        deviceId = existSession.deviceId;
      } else {
        deviceId = randomUUID();
      }

      const refreshToken = this.refreshTokenContext.sign({
        userId: userId,
        deviceId: deviceId,
        deviceName: deviceName,
        ip: ip,
      });

      const refreshTokenVerify = this.refreshTokenContext.verify(refreshToken);
      if (!refreshTokenVerify) {
        throw new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Refresh token not verified',
        });
      }

      if (existSession) {
        if (existSession.deletedAt !== null) {
          throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Session deleted',
          });
        }
        await this.authRepository.updateSession(
          new Date(refreshTokenVerify.iat * 1000),
          new Date(refreshTokenVerify.exp * 1000),
          existSession.id,
        );
      } else {
        const newSession = await this.authRepository.createSession(
          userId,
          refreshTokenVerify.iat,
          refreshTokenVerify.exp,
          deviceId,
          ip,
          deviceName,
        );
      }

      const accessToken = this.accessTokenContext.sign({
        userId: userId,
      });

      return { accessToken, refreshToken };
    } catch (err) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized session',
      });
    }
  }
}
