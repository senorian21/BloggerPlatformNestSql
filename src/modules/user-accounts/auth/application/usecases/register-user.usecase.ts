import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UserRepository } from '../../../user/infrastructure/user.repository';
import { NodemailerService } from '../../../adapters/nodemeiler/nodemeiler.service';
import { EmailService } from '../../../adapters/nodemeiler/ template/email-examples';
import { registrationInputDto } from '../../dto/registration.input-dto';
import { CreateUserCommand } from '../../../user/application/usecases/create-user.usecase';

export class RegisterUserCommand {
  constructor(public dto: registrationInputDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand, void>
{
  constructor(
    private userRepository: UserRepository,
    private nodemailerService: NodemailerService,
    private emailService: EmailService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: RegisterUserCommand): Promise<void> {
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

    const newUserId = await this.commandBus.execute<CreateUserCommand, string>(
      new CreateUserCommand(dto),
    );

    const newUser = await this.userRepository.findById(newUserId);

    this.nodemailerService
      .sendEmail(
        newUser.email,
        newUser.emailConfirmation.confirmationCode,
        this.emailService.registrationEmail.bind(this.emailService),
      )
      .catch((er) => console.error('error in send email:', er));
  }
}
