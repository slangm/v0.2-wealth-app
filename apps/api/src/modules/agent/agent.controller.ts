import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt.guard"
import { CurrentUser } from "../auth/current-user.decorator"
import type { User } from "../users/user.entity"
import { AgentService } from "./agent.service"
import { ChatDto } from "./dto/chat.dto"
import { AuditService } from "../audit/audit.service"

@Controller("agent")
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly audit: AuditService,
  ) {}

  @Post("chat")
  async chat(@CurrentUser() user: User, @Body() dto: ChatDto) {
    return this.agentService.chat(user, dto.message)
  }

  @Get("logs")
  async logs() {
    return this.audit.listRecent()
  }
}
