import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserDecorator = createParamDecorator(async (_, ctx: ExecutionContext) => {
  const request = await ctx.switchToHttp().getRequest();
  return request.user;
});