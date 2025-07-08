import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/auth-tokens.inject-constants';
import { loginInputDto } from '../../dto/login.input-dto';
import { AuthService } from '../service/auth.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class LoginUserCommand {
  constructor(public dto: loginInputDto) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements ICommandHandler<LoginUserCommand, { accessToken: string }>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private authService: AuthService,
  ) {}

  async execute({ dto }: LoginUserCommand): Promise<{ accessToken: string }> {
    const result = await this.authService.checkUserCredentials(
      dto.loginOrEmail,
      dto.password,
    );

    const userId = result._id.toString();

    const accessToken = this.accessTokenContext.sign({
      userId: userId,
    });

    return { accessToken };
  }
}
