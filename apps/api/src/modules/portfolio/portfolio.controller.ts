import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common"
import { IsIn, IsNumber, IsString, Min } from "class-validator"
import type { LegalDocSlug } from "@globalwealth/content"
import { PortfolioService } from "./portfolio.service"
import { JwtAuthGuard } from "../auth/jwt.guard"
import { UseGuards } from "@nestjs/common"
import { CurrentUser } from "../auth/current-user.decorator"
import type { User } from "../users/user.entity"
import { IsOptional } from "class-validator"
import { Max } from "class-validator"
import { Min as MinDecorator } from "class-validator"
import { IsUUID } from "class-validator"
import { SafeAllocationService } from "./safe-allocation.service"
import { BadRequestException } from "@nestjs/common"
import { BeefyService } from "./beefy.service"
import { ComplianceService } from "../compliance/compliance.service"

class AllocationDto {
  @IsIn(["protected", "growth"], { message: "target must be protected or growth" })
  target!: "protected" | "growth"

  @IsNumber()
  @Min(10)
  amount!: number
}

class SetupDto {
  @IsNumber()
  @MinDecorator(0.01)
  @Max(1)
  safePct!: number

  @IsNumber()
  @MinDecorator(0.01)
  @Max(1)
  growthPct!: number
}

class ConfirmBridgeDto {
  @IsUUID()
  jobId!: string
}

class SafeDepositDto {
  @IsNumber()
  @MinDecorator(1)
  amount!: number
}

class BeefyDepositDto {
  @IsString()
  vaultId!: string

  @IsNumber()
  @MinDecorator(1)
  amount!: number
}

@Controller("portfolio")
export class PortfolioController {
  constructor(
    private readonly service: PortfolioService,
    private readonly safeAllocation: SafeAllocationService,
    private readonly beefy: BeefyService,
    private readonly compliance: ComplianceService,
  ) {}

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

  @Post("setup")
  @UseGuards(JwtAuthGuard)
  setup(@CurrentUser() user: User, @Body() dto: SetupDto) {
    const targets = this.service.setTargets(user.id, dto.safePct, dto.growthPct)
    const job = this.service.createDeploymentJob(user.id, dto.safePct, dto.growthPct)
    return { targets, job }
  }

  @Get("jobs")
  @UseGuards(JwtAuthGuard)
  listJobs(@CurrentUser() user: User) {
    return this.service.listJobsForUser(user.id)
  }

  @Get("jobs/:id")
  @UseGuards(JwtAuthGuard)
  getJob(@CurrentUser() user: User, @Param("id") id: string) {
    const job = this.service.getJob(id)
    if (!job || job.userId !== user.id) {
      return null
    }
    return job
  }

  @Post("jobs/bridge/confirm")
  @UseGuards(JwtAuthGuard)
  confirmBridge(@CurrentUser() user: User, @Body() dto: ConfirmBridgeDto) {
    const job = this.service.getJob(dto.jobId)
    if (!job || job.userId !== user.id) return { error: "not found" }
    job.status = "POLYGON_READY"
    job.updatedAt = new Date().toISOString()
    job.logs.unshift(`${new Date().toISOString()} BRIDGE_CONFIRMED: user reported funds on Polygon Growth wallet`)
    this.service["jobs"].set(job.id, job)
    return job
  }

  @Post("safe/deposit")
  @UseGuards(JwtAuthGuard)
  async depositSafe(@CurrentUser() user: User, @Body() dto: SafeDepositDto) {
    try {
      const result = await this.safeAllocation.allocateSafe(user, dto.amount)
      return result
    } catch (error) {
      throw new BadRequestException((error as Error).message)
    }
  }

  @Get("beefy/vaults")
  async beefyVaults() {
    return this.beefy.listWhitelisted()
  }

  @Post("beefy/deposit")
  @UseGuards(JwtAuthGuard)
  async beefyDeposit(@CurrentUser() user: User, @Body() dto: BeefyDepositDto) {
    if (!this.compliance.canExecuteTrades(user)) {
      throw new BadRequestException("Region not allowed")
    }
    this.beefy.assertWhitelisted(dto.vaultId)
    if (dto.amount > 500) {
      throw new BadRequestException("Exceeds per-deposit limit (500)")
    }
    // Mock execution; replace with real deposit when wiring onchain
    return {
      vaultId: dto.vaultId,
      amount: dto.amount,
      status: "queued",
      txHash: `0xmock_${Date.now()}`,
      note: "Mock deposit executed (no onchain tx).",
    }
  }
}
