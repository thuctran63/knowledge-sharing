import type { ApiErrorCode } from "@/lib/api-error";

export class ServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: ApiErrorCode
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
