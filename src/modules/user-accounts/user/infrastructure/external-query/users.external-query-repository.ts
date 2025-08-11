import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UserExternalDto } from './external-dto/user.external-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UserRepository } from '../user.repository';
import { UserDto } from '../../dto/user.dto';

@Injectable()
export class UsersExternalQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,

    private userRepository: UserRepository,
  ) {}

  async getByIdOrNotFoundFailViewModel(id: string): Promise<UserExternalDto> {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return UserExternalDto.mapToView(user);
  }
  async getByIdOrNotFoundFail(id: number): Promise<UserDto> {
    return await this.userRepository.findById(id);
  }
}
