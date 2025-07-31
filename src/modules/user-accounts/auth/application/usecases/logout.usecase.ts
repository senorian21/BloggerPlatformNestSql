import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { AuthRepository } from '../../infrastructure/auth.repository';

export class LogoutCommand {
  constructor(
    public userId: number,
    public deviceId: string,
  ) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand, void> {
  constructor(private authRepository: AuthRepository) {}

  async execute({ userId, deviceId }: LogoutCommand): Promise<void> {
    const sessionExists = await this.authRepository.findSession({
      userId,
      deviceId,
    });
    if (!sessionExists || !sessionExists.id) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    await this.authRepository.deleteSession(sessionExists.id);
  }
}
