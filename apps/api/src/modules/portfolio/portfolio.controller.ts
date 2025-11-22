import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { IsIn, IsNumber, IsString, Min } from "class-validator"
import type { LegalDocSlug } from "@globalwealth/content"
import { PortfolioService } from "./portfolio.service"

class AllocationDto {
  @IsIn(["protected", "growth"], { message: "target must be protected or growth" })
  target!: "protected" | "growth"

  @IsNumber()
  @Min(10)
  amount!: number
}

@Controller("portfolio")
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  @Get()
  getSnapshot() {
    return this.service.getSnapshot()
  }

  @Get("boosts")
  getBoosts() {
    return this.service.getBoosts()
  }

  @Post("allocate")
  allocate(@Body() dto: AllocationDto) {
    return this.service.recordAllocation(dto.amount, dto.target)
  }

  @Get("legal/:slug")
  getLegal(@Param("slug") slug: LegalDocSlug, @Query("locale") locale?: string) {
    return this.service.fetchLegalDoc(slug, locale)
  }
}

