import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { decodeCursor, encodeCursor } from "../common/pagination";
import { ApiError, Codes } from "../common/errors";

@ApiTags("Notifications")
@Controller("notifications")
@Auth()
@UseGuards(RolesGuard)
@Roles(UserRole.USER)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: User,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    const decoded = decodeCursor(cursor);
    const rows = await this.prisma.notification.findMany({
      where: {
        userId: user.id,
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
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      success: true,
      data: {
        items: items.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          href: n.href,
          readAt: n.readAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
        })),
        nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
      },
    };
  }

  @Post(":id/read")
  async read(@CurrentUser() user: User, @Param("id") id: string) {
    const row = await this.prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!row) throw new ApiError(Codes.USER_NOT_FOUND, "Notification not found", 404);
    await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return { success: true, data: { ok: true } };
  }
}
