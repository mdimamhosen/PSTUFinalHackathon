import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AbuseDecision, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UseGuards } from "@nestjs/common";
import { decodeCursor } from "../common/pagination";
import { AdminService } from "./admin.service";

@ApiTags("Admin")
@Controller("admin")
@Auth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("users")
  users(
    @Query("q") q?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    return this.admin
      .listUsers(q, limit, decodeCursor(cursor))
      .then((data) => ({ success: true, data }));
  }

  @Post("users/:id/suspend")
  suspend(@Param("id") id: string) {
    return this.admin.suspend(id).then((data) => ({ success: true, data }));
  }

  @Post("users/:id/unsuspend")
  unsuspend(@Param("id") id: string) {
    return this.admin.unsuspend(id).then((data) => ({ success: true, data }));
  }

  @Get("transactions")
  transactions(@Query("cursor") cursor?: string, @Query("limit") limitRaw?: string) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    return this.admin
      .transactions(limit, decodeCursor(cursor))
      .then((data) => ({ success: true, data }));
  }

  @Get("audit-logs")
  auditLogs(@Query("cursor") cursor?: string, @Query("limit") limitRaw?: string) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    return this.admin
      .auditLogs(limit, decodeCursor(cursor))
      .then((data) => ({ success: true, data }));
  }

  @Get("reconciliation")
  reconciliation() {
    return this.admin.reconciliation().then((data) => ({ success: true, data }));
  }

  @Get("abuse")
  abuse(@Query("decision") decision?: AbuseDecision, @Query("limit") limitRaw?: string) {
    const limit = Math.min(Number(limitRaw ?? 20) || 20, 50);
    return this.admin.abuseQueue(decision, limit).then((data) => ({ success: true, data }));
  }

  @Post("users/:id/abuse-allow")
  abuseAllow(@Param("id") id: string) {
    return this.admin.abuseAllow(id).then((data) => ({ success: true, data }));
  }
}
