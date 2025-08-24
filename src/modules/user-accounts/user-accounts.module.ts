import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRepository } from './user/infrastructure/user.repository';
import { UserQueryRepository } from './user/infrastructure/query/user.query-repository';
import { UserController } from './user/api/user.controller';
import { RateLimiter } from './guards/rate/domain/rate-limiter.entity';
import { CryptoService } from './adapters/crypto.service';
import { NodemailerService } from './adapters/nodemeiler/nodemeiler.service';
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
import { AuthRepository } from './auth/infrastructure/auth.repository';
import { RefreshTokenUseCase } from './auth/application/usecases/refresh-token.usecase';
import { DeleteDeviceByIdUseCase } from './security/application/usecases/delete-device-by-id.usecase';
import { DeleteAllDeviceUseCase } from './security/application/usecases/delete-all-devices-except-the-active-one.usercase';
import { DevicesController } from './security/api/security.controller';
import { SessionsQueryRepository } from './security/infrastructure/query/security.query-repository';
import { GetAllSessionsByUserQueryHandler } from './security/application/queries/sessions-list-by-user.query-handler';
import { LogoutUseCase } from './auth/application/usecases/logout.usecase';
import { UserAccountsConfig } from './config/user-accounts.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/domain/user.entity';
import { EmailConfirmation } from './user/domain/email-confirmation.entity';

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
  imports: [TypeOrmModule.forFeature([User, EmailConfirmation, RateLimiter])],
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

    UserAccountsConfig,

    ...commandHandlers,
    ...queryHandlers,
    JwtStrategy,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.accessTokenSecret,
          signOptions: { expiresIn: userAccountConfig.accessTokenExpireIn },
        });
      },
      inject: [UserAccountsConfig],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.refreshTokenSecret,
          signOptions: { expiresIn: userAccountConfig.refreshTokenExpireIn },
        });
      },
      inject: [UserAccountsConfig],
    },
  ],
  exports: [UsersExternalQueryRepository, JwtStrategy],
})
export class UserAccountsModule {}
