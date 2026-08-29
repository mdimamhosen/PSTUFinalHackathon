import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { countIdentifiers, publicUser, resolveRecipient } from "../common/identifiers";
import { paisaToString } from "../common/money";

@ApiTags("PaymentLinks")
@Controller("pay")
@Auth(UserRole.USER)
export class PayResolveController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("resolve")
  async resolve(
    @Query("accountNumber") accountNumber?: string,
    @Query("username") username?: string,
    @Query("paymentLinkToken") paymentLinkToken?: string,
  ) {
    const body = { toAccountNumber: accountNumber, toUsername: username, paymentLinkToken };
    if (countIdentifiers(body) !== 1) {
      throw new ApiError(Codes.INVALID_RECIPIENT, "Provide exactly one resolve field");
    }
    const { user, paymentLink } = await resolveRecipient(this.prisma, body);
    return {
      success: true,
      data: {
        recipient: publicUser(user),
        amountLocked: paymentLink?.amountPaisa != null,
        amountPaisa: paymentLink?.amountPaisa ? paisaToString(paymentLink.amountPaisa) : null,
        paymentLinkToken: paymentLink?.publicToken ?? null,
      },
    };
  }
}
