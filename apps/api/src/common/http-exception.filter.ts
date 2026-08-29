import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { ApiError } from "./errors";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof ApiError) {
      return res.status(exception.status).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.rule ? { rule: exception.rule } : {}),
        },
      });
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);
      const text = Array.isArray(message) ? message.join(", ") : message;
      const code = status === 429 ? "RATE_LIMITED" : status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "INVALID_AMOUNT";
      return res.status(status).json({
        success: false,
        error: { code, message: text },
      });
    }
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: "SERVICE_UNAVAILABLE", message: "Unexpected error" },
    });
  }
}
