import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { User, UserRole, UserStatus } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UseGuards } from "@nestjs/common";
import { IdempotencyKey } from "../common/idempotency.decorator";
import { ApiError, Codes } from "../common/errors";
import { decodeCursor } from "../common/pagination";
import { CreateMoneyRequestDto } from "./money-requests.dto";
import { MoneyRequestsService } from "./money-requests.service";

@ApiTags("MoneyRequests")
@Controller("money-requests")
@Auth()
@UseGuards(RolesGuard)
@Roles(UserRole.USER)
export class MoneyRequestsController {
  constructor(private readonly requests: MoneyRequestsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() body: CreateMoneyRequestDto) {
    this.assertActive(user);
    return this.requests.create(user.id, body).then((data) => ({ success: true, data }));
  }

  @Get()
  list(
    @CurrentUser() user: User,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    return this.requests
      .list(user.id, limit, decodeCursor(cursor))
      .then((data) => ({ success: true, data }));
  }

  @Post(":id/pay")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  pay(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    this.assertActive(user);
    return this.requests.pay(user.id, id, idempotencyKey).then((data) => ({ success: true, data }));
  }

  @Post(":id/decline")
  decline(@CurrentUser() user: User, @Param("id") id: string) {
    return this.requests.decline(user.id, id).then((data) => ({ success: true, data }));
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: User, @Param("id") id: string) {
    return this.requests.cancel(user.id, id).then((data) => ({ success: true, data }));
  }

  private assertActive(user: User) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "Account must be active");
    }
  }
}
