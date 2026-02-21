import { IsNotEmpty, Length, min, MinLength } from 'class-validator';

export class UserChangePasswordDto {
  @IsNotEmpty()
  @MinLength(6)
  oldPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  confirmNewPassword: string;
}