import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import type { User } from "../users/user.entity"

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User | null => {
  const request = ctx.switchToHttp().getRequest()
  return request.user ?? null
})
