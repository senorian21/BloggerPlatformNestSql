import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UserRepository } from '../../../user/infrastructure/user.repository';
import { registrationConfirmationUser } from '../../dto/registration-confirmation';

export class RegistrationConfirmationUserCommand {
  constructor(public dto: registrationConfirmationUser) {}
}

@CommandHandler(RegistrationConfirmationUserCommand)
export class RegistrationConfirmationUserUseCase
  implements ICommandHandler<RegistrationConfirmationUserCommand, void>
{
  constructor(private userRepository: UserRepository) {}

  async execute({ dto }: RegistrationConfirmationUserCommand): Promise<void> {
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
}
