import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";
import { publicUser } from "../common/identifiers";

@ApiTags("Users")
@Controller("users")
@Auth(UserRole.USER)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("search")
  async search(@Query("q") q?: string) {
    const term = (q ?? "").trim().replace(/^@/, "").toLowerCase();
    if (!term) return { success: true, data: { items: [] } };
    const phone = term.replace(/\D/g, "");
    const rows = await this.prisma.user.findMany({
      where: {
        role: UserRole.USER,
        OR: [
          { normalizedUsername: { contains: term } },
          { email: { contains: term } },
          ...(phone.length >= 3 ? [{ phone: { contains: phone } }] : []),
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: { items: rows.map((u) => publicUser(u)) } };
  }
}
