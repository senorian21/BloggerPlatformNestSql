import { UserRepository } from '../../../user/infrastructure/user.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CryptoService } from '../../../adapters/crypto.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}

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
}
