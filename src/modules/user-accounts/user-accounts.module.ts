import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user/domain/user.entity';
import { UserRepository } from './user/infrastructure/user.repository';
import { UserQueryRepository } from './user/infrastructure/query/user.query-repository';
import { UserController } from './user/api/user.controller';
import {
  RateLimiter,
  RateLimiterSchema,
} from './guards/rate/domain/rate-limiter.entity';
import { CryptoService } from './adapters/crypto.service';
import { NodemailerService } from './adapters/nodemeiler/nodemeiler.service';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth/application/service/auth.service';
import { AuthController } from './auth/api/auth.controller';
import { EmailService } from './adapters/nodemeiler/ template/email-examples';
import { AuthQueryRepository } from './auth/infrastructure/query/auth.query-repository';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';
import { CreateUserUseCase } from './user/application/usecases/create-user.usecase';
import { DeleteUserUseCase } from './user/application/usecases/delete-user.usecase';
import { GetAllUsersQueryHandler } from './user/application/queries/get-all-users.query-handler';
import { GetUserByIdQueryHandler } from './user/application/queries/get-users-by-id.query-handler';
import { LoginUserUseCase } from './auth/application/usecases/login-user.usecase';
import { NewPasswordUseCase } from './auth/application/usecases/new-password.usecase';
import { PasswordRecoveryUseCase } from './auth/application/usecases/password-recovery.usecase';
import { RegisterUserUseCase } from './auth/application/usecases/register-user.usecase';
import { RegistrationConfirmationUserUseCase } from './auth/application/usecases/registration-confirmation-user.usecase';
import { RegistrationEmailResendingUseCase } from './auth/application/usecases/registration-email-resending.usecase';
import { AboutUserQueryHandler } from './auth/application/queries/me.query-handler';
import { UsersExternalQueryRepository } from './user/infrastructure/external-query/users.external-query-repository';
import { Session, SessionSchema } from './sessions/domain/session.entity';
import { AuthRepository } from './auth/infrastructure/auth.repository';
import { RefreshTokenUseCase } from './auth/application/usecases/refresh-token.usecase';
import { DeleteDeviceByIdUseCase } from './security/application/usecases/delete-device-by-id.usecase';
import { DeleteAllDeviceUseCase } from './security/application/usecases/delete-all-devices-except-the-active-one.usercase';
import { DevicesController } from './security/api/security.controller';
import { SessionsQueryRepository } from './security/infrastructure/query/security.query-repository';
import { GetAllSessionsByUserQueryHandler } from './security/application/queries/sessions-list-by-user.query-handler';
import { LogoutUseCase } from './auth/application/usecases/logout.usecase';

const commandHandlers = [
  CreateUserUseCase,
  DeleteUserUseCase,
  LoginUserUseCase,
  NewPasswordUseCase,
  PasswordRecoveryUseCase,
  RegisterUserUseCase,
  RegistrationConfirmationUserUseCase,
  RegistrationEmailResendingUseCase,
  RefreshTokenUseCase,
  DeleteDeviceByIdUseCase,
  DeleteAllDeviceUseCase,
  LogoutUseCase,
];

const queryHandlers = [
  GetAllUsersQueryHandler,
  GetUserByIdQueryHandler,
  AboutUserQueryHandler,
  GetAllSessionsByUserQueryHandler,
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RateLimiter.name, schema: RateLimiterSchema },
    ]),
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [UserController, AuthController, DevicesController],
  providers: [
    SessionsQueryRepository,
    UserQueryRepository,
    AuthQueryRepository,
    UsersExternalQueryRepository,

    CryptoService,
    AuthService,
    NodemailerService,
    JwtService,
    EmailService,

    UserRepository,
    AuthRepository,

    ...commandHandlers,
    ...queryHandlers,
    JwtStrategy,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: 'access-token-secret',
          signOptions: { expiresIn: '10s' },
        });
      },
      inject: [],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: 'refresh-token-secret',
          signOptions: { expiresIn: '20s' },
        });
      },
      inject: [],
    },
  ],
  exports: [UsersExternalQueryRepository, JwtStrategy],
})
export class UserAccountsModule {}
