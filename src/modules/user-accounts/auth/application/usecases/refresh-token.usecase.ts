import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/auth-tokens.inject-constants';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class RefreshTokenCommand {
  constructor(
    public deviceName: string,
    public ip: string,
    public userId: number,
    public deviceId: string,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase
  implements
    ICommandHandler<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private authRepository: AuthRepository,
  ) {}

  async execute({
    deviceName,
    ip,
    userId,
    deviceId,
  }: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const sessionExists = await this.authRepository.findSession({
      deviceId: deviceId,
    });
    if (!sessionExists) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'There is no such session',
      });
    }
    if (sessionExists.deletedAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'There is no such session',
      });
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

    const iatDate = new Date(refreshTokenVerify.iat * 1000);
    const expDate = new Date(refreshTokenVerify.exp * 1000);

    await this.authRepository.updateSession(iatDate, expDate, userId);

    const accessToken = this.accessTokenContext.sign({
      userId: userId,
    });

    return { accessToken, refreshToken };
  }
}
