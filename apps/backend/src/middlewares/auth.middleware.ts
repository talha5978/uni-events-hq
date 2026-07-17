import type { FastifyRequest } from "fastify";
import { ApiError } from "~/utils/ApiError";
import { jwtService, type UserPayload } from "@uni-events-hq/auth";

function extractToken(authHeader?: string): string | null {
	if (!authHeader?.startsWith("Bearer ")) return null;
	return authHeader.substring(7);
}

export async function authMiddleware(request: FastifyRequest) {
	let token: string | null = request.cookies?.authToken || null;

	if (!token) {
		token = extractToken(request.headers.authorization);
	}

	// console.log("Cookies received:", request.cookies);
	// console.log("Auth Token from cookie:", token);

	if (!token) {
		throw new ApiError("Authentication required", 401, "NO_TOKEN");
	}

	try {
		request.user = jwtService.verifyToken(token);
	} catch (err: any) {
		if (err.name === "TokenExpiredError") {
			throw new ApiError("Token expired", 401, "TOKEN_EXPIRED");
		}
		throw new ApiError("Invalid token", 401, "INVALID_TOKEN");
	}
}

export function requireRole(allowedRoles: UserPayload["role"][]) {
	return async (request: FastifyRequest) => {
		const user = request.user as UserPayload | undefined;
		if (!user || !allowedRoles.includes(user.role)) {
			throw new ApiError("Insufficient permissions", 403, "FORBIDDEN");
		}
	};
}
