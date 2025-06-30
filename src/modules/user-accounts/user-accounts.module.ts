import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user/domain/user.entity';
import { UserRepository } from './user/infrastructure/user.repository';
import { UserQueryRepository } from './user/infrastructure/query/user.query-repository';
import { UserService } from './user/application/user.service';
import { UserController } from './user/api/user.controller';
import {
  RateLimiter,
  RateLimiterSchema,
} from './guards/rate/domain/rate-limiter.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RateLimiter.name, schema: RateLimiterSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserRepository, UserQueryRepository, UserService],
  exports: [],
})
export class UserAccountsModule {}
