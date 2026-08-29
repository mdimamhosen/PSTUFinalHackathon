import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { User, UserRole } from "@prisma/client";
import { ApiError, Codes } from "../common/errors";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest<{ user?: User }>().user;
    if (!user) {
      throw new ApiError(Codes.UNAUTHORIZED, "Unauthorized", 401);
    }
    if (!roles.includes(user.role)) {
      throw new ApiError(Codes.FORBIDDEN, "Forbidden", 403);
    }
    return true;
  }
}
