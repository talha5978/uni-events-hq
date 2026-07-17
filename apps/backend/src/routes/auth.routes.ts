import { users } from "@uni-events-hq/db";
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword, jwtService } from "@uni-events-hq/auth";
import { ApiError } from "~/utils/ApiError";
import { authMiddleware } from "~/middlewares/auth.middleware";
import { convertExpiresInToSeconds } from "~/utils/time";

export async function authRoutes(fastify: FastifyInstance) {
	fastify.get("/me", { preHandler: authMiddleware }, async (request, reply) => {
		return reply.success(
			{
				user: request.user,
			},
			"User retrieved successfully",
		);
	});

	fastify.post("/refresh-token", async (request: FastifyRequest, reply: FastifyReply) => {
		const refreshToken = request.cookies?.refreshToken;

		if (!refreshToken) {
			throw new ApiError("Refresh token required", 401, "NO_REFRESH_TOKEN");
		}

		try {
			const { id } = jwtService.verifyRefreshToken(refreshToken);

			const user = await fastify.db
				.select({
					id: users.id,
					name: users.fullName,
					email: users.email,
					role: users.role,
				})
				.from(users)
				.where(eq(users.id, id))
				.limit(1);

			if (user.length === 0) {
				throw new ApiError("User not found", 401, "USER_NOT_FOUND");
			}

			const newAccessToken = jwtService.generateToken({
				id: user[0].id,
				email: user[0].email,
				name: user[0].name,
				role: user[0].role,
			});

			const newRefreshToken = jwtService.generateRefreshToken(user[0].id);

			reply.setCookie("authToken", newAccessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: convertExpiresInToSeconds(process.env.JWT_EXPIRES_IN),
				path: "/",
			});

			reply.setCookie("refreshToken", newRefreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: 30 * 24 * 60 * 60,
				path: "/",
			});

			return reply.success(null, "Token refreshed successfully", 200);
		} catch (err) {
			reply.clearCookie("authToken");
			reply.clearCookie("refreshToken");
			throw new ApiError("Session expired. Please login again", 401, "SESSION_EXPIRED");
		}
	});

	fastify.post(
		"/signout",
		{ preHandler: authMiddleware },
		async (_: FastifyRequest, reply: FastifyReply) => {
			reply.clearCookie("authToken", {
				path: "/",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
			});

			reply.clearCookie("refreshToken", {
				path: "/",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
			});

			return reply.success(null, "Logged out successfully");
		},
	);
}
