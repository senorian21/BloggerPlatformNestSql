import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RateLimitInterceptor implements CanActivate {
  private readonly MAX_REQUESTS = 5;
  private readonly TIME_WINDOW_MS = 10 * 1000;

  constructor(
    @InjectDataSource()
    protected dataSource: DataSource,
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

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*)::int AS count 
      FROM "rateLimiters" 
      WHERE "ip" = $1 AND "url" = $2 AND "createdAt" >= $3
      `,
      [ip, url, timeAgo],
    );
    const count = parseInt(countResult[0].count);

    if (count >= this.MAX_REQUESTS) {
      throw new DomainException({
        code: DomainExceptionCode.TooManyRequests,
        message: 'Too many requests',
      });
    }

    await this.dataSource.query(
      `
      INSERT INTO "rateLimiters" ("ip", "url", "createdAt") 
      VALUES ($1, $2, $3)
      `,
      [ip, url, now],
    );

    return true;
  }
}
