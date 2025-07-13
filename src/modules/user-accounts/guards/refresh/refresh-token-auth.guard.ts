import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../../auth/infrastructure/auth.repository';

@Injectable()
export class RefreshAuthGuard implements CanActivate {
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private authRepository: AuthRepository,

    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieHeader = request.headers.cookie;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (!cookieHeader) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised',
      });
    }
    try{
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const refreshToken = cookies['refreshToken'];
    if (!refreshToken) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised ',
      });
    }
    const payload = await this.refreshTokenContext.verify(refreshToken);
    if (!payload || !payload.userId || !payload.deviceName) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised ',
      });
    }
    const foundSession = await this.authRepository.findSession({
      deviceId: payload.deviceId,
      userId: payload.userId,
    });
    if (!foundSession) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised',
      });
    }
    const tokenIat = new Date(payload.iat * 1000).getTime(); // если iat в секундах
    const sessionCreatedAt = new Date(foundSession.createdAt).getTime();

    if (tokenIat !== sessionCreatedAt) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised',
      });
    }

    request.user = payload;
    return true;
    } catch (err) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised',
      });
    }
  }
}
