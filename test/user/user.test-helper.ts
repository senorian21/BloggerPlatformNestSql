import { INestApplication, HttpStatus } from '@nestjs/common';
import request, { Response } from 'supertest';
import { CreateUserDto } from '../../src/modules/user-accounts/user/dto/create-user.dto';

export class UsersTestHelper {
  constructor(private app: INestApplication) {}

  async createUser(userData: CreateUserDto): Promise<Response> {
    const response = await request(this.app.getHttpServer())
      .post('/api/sa/users')
      .auth('admin', 'qwerty')
      .send(userData)
      .expect(HttpStatus.CREATED);

    return response;
  }

  async deleteUser(userId: string): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/api/sa/users/${userId}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NO_CONTENT);
  }
}
