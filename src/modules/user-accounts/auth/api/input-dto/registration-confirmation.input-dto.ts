import { IsString } from 'class-validator';

export class registrationConfirmationUser {
  @IsString()
  code: string;
}
