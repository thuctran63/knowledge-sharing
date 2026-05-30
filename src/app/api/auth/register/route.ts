import { NextResponse } from "next/server";
import { handleRouteError, validationError } from "@/lib/api-error";
import { registerUserSchema } from "@/lib/validations/user";
import { registerUser } from "@/services/auth.service";

export async function POST(req: Request) {
  try {
    const body = registerUserSchema.safeParse(await req.json());
    if (!body.success) {
      return validationError(body.error);
    }

    const user = await registerUser(body.data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
