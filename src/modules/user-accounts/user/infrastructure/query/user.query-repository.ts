import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { GetUserQueryParams } from '../../api/input-dto/get-user-query-params.input-dto';
import { plainToClass } from 'class-transformer';
import { FilterQuery } from 'mongoose';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}
  async getAll(query: GetUserQueryParams) {
    const queryParams = plainToClass(GetUserQueryParams, query);

    const filter: FilterQuery<User> = {
      deletedAt: null,
    };

    const orConditions: FilterQuery<User>[] = [];

    if (queryParams.searchEmailTerm) {
      orConditions.push({
        email: { $regex: queryParams.searchEmailTerm, $options: 'i' },
      });
    }

    if (queryParams.searchLoginTerm) {
      orConditions.push({
        login: { $regex: queryParams.searchLoginTerm, $options: 'i' },
      });
    }

    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }

    const user = await this.UserModel.find(filter)
      .sort({ [queryParams.sortBy]: queryParams.sortDirection })
      .skip(queryParams.calculateSkip())
      .limit(queryParams.pageSize);

    const totalCount = await this.UserModel.countDocuments(filter);

    const items = user.map(UserViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: queryParams.pageNumber,
      size: queryParams.pageSize,
    });
  }
  async getByIdOrNotFoundFail(id: string) {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!user) {
      throw new NotFoundException('Post not found.');
    }
    return UserViewDto.mapToView(user);
  }
}
