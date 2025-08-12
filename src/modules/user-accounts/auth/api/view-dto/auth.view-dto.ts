import { UserDto } from '../../../user/dto/user.dto';

export class AuthViewDto {
  userId: number;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView = (user: UserDto): AuthViewDto => {
    const dto = new AuthViewDto();
    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user.id;
    return dto;
  };
}
