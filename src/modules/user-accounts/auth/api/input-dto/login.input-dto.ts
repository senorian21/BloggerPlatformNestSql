import { IsString, Length } from 'class-validator';

export class loginInputDto {
  @IsString()
  @Length(3, 20)
  loginOrEmail: string;
  @IsString()
  @Length(6, 20)
  password: string;
}
