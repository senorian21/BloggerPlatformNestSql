import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { UserDto } from '../../dto/user.dto';

@Injectable()
export class UsersExternalQueryRepository {
  constructor(
    private userRepository: UserRepository,
  ) {}

  async getByIdOrNotFoundFail(id: number): Promise<UserDto> {
    return await this.userRepository.findById(id);
  }
}
