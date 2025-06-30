import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { UserRepository } from '../infrastructure/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import bcrypt from 'bcrypt';
import { CryptoService } from '../../adapters/crypto.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: UserModelType,
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}
  async createUser(dto: CreateUserDto) {
    const hashedPassword = await this.cryptoService.createPasswordHash(
      dto.password,
    );
    const user = this.userModel.createInstance(dto, hashedPassword);
    await this.userRepository.save(user);
    return user._id.toString();
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    user.softDeleteUser();
    await this.userRepository.save(user);
  }
}
