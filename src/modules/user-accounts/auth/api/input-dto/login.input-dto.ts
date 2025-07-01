import { IsString, MinLength } from 'class-validator';
import {
  loginConstraints,
  passwordConstraints,
} from '../../../user/domain/user.entity';

export class loginInputDto {
  @IsString()
  @MinLength(loginConstraints.minLength)
  loginOrEmail: string;
  @IsString()
  @MinLength(passwordConstraints.minLength)
  password: string;
}
