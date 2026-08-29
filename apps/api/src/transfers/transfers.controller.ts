import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import { User, UserRole, UserStatus } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { IdempotencyKey } from "../common/idempotency.decorator";
import { ApiError, Codes } from "../common/errors";
import { decodeCursor, encodeCursor } from "../common/pagination";
import { TransferConfirmDto, TransferQuoteDto } from "./transfers.dto";
import { TransfersService } from "./transfers.service";

@ApiTags("Transfers")
@Controller("transfers")
@Auth(UserRole.USER)
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Post("quote")
  quote(@CurrentUser() user: User, @Body() body: TransferQuoteDto) {
    this.assertActive(user);
    return this.transfers.quote(user.id, body).then((data) => ({ success: true, data }));
  }

  @Post()
  @ApiHeader({ name: "Idempotency-Key", required: true })
  confirm(
    @CurrentUser() user: User,
    @Body() body: TransferConfirmDto,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    this.assertActive(user);
    return this.transfers
      .confirm(user.id, body, idempotencyKey)
      .then((data) => ({ success: true, data }));
  }

  @Get()
  list(
    @CurrentUser() user: User,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    const decoded = decodeCursor(cursor);
    return this.transfers
      .listForUser(user.id, limit, decoded)
      .then((data) => ({ success: true, data }));
  }

  @Get(":id")
  receipt(@CurrentUser() user: User, @Param("id") id: string) {
    return this.transfers.receipt(user.id, id).then((data) => ({ success: true, data }));
  }

  private assertActive(user: User) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "Account must be active to move money");
    }
  }
}
