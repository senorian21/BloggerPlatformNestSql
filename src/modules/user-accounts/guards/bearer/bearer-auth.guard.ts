import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '../../adapters/jwt/jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Request } from 'express';
import { IdType } from '../../auth/dto/IdType.dto';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Missing or invalid Bearer token',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const result = await this.jwtService.verifyToken(token);

      if (!result) {
        throw new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Invalid or expired token',
        });
      }

      request.user = { id: result.userId } as IdType;
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Token expired',
        });
      }

      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid token',
      });
    }
  }
}
