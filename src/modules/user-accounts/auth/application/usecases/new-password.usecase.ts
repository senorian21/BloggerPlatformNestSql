import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UserRepository } from '../../../user/infrastructure/user.repository';
import { CryptoService } from '../../../adapters/crypto.service';
import { newPasswordInputDto } from '../../dto/new-password.input-dto';

export class NewPasswordCommand {
  constructor(public dto: newPasswordInputDto) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordUseCase
  implements ICommandHandler<NewPasswordCommand, void>
{
  constructor(
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute({ dto }: NewPasswordCommand): Promise<void> {
    const emailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        code: dto.recoveryCode,
      });
    console.log(emailConfirmation);
    if (!emailConfirmation) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User does not exist',
      });
    }
    const newPasswordHash = await this.cryptoService.createPasswordHash(
      dto.newPassword,
    );

    emailConfirmation.users.updatePassword(newPasswordHash);
    await this.userRepository.save(emailConfirmation.users);
  }
}
