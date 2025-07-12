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

    @InjectModel(Session.name)
    private sessionModel: SessionModelType,

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

    const userId = result._id.toString();

    // Ищем существующую сессию по userId и deviceName
    const existSession = await this.authRepository.findSession({
      userId,
      deviceName: deviceName,
    });

    try {
      let deviceId: string;

      // Если сессия существует и не удалена — используем её deviceId
      if (existSession && existSession.deletedAt === null) {
        deviceId = existSession.deviceId;
      } else {
        // Иначе генерируем новый deviceId
        deviceId = randomUUID();
      }

      // Генерируем refresh token с актуальным deviceId
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
        // Если сессия удалена — выбрасываем ошибку или создаем новую
        if (existSession.deletedAt !== null) {
          throw new DomainException({
            code: DomainExceptionCode.Unauthorized,
            message: 'Session deleted',
          });
        }

        // Обновляем только iat и exp, оставляя deviceId и другие поля неизменными
        existSession.updateSession(
          refreshTokenVerify.iat,
          refreshTokenVerify.exp,
        );
        await this.authRepository.save(existSession);
      } else {
        // Создаем новую сессию с актуальным deviceId
        const newSession = await this.sessionModel.createSession(
          userId,
          refreshTokenVerify.iat,
          refreshTokenVerify.exp,
          deviceId,
          ip,
          deviceName,
        );
        await this.authRepository.save(newSession);
      }

      // Генерируем access token
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
