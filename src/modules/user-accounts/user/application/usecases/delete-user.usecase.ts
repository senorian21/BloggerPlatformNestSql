import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../domain/user.entity';
import { UserRepository } from '../../infrastructure/user.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase
  implements ICommandHandler<DeleteUserCommand, void>
{
  constructor(private userRepository: UserRepository) {}
  async execute({ userId }: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.deletedAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `User with id ${userId} not found.`,
      });
    }
    user.softDeleteUser();
    await this.userRepository.save(user);
  }
}
