import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    UseGuards(AuthGuard("jwt"), ...(roles.length ? [RolesGuard] : [])),
    ...(roles.length ? [Roles(...roles)] : []),
    ApiBearerAuth(),
  );
}
