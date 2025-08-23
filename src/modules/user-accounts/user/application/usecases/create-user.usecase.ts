import { CreateUserDto } from '../../dto/create-user.dto';
import { UserRepository } from '../../infrastructure/user.repository';
import { CryptoService } from '../../../adapters/crypto.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { User } from '../../domain/user.entity';

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, number>
{
  constructor(
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
    @InjectDataSource() protected datasource: DataSource,
  ) {}
  async execute({ dto }: CreateUserCommand): Promise<number> {
    const user = await this.userRepository.doesExistByLoginOrEmail(
      dto.login,
      dto.email,
    );
    if (user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User already exists',
      });
    }
    const hashedPassword = await this.cryptoService.createPasswordHash(
      dto.password,
    );
    const newUser = User.create(dto, hashedPassword);
    await this.userRepository.save(newUser);
    return newUser.id;
  }
}
