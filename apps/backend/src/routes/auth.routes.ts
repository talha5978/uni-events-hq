import { users, societyMembers, type UserRole } from "@uni-events-hq/db";
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { eq, and } from "drizzle-orm";
import { comparePassword, jwtService } from "@uni-events-hq/auth";
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

			const userData = await fastify.db
				.select({
					id: users.id,
					name: users.fullName,
					email: users.email,
					role: users.role,
					societyRole: societyMembers.role,
				})
				.from(users)
				.leftJoin(societyMembers, and(eq(societyMembers.userId, users.id)))
				.where(eq(users.id, id))
				.limit(1);

			if (userData.length === 0) {
				throw new ApiError("User not found", 401, "USER_NOT_FOUND");
			}

			const user = userData[0];

			let finalRole: UserRole;

			if (user.role === "society_head" && user.societyRole) {
				finalRole = user.societyRole; // president | treasurer | member etc.
			} else {
				finalRole = user.role as UserRole; // admin | student
			}

			const newAccessToken = jwtService.generateToken({
				id: user.id,
				email: user.email,
				name: user.name,
				role: finalRole,
			});

			const newRefreshToken = jwtService.generateRefreshToken(user.id);

			// Set new cookies
			reply.setCookie("authToken", newAccessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: convertExpiresInToSeconds(process.env.JWT_EXPIRES_IN || "15m"),
				path: "/",
			});

			reply.setCookie("refreshToken", newRefreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: 30 * 24 * 60 * 60, // 30 days
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
		"/admin/signin",
		{
			schema: {
				body: {
					type: "object",
					required: ["email", "password"],
					properties: {
						email: { type: "string", format: "email" },
						password: { type: "string" },
					},
				},
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const body = request.body as {
				email: string;
				password: string;
			};

			// Find user
			const [user] = await fastify.db
				.select({
					id: users.id,
					fullName: users.fullName,
					email: users.email,
					password: users.password,
					role: users.role,
					societyRole: societyMembers.role,
				})
				.from(users)
				.leftJoin(societyMembers, and(eq(societyMembers.userId, users.id)))
				.where(eq(users.email, body.email))
				.limit(1);

			if (!user) {
				throw new ApiError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
			}

			if (user.role && user.role !== "admin") {
				throw new ApiError("You are not allowed to sign in", 404, "INVALID_DATA");
			}

			// Verify password
			const isPasswordValid = await comparePassword(body.password, user.password);

			if (!isPasswordValid) {
				throw new ApiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
			}

			let finalRole: UserRole;

			//@ts-ignore
			if (user.role === "society_head" && user.societyRole) {
				finalRole = user.societyRole; // president | treasurer | member etc.
			} else {
				finalRole = user.role as UserRole; // admin | student
			}

			// Generate tokens
			const accessTokenData = jwtService.generateToken({
				id: user.id,
				email: user.email,
				name: user.fullName,
				role: finalRole,
			});

			const refreshToken = jwtService.generateRefreshToken(user.id);

			// Set cookies
			reply.setCookie("authToken", accessTokenData, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: convertExpiresInToSeconds(process.env.JWT_EXPIRES_IN),
				path: "/",
			});

			reply.setCookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: 30 * 24 * 60 * 60,
				path: "/",
			});

			return reply.success(
				{
					user: accessTokenData,
				},
				"Signed in successfully",
			);
		},
	);

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
