import { IsString } from 'class-validator';

export class loginInputDto {
  @IsString()
  loginOrEmail: string;
  @IsString()
  password: string;
}
