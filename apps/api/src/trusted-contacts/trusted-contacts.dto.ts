import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class AddTrustedContactDto {
  @ApiProperty({ example: "karim" })
  @IsString()
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}
