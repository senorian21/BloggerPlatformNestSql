import { UserDto } from '../../dto/user.dto';

export class UserViewDto {
  id: number;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView = (user: UserDto): UserViewDto => {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    return dto;
  };
}
