import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PasswordRecoveryInputDto } from '../../dto/password-recovery.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { UserRepository } from '../../../user/infrastructure/user.repository';
import { NodemailerService } from '../../../adapters/nodemeiler/nodemeiler.service';
import { EmailService } from '../../../adapters/nodemeiler/ template/email-examples';

export class PasswordRecoveryCommand {
  constructor(public dto: PasswordRecoveryInputDto) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand, void>
{
  constructor(
    private userRepository: UserRepository,
    private nodemailerService: NodemailerService,
    private emailService: EmailService,
  ) {}

  async execute({ dto }: PasswordRecoveryCommand): Promise<void> {
    const user = await this.userRepository.findByLoginOrEmail(dto.email);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User does not exist',
      });
    }

    const newConfirmationCode = randomUUID();
    const newExpirationDate = add(new Date(), { days: 7 });

    await this.userRepository.updateCodeAndExpirationDate(
      newConfirmationCode,
      newExpirationDate,
      user.id,
    );

    this.nodemailerService
      .sendEmail(
        user.email,
        newConfirmationCode,
        this.emailService.passwordRecovery.bind(this.emailService),
      )
      .catch((er) => console.error('Error in send email:', er));
  }
}
