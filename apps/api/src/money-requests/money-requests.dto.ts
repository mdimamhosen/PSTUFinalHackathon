import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class CreateMoneyRequestDto {
  @ApiProperty({ example: "karim" })
  @IsString()
  toUsername!: string;

  @ApiProperty({ example: "500000" })
  @Matches(/^[1-9]\d*$/)
  amountPaisa!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
