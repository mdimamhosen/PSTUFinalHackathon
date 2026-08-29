import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { User, UserRole, UserStatus } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { IdempotencyKey } from "../common/idempotency.decorator";
import { ApiError, Codes } from "../common/errors";
import { decodeCursor } from "../common/pagination";
import { CreateSplitBillDto } from "./split-bills.dto";
import { SplitBillsService } from "./split-bills.service";

@ApiTags("SplitBills")
@Controller("split-bills")
@Auth(UserRole.USER)
export class SplitBillsController {
  constructor(private readonly splits: SplitBillsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() body: CreateSplitBillDto) {
    this.assertActive(user);
    return this.splits.create(user.id, body).then((data) => ({ success: true, data }));
  }

  @Get()
  list(
    @CurrentUser() user: User,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    return this.splits
      .list(user.id, limit, decodeCursor(cursor))
      .then((data) => ({ success: true, data }));
  }

  @Get(":id")
  get(@CurrentUser() user: User, @Param("id") id: string) {
    return this.splits.get(user.id, id).then((data) => ({ success: true, data }));
  }

  @Post(":id/shares/:shareId/pay")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  pay(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("shareId") shareId: string,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    this.assertActive(user);
    return this.splits
      .payShare(user.id, id, shareId, idempotencyKey)
      .then((data) => ({ success: true, data }));
  }

  @Post(":id/shares/:shareId/decline")
  decline(@CurrentUser() user: User, @Param("id") id: string, @Param("shareId") shareId: string) {
    return this.splits.declineShare(user.id, id, shareId).then((data) => ({ success: true, data }));
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: User, @Param("id") id: string) {
    return this.splits.cancel(user.id, id).then((data) => ({ success: true, data }));
  }

  private assertActive(user: User) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "Account must be active");
    }
  }
}
