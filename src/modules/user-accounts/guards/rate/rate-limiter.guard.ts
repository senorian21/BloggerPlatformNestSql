import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RateLimiter } from './domain/rate-limiter.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class RateLimitInterceptor implements CanActivate {
  private readonly MAX_REQUESTS = 5;
  private readonly TIME_WINDOW_MS = 10 * 1000;

  constructor(
    @InjectModel(RateLimiter.name)
    private readonly rateModel: Model<RateLimiter>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip =
      request.socket.remoteAddress ||
      (request.headers['x-forwarded-for'] as string) ||
      'unknown';

    const url = request.originalUrl;
    const now = new Date();
    const timeAgo = new Date(now.getTime() - this.TIME_WINDOW_MS);
    const count = await this.rateModel.countDocuments({
      IP: ip,
      URL: url,
      date: { $gte: timeAgo },
    });

    if (count >= this.MAX_REQUESTS) {
      throw new DomainException({
        code: DomainExceptionCode.TooManyRequests,
        message: 'Too many requests',
      });
    }

    const limit = new this.rateModel({ IP: ip, URL: url, date: now });
    await limit.save(); // Сохраняем в базе данных

    return true;
  }
}
