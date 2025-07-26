export class EmailConfirmationDto {
  userId: number;
  confirmationCode: string;
  expiryDate: Date;
  isConfirmed: boolean;
}
