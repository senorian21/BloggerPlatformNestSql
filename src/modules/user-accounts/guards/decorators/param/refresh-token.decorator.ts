import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RefreshTokenContextDto } from '../../../auth/dto/refreshToken.dto';

export const RefreshTokenFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): RefreshTokenContextDto => {
    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new Error('there is no user in the request object!');
    }

    return user;
  },
);
