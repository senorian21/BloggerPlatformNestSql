import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RateLimiter } from './domain/rate-limiter.entity';

@Injectable()
export class RateLimitInterceptor implements CanActivate {
  private readonly MAX_REQUESTS = 5;
  private readonly TIME_WINDOW_MS = 10 * 1000;

  constructor(
    @InjectRepository(RateLimiter)
    private readonly rateLimiterRepo: Repository<RateLimiter>,
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

    const count = await this.rateLimiterRepo
      .createQueryBuilder('rl')
      .where('rl.IP = :ip', { ip })
      .andWhere('rl.URL = :url', { url })
      .andWhere('rl.date >= :timeAgo', { timeAgo })
      .getCount();

    if (count >= this.MAX_REQUESTS) {
      throw new DomainException({
        code: DomainExceptionCode.TooManyRequests,
        message: 'Too many requests',
      });
    }

    await this.rateLimiterRepo.save(
      this.rateLimiterRepo.create({
        IP: ip,
        URL: url,
      }),
    );

    return true;
  }
}
