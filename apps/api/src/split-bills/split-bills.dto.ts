import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { RecipientFieldsDto } from "../transfers/transfers.dto";

export class SplitShareDto extends RecipientFieldsDto {
  @ApiProperty({ example: "400000" })
  @Matches(/^[1-9]\d*$/)
  amountPaisa!: string;
}

export class CreateSplitBillDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ example: "1200000" })
  @Matches(/^[1-9]\d*$/)
  totalAmountPaisa!: string;

  @ApiProperty({ type: [SplitShareDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitShareDto)
  shares!: SplitShareDto[];
}
