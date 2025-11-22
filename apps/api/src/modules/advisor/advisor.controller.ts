import { Body, Controller, Get, Post } from "@nestjs/common"
import { IsNumber, IsString, Min } from "class-validator"
import { AdvisorService } from "./advisor.service"

class PromptDto {
  @IsString()
  prompt!: string

  @IsNumber()
  @Min(0)
  totalNetWorth!: number

  @IsNumber()
  @Min(1)
  monthlyExpenses!: number
}

@Controller("advisor")
export class AdvisorController {
  constructor(private readonly service: AdvisorService) {}

  @Get("history")
  history() {
    return this.service.listHistory()
  }

  @Post()
  async respond(@Body() dto: PromptDto) {
    return this.service.answer(dto.prompt, dto.totalNetWorth, dto.monthlyExpenses)
  }
}

