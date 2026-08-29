import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { decodeCursor, encodeCursor } from "../common/pagination";
import { paisaToString } from "../common/money";

@ApiTags("Activity")
@Controller("activity")
@Auth()
@UseGuards(RolesGuard)
@Roles(UserRole.USER)
export class ActivityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: User,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    const decoded = decodeCursor(cursor);
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return { success: true, data: { items: [], nextCursor: null } };
    const rows = await this.prisma.ledgerEntry.findMany({
      where: {
        walletId: wallet.id,
        ...(decoded
          ? {
              OR: [
                { createdAt: { lt: decoded.createdAt } },
                { createdAt: decoded.createdAt, id: { lt: decoded.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: { transaction: true },
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      success: true,
      data: {
        items: items.map((row) => ({
          id: row.id,
          type: row.type,
          direction: row.direction,
          amountPaisa: paisaToString(row.amountPaisa),
          balanceAfterPaisa: paisaToString(row.balanceAfterPaisa),
          reference: row.transaction?.reference ?? null,
          createdAt: row.createdAt.toISOString(),
        })),
        nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
      },
    };
  }
}
