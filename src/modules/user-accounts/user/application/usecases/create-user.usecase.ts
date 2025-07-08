import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../../dto/create-user.dto';
import { User, UserModelType } from '../../domain/user.entity';
import { UserRepository } from '../../infrastructure/user.repository';
import { CryptoService } from '../../../adapters/crypto.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, string>
{
  constructor(
    @InjectModel(User.name)
    private userModel: UserModelType,
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}
  async execute({ dto }: CreateUserCommand): Promise<string> {
    const hashedPassword = await this.cryptoService.createPasswordHash(
      dto.password,
    );
    const user = this.userModel.createInstance(dto, hashedPassword);
    await this.userRepository.save(user);
    return user._id.toString();
  }
}
