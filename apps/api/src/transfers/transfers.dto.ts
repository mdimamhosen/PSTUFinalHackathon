import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class RecipientFieldsDto {
  @ApiPropertyOptional({ example: "karim" })
  @IsOptional()
  @IsString()
  toUsername?: string;

  @ApiPropertyOptional({ example: "karim@example.com" })
  @IsOptional()
  @IsString()
  toEmail?: string;

  @ApiPropertyOptional({ example: "01712345678" })
  @IsOptional()
  @IsString()
  toPhone?: string;

  @ApiPropertyOptional({ example: "RLY-ABCD-1234" })
  @IsOptional()
  @IsString()
  toAccountNumber?: string;

  @ApiPropertyOptional({ example: "pl_abc123" })
  @IsOptional()
  @IsString()
  paymentLinkToken?: string;
}

export class TransferQuoteDto extends RecipientFieldsDto {
  @ApiPropertyOptional({ example: "250000", description: "Amount in paisa as string" })
  @IsOptional()
  @Matches(/^[1-9]\d*$|^0$/)
  amountPaisa?: string;
}

export class TransferConfirmDto extends RecipientFieldsDto {
  @ApiProperty({ example: "250000" })
  @Matches(/^[1-9]\d*$/)
  amountPaisa!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
