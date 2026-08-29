import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class CreatePaymentLinkDto {
  @ApiPropertyOptional({ example: "250000" })
  @IsOptional()
  @Matches(/^[1-9]\d*$/)
  amountPaisa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
