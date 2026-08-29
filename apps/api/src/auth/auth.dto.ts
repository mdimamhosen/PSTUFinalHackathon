import { IsEmail, IsString, MinLength, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ example: "rahim" })
  @IsString()
  username!: string;

  @ApiProperty({ example: "rahim@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "01712345678" })
  @Matches(/^01\d{9}$/)
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty()
  @IsString()
  emailOrUsername!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class OtpDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  @MinLength(6)
  code!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
