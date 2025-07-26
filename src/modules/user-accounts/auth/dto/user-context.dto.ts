import { Types } from 'mongoose';

export class UserContextDto {
  id: number;
}

export type Nullable<T> = { [P in keyof T]: T[P] | null };
