import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../user/domain/user.entity';
import { UserRepository } from '../../user/infrastructure/user.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CryptoService } from '../../adapters/crypto.service';
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { NodemailerService } from '../../adapters/nodemeiler/nodemeiler.service';
import { EmailService } from '../../adapters/nodemeiler/ template/email-examples';
import { loginInputDto } from '../dto/login.input-dto';
import { PasswordRecoveryInputDto } from '../dto/password-recovery.input-dto';
import { registrationInputDto } from '../dto/registration.input-dto';
import { newPasswordInputDto } from '../dto/new-password.input-dto';
import { registrationConfirmationUser } from '../dto/registration-confirmation';
import { RegistrationEmailResending } from '../dto/registration-email-resending.input-dto';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: UserModelType,
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
    private nodemailerService: NodemailerService,
    private emailService: EmailService,
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
  ) {}

  async loginUser(dto: loginInputDto) {
    const result = await this.checkUserCredentials(
      dto.loginOrEmail,
      dto.password,
    );

    const userId = result._id.toString();

    const accessToken = this.accessTokenContext.sign({
      userId: userId,
    });

    return { accessToken };
  }

  async checkUserCredentials(loginOrEmail: string, password: string) {
    const user = await this.userRepository.findByLoginOrEmail(loginOrEmail);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User does not exist',
      });
    }

    const hash = user.passwordHash;

    const isPassCorrect = await this.cryptoService.comparePasswords({
      password,
      hash,
    });

    if (!isPassCorrect) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User does not exist',
      });
    }

    return user;
  }

  async passwordRecovery(dto: PasswordRecoveryInputDto) {
    const user = await this.userRepository.findByLoginOrEmail(dto.email);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User does not exist',
      });
    }

    const newConfirmationCode = randomUUID();
    const newExpirationDate = add(new Date(), { days: 7 });

    user.updateCodeAndExpirationDate(newConfirmationCode, newExpirationDate);

    await this.userRepository.save(user);

    this.nodemailerService
      .sendEmail(
        user.email,
        newConfirmationCode,
        this.emailService.passwordRecovery.bind(this.emailService),
      )
      .catch((er) => console.error('Error in send email:', er));
  }

  async newPassword(dto: newPasswordInputDto) {
    const user = await this.userRepository.findByCode(dto.recoveryCode);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User does not exist',
      });
    }
    const newPasswordHash = await this.cryptoService.createPasswordHash(
      dto.newPassword,
    );
    user.updatePassword(newPasswordHash);
    await this.userRepository.save(user);
  }
  async registrationConfirmationUser(dto: registrationConfirmationUser) {
    const user = await this.userRepository.findByCode(dto.code);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'code',
        message: 'User does not exist',
      });
    }

    if (user.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'code', // ← Изменили на 'code'
        message: 'Code is invalid or already used',
      });
    }

    if (new Date(user.emailConfirmation.expirationDate) < new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'expirationDate',
        message: 'User does not exist',
      });
    }
    user.registrationConfirmationUser();
    this.userRepository.save(user);
  }
  async registerUser(dto: registrationInputDto) {
    const user = await this.userRepository.doesExistByLoginOrEmail(
      dto.login,
      dto.email,
    );
    if (user) {
      if (user.login === dto.login) {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: 'Login is already taken',
          field: 'login',
        });
      } else {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          field: 'email',
          message: 'Email is already registered',
        });
      }
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );
    const newUser = this.userModel.createInstance(
      {
        login: dto.login,
        email: dto.email,
        password: dto.password,
      },
      passwordHash,
    );

    await this.userRepository.save(newUser);

    this.nodemailerService
      .sendEmail(
        newUser.email,
        newUser.emailConfirmation.confirmationCode,
        this.emailService.registrationEmail.bind(this.emailService),
      )
      .catch((er) => console.error('error in send email:', er));
  }
  async registrationEmailResending(dto: RegistrationEmailResending) {
    const user = await this.userRepository.findByLoginOrEmail(dto.email);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'email',
        message: 'User not found',
      });
    }

    if (user.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'email', // Changed from 'isConfirmed' to 'email'
        message: 'Already confirmed',
      });
    }

    if (new Date(user.emailConfirmation.expirationDate) < new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'emailConfirmation.expirationDate',
        message: 'Confirmation time expired',
      });
    }

    const newConfirmationCode = randomUUID();
    const newExpirationDate = add(new Date(), { days: 7 });
    user.updateCodeAndExpirationDate(newConfirmationCode, newExpirationDate);

    await this.userRepository.save(user);

    this.nodemailerService
      .sendEmail(
        user.email,
        newConfirmationCode,
        this.emailService.registrationEmail.bind(this.emailService),
      )
      .catch((er) => console.error('Error in send email:', er));
  }
}
