import { IsOptional, IsString } from "class-validator"

export class GoogleLoginDto {
  @IsString()
  idToken!: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  riskPreference?: string
}
