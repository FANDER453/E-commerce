import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class UserUpdateNameDto {
  @IsOptional()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}