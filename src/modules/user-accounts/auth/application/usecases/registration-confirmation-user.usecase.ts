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
    const userEmailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        code: dto.code,
      });
    if (!userEmailConfirmation) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'code',
        message: 'User does not exist',
      });
    }
    if (userEmailConfirmation?.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'code',
        message: 'Code is invalid or already used',
      });
    }

    if (new Date(userEmailConfirmation!.expirationDate) < new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        field: 'expirationDate',
        message: 'User does not exist',
      });
    }
    userEmailConfirmation.registrationConfirmationUser();
    await this.userRepository.saveEmailConfirmation(userEmailConfirmation);
  }
}
