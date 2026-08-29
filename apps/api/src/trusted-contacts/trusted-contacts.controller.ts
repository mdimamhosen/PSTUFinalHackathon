import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User, UserRole } from "@prisma/client";
import { Auth } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AddTrustedContactDto } from "./trusted-contacts.dto";
import { TrustedContactsService } from "./trusted-contacts.service";

@ApiTags("TrustedContacts")
@Controller("trusted-contacts")
@Auth(UserRole.USER)
export class TrustedContactsController {
  constructor(private readonly trusted: TrustedContactsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.trusted.list(user.id).then((data) => ({ success: true, data }));
  }

  @Post()
  add(@CurrentUser() user: User, @Body() body: AddTrustedContactDto) {
    return this.trusted.add(user.id, body).then((data) => ({ success: true, data }));
  }

  @Delete(":id")
  remove(@CurrentUser() user: User, @Param("id") id: string) {
    return this.trusted.remove(user.id, id).then((data) => ({ success: true, data }));
  }
}
