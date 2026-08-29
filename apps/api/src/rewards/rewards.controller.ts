import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { RewardsService } from "./rewards.service";

@ApiTags("Rewards")
@Controller("rewards")
@Auth(UserRole.USER)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.rewards.list(user.id).then((data) => ({ success: true, data }));
  }
}
