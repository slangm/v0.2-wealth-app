import { Body, Controller, Get, Post } from "@nestjs/common"
import { IsNotEmpty, IsNumber, Min } from "class-validator"

import { PaymentsService } from "./payments.service"

class DepositDto {
  @IsNotEmpty()
  optionId!: string

  @IsNumber()
  @Min(10)
  amount!: number
}

@Controller("payments")
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get("options")
  listOptions() {
    return this.service.getFundingOptions()
  }

  @Post("deposits")
  initDeposit(@Body() dto: DepositDto) {
    return this.service.createDeposit(dto.optionId, dto.amount)
  }
}

