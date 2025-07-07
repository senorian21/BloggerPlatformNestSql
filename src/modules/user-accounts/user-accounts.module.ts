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
import { CryptoService } from './adapters/crypto.service';
import { NodemailerService } from './adapters/nodemeiler/nodemeiler.service';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth/application/auth.service';
import { AuthController } from './auth/api/auth.controller';
import { EmailService } from './adapters/nodemeiler/ template/email-examples';
import { AuthQueryRepository } from './auth/infrastructure/query/auth.query-repository';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RateLimiter.name, schema: RateLimiterSchema },
    ]),
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
  ],
  controllers: [UserController, AuthController],
  providers: [
    UserRepository,
    UserQueryRepository,
    UserService,
    CryptoService,
    NodemailerService,
    AuthService,
    JwtService,
    EmailService,
    AuthQueryRepository,
    JwtStrategy,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: 'access-token-secret',
          signOptions: { expiresIn: '5m' },
        });
      },
      inject: [],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: 'refresh-token-secret',
          signOptions: { expiresIn: '10m' },
        });
      },
      inject: [],
    },
  ],
  exports: [],
})
export class UserAccountsModule {}
