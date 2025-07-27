import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { AuthRepository } from '../../../auth/infrastructure/auth.repository';

export class DeleteAllDeviceExceptTheActiveOneCommand {
  constructor(
    public userId: number,
    public deviceId: string,
  ) {}
}

@CommandHandler(DeleteAllDeviceExceptTheActiveOneCommand)
export class DeleteAllDeviceUseCase
  implements ICommandHandler<DeleteAllDeviceExceptTheActiveOneCommand, void>
{
  constructor(private authRepository: AuthRepository) {}
  async execute({
    userId,
    deviceId,
  }: DeleteAllDeviceExceptTheActiveOneCommand): Promise<void> {
    const foundSession = await this.authRepository.findSession({
      deviceId: deviceId,
    });

    if (!foundSession || foundSession.deletedAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Session not found',
      });
    }

    await this.authRepository.deleteOtherDevices(userId, deviceId);
  }
}
