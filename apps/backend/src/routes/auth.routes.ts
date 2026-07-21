import { users, societyMembers, type UserRole } from "@uni-events-hq/db";
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { eq, and, or } from "drizzle-orm";
import { comparePassword, hashPassword, jwtService } from "@uni-events-hq/auth";
import { ApiError } from "~/utils/ApiError";
import { adminAuthMiddleware, studentAuthMiddleware } from "~/middlewares/auth.middleware";
import { convertExpiresInToSeconds } from "~/utils/time";
import type { CookieSerializeOptions } from "@fastify/csrf-protection";

export async function authRoutes(fastify: FastifyInstance) {
	fastify.get("/admin/me", { preHandler: adminAuthMiddleware }, async (request, reply) => {
		return reply.success(
			{
				user: request.user,
			},
			"User retrieved successfully",
		);
	});

	fastify.get("/student/me", { preHandler: studentAuthMiddleware }, async (request, reply) => {
		return reply.success(
			{
				user: request.user,
			},
			"User retrieved successfully",
		);
	});

	fastify.post("/refresh-token", async (request: FastifyRequest, reply: FastifyReply) => {
		const isAdminRefresh = !!request.cookies?.adminRefreshToken;
		const refreshToken = request.cookies?.adminRefreshToken || request.cookies?.studentRefreshToken;

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

			const authCookieName = isAdminRefresh ? "adminAuthToken" : "studentAuthToken";
			const refreshCookieName = isAdminRefresh ? "adminRefreshToken" : "studentRefreshToken";

			// Set new cookies
			reply.setCookie(authCookieName, newAccessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: convertExpiresInToSeconds(process.env.JWT_EXPIRES_IN || "15m"),
				path: "/",
			});

			reply.setCookie(refreshCookieName, newRefreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: 30 * 24 * 60 * 60, // 30 days
				path: "/",
			});

			return reply.success(null, "Token refreshed successfully", 200);
		} catch (err) {
			reply.clearCookie("adminAuthToken").clearCookie("adminRefreshToken");
			reply.clearCookie("studentAuthToken").clearCookie("studentRefreshToken");
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
			reply.setCookie("adminAuthToken", accessTokenData, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: convertExpiresInToSeconds(process.env.JWT_EXPIRES_IN),
				path: "/",
			});

			reply.setCookie("adminRefreshToken", refreshToken, {
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
		"/student/signin",
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
					societyId: societyMembers.societyId,
					isVerified: users.isVerified,
				})
				.from(users)
				.leftJoin(societyMembers, and(eq(societyMembers.userId, users.id)))
				.where(eq(users.email, body.email))
				.limit(1);

			if (!user) {
				throw new ApiError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
			}

			if (user.role && user.role === "admin") {
				throw new ApiError("You are not allowed to sign in", 404, "INVALID_DATA");
			}

			if (!user.isVerified) {
				throw new ApiError("Your application is not verified yet.", 404, "NOT_VERIFIED");
			}

			const isPasswordValid = await comparePassword(body.password, user.password);

			if (!isPasswordValid) {
				throw new ApiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
			}

			let finalRole: UserRole;

			if (user.role === "society_head" && user.societyRole) {
				finalRole = user.societyRole;
			} else {
				finalRole = user.role as UserRole;
			}

			// Generate tokens
			const accessTokenData = jwtService.generateToken({
				id: user.id,
				email: user.email,
				name: user.fullName,
				role: finalRole,
				societyId: user.societyId ?? undefined,
			});

			const refreshToken = jwtService.generateRefreshToken(user.id);

			// Set cookies
			reply.setCookie("studentAuthToken", accessTokenData, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
				maxAge: convertExpiresInToSeconds(process.env.JWT_EXPIRES_IN),
				path: "/",
			});

			reply.setCookie("studentRefreshToken", refreshToken, {
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
		"/student/signup",
		{
			schema: {
				body: {
					type: "object",
					required: [
						"fullName",
						"email",
						"studentId",
						"password",
						"department",
						"batch",
						"section",
					],
					properties: {
						fullName: { type: "string" },
						email: { type: "string", format: "email" },
						studentId: { type: "string" },
						password: { type: "string" },
						department: { type: "string" },
						batch: { type: "string" },
						section: { type: "string" },
					},
				},
			},
		},
		async (request, reply) => {
			const body = request.body as {
				fullName: string;
				email: string;
				studentId: string;
				password: string;
				department: string;
				batch: string;
				section: string;
			};

			const existingUser = await fastify.db
				.select()
				.from(users)
				.where(or(eq(users.email, body.email), eq(users.studentId, body.studentId)))
				.limit(1);

			if (existingUser.length > 0) {
				throw new ApiError("Student already exists", 409, "EMAIL_EXISTS");
			}

			const hashedPassword = await hashPassword(body.password);

			await fastify.db.insert(users).values({
				fullName: body.fullName,
				email: body.email,
				studentId: body.studentId,
				password: hashedPassword,
				department: body.department,
				batch: body.batch,
				section: body.section,
				isVerified: false,
			});

			return reply.success(null, "Account created successfully. Pending admin verification", 201);
		},
	);

	/** Signout */
	fastify.post("/signout", async (request: FastifyRequest, reply: FastifyReply) => {
		const { isAdmin } = request.query as { isAdmin?: string };

		const cookieOptions: CookieSerializeOptions | undefined = {
			path: "/",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
		};

		if (isAdmin === "true") {
			reply
				.clearCookie("adminAuthToken", cookieOptions)
				.clearCookie("adminRefreshToken", cookieOptions);
		} else {
			reply
				.clearCookie("studentAuthToken", cookieOptions)
				.clearCookie("studentRefreshToken", cookieOptions);
		}

		return reply.success(null, "Logged out successfully");
	});
}
