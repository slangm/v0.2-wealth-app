import { IsOptional, IsString, MaxLength } from "class-validator"

export class ChatDto {
  @IsString()
  @MaxLength(4000)
  message!: string

  @IsOptional()
  @IsString()
  targetBucket?: "safe" | "growth" | "cash"
}
