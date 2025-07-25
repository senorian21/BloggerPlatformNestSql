import { UserRepository } from '../../infrastructure/user.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteUserCommand {
  constructor(public userId: number) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase
  implements ICommandHandler<DeleteUserCommand, void>
{
  constructor(private userRepository: UserRepository) {}
  async execute({ userId }: DeleteUserCommand): Promise<void> {
    await this.userRepository.findById(userId);
    await this.userRepository.softDeleteUser(userId);
  }
}
