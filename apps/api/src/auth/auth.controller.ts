import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { ChangePasswordDto, LoginDto, OtpDto, RegisterDto } from "./auth.dto";
import { Auth } from "./auth.decorators";
import { CurrentUser } from "./current-user.decorator";
import { User } from "@prisma/client";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto, @Req() req: Request) {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip;
    return this.auth.register({ ...body, ip }).then((data) => ({ success: true, data }));
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body.emailOrUsername, body.password).then((data) => ({
      success: true,
      data,
    }));
  }

  @Auth()
  @Get("me")
  me(@CurrentUser() user: User) {
    return this.auth.me(user.id).then((data) => ({ success: true, data }));
  }

  @Auth()
  @Post("verify-email")
  verifyEmail(@CurrentUser() user: User, @Body() body: OtpDto) {
    return this.auth.verifyEmail(user.id, body.code).then((data) => ({ success: true, data }));
  }

  @Auth()
  @Post("verify-phone")
  verifyPhone(@CurrentUser() user: User, @Body() body: OtpDto) {
    return this.auth.verifyPhone(user.id, body.code).then((data) => ({ success: true, data }));
  }

  @Auth()
  @Post("resend-otp")
  resend(@CurrentUser() user: User) {
    return this.auth.resendOtp(user.id).then((data) => ({ success: true, data }));
  }

  @Auth()
  @Post("change-password")
  changePassword(@CurrentUser() user: User, @Body() body: ChangePasswordDto) {
    return this.auth
      .changePassword(user.id, body.currentPassword, body.newPassword)
      .then((data) => ({ success: true, data }));
  }
}
