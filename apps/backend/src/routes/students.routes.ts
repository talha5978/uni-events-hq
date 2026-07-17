import { users } from "@uni-events-hq/db";
import { and, count, desc, ilike, or, ne } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authMiddleware, requireRole } from "~/middlewares/auth.middleware";

export async function studentsRoutes(fastify: FastifyInstance) {
	fastify.get(
		"/admin",
		{ preHandler: [authMiddleware, requireRole(["admin"])] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const {
				pageIndex = "0",
				pageSize = "10",
				search = "",
			} = request.query as {
				pageIndex?: string;
				pageSize?: string;
				search?: string;
			};

			const page = parseInt(pageIndex);
			const limit = parseInt(pageSize);
			const offset = page * limit;

			const searchTerm = search.trim().toLowerCase();

			// Base condition: Exclude admins
			let whereCondition = ne(users.role, "admin");

			// Search across fullName, email, and studentId
			if (searchTerm) {
				whereCondition = and(
					whereCondition,
					or(
						ilike(users.fullName, `%${searchTerm}%`),
						ilike(users.email, `%${searchTerm}%`),
						ilike(users.studentId, `%${searchTerm}%`),
					),
				) as any;
			}

			const studentsData = await fastify.db
				.select({
					id: users.id,
					fullName: users.fullName,
					email: users.email,
					avatarUrl: users.avatarUrl,
					role: users.role,
					studentId: users.studentId,
					department: users.department,
					batch: users.batch,
					section: users.section,
					isVerified: users.isVerified,
					createdAt: users.createdAt,
				})
				.from(users)
				.where(whereCondition)
				.orderBy(desc(users.createdAt))
				.limit(limit)
				.offset(offset);

			const totalResult = await fastify.db.select({ count: count() }).from(users).where(whereCondition);

			const total = Number(totalResult[0]?.count || 0);

			return reply.success({
				students: studentsData,
				pagination: {
					page,
					pageSize: limit,
					total,
					pageCount: Math.ceil(total / limit),
				},
			});
		},
	);
}
