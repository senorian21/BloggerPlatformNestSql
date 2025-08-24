export class CreateUserDomainDto {
  login: string;
  password: string;
  email: string;
}

export class UpdateUserDomainDto extends CreateUserDomainDto {}
