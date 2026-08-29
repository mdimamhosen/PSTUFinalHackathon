import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { paisaToString } from "../common/money";

@ApiTags("Wallet")
@Controller("wallet")
@Auth(UserRole.USER)
export class WalletController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(@CurrentUser() user: User) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) throw new ApiError(Codes.USER_NOT_FOUND, "Wallet not found", 404);
    return {
      success: true,
      data: {
        balancePaisa: paisaToString(wallet.balancePaisa),
        currency: wallet.currency,
        status: wallet.status,
      },
    };
  }
}
