import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UseGuards } from "@nestjs/common";
import { decodeCursor } from "../common/pagination";
import { CreatePaymentLinkDto } from "./payment-links.dto";
import { PaymentLinksService } from "./payment-links.service";

@ApiTags("PaymentLinks")
@Controller("payment-links")
@Auth()
@UseGuards(RolesGuard)
@Roles(UserRole.USER)
export class PaymentLinksController {
  constructor(private readonly links: PaymentLinksService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() body: CreatePaymentLinkDto) {
    return this.links.create(user.id, body).then((data) => ({ success: true, data }));
  }

  @Get()
  list(
    @CurrentUser() user: User,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    return this.links
      .list(user.id, limit, decodeCursor(cursor))
      .then((data) => ({ success: true, data }));
  }

  @Post(":publicToken/revoke")
  revoke(@CurrentUser() user: User, @Param("publicToken") publicToken: string) {
    return this.links.revoke(user.id, publicToken).then((data) => ({ success: true, data }));
  }
}
