import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { AuthRepository } from '../../../auth/infrastructure/auth.repository';

export class DeleteDeviceByIdCommand {
  constructor(
    public userId: number,
    public deviceId: string,
  ) {}
}

@CommandHandler(DeleteDeviceByIdCommand)
export class DeleteDeviceByIdUseCase
  implements ICommandHandler<DeleteDeviceByIdCommand, void>
{
  constructor(private authRepository: AuthRepository) {}
  async execute({ userId, deviceId }: DeleteDeviceByIdCommand): Promise<void> {
    const foundSession = await this.authRepository.findSession({
      deviceId: deviceId,
    });
    console.log(deviceId);
    if (!foundSession || foundSession.deletedAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Session not found',
      });
    }

    if (foundSession.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User not found',
      });
    }

    await this.authRepository.deleteSession(foundSession.id);
  }
}
