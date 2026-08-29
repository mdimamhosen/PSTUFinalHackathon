import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiError, Codes } from "./errors";

export const IdempotencyKey = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
  const key = req.headers["idempotency-key"]?.trim();
  if (!key) {
    throw new ApiError(Codes.IDEMPOTENCY_KEY_REQUIRED, "Idempotency-Key header is required", 400);
  }
  return key;
});
