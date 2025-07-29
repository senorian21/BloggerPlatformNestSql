export class UserDto {
    id: number;
    deletedAt: Date;
    login: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}