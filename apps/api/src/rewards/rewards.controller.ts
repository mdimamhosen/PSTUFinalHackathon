import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UseGuards } from "@nestjs/common";
import { RewardsService } from "./rewards.service";

@ApiTags("Rewards")
@Controller("rewards")
@Auth()
@UseGuards(RolesGuard)
@Roles(UserRole.USER)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.rewards.list(user.id).then((data) => ({ success: true, data }));
  }
}
