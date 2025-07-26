import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../../user/domain/user.entity';
import { AuthViewDto } from '../../api/view-dto/auth.view-dto';
import { Types } from 'mongoose';
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";

@Injectable()
export class AuthQueryRepository {
  constructor(
      @InjectDataSource()
      protected datasource: DataSource,
  ) {}
  async me(id: number) {
    const user = await this.datasource.query(`
    SELECT email, login, id as userId
    FROM "User" 
    WHERE id = $1`, [id])
    return user
  }
}
