import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ServiceError } from "@/lib/service-error";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function apiError(
  message: string,
  status: number,
  code?: ApiErrorCode,
  details?: unknown
) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export function validationError(error: ZodError) {
  return apiError(
    "Validation failed",
    400,
    "VALIDATION_ERROR",
    error.flatten()
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) return validationError(error);
  if (error instanceof ServiceError) {
    return apiError(error.message, error.status, error.code);
  }
  return apiError("Internal server error", 500, "INTERNAL_ERROR");
}
