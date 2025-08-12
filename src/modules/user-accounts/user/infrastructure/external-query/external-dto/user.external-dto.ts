import {UserDto} from "../../../dto/user.dto";


export class UserExternalDto {
  id: number;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView = (user: UserDto): UserExternalDto => {
    const dto = new UserExternalDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    return dto;
  };
}
