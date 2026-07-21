import { users, societies, events, eventRegistrations } from "@uni-events-hq/db";
import { eq, and, desc, count, or } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { adminAuthMiddleware, requireRole } from "~/middlewares/auth.middleware";

export const dashboardRoutes = (fastify: FastifyInstance) => {
	fastify.get(
		"/admin",
		{ preHandler: [adminAuthMiddleware, requireRole(["admin"])] },
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const totalStudents = await fastify.db
				.select({ count: count() })
				.from(users)
				.where(or(eq(users.role, "student"), eq(users.role, "society_head")));
			const verifiedStudents = await fastify.db
				.select({ count: count() })
				.from(users)
				.where(
					and(
						or(eq(users.role, "student"), eq(users.role, "society_head")),
						eq(users.isVerified, true),
					),
				);
			const pendingVerifications = await fastify.db
				.select({ count: count() })
				.from(users)
				.where(and(eq(users.role, "student"), eq(users.isVerified, false)));

			const totalSocieties = await fastify.db.select({ count: count() }).from(societies);
			const totalEvents = await fastify.db.select({ count: count() }).from(events);

			const pendingStudents = await fastify.db
				.select({
					id: users.id,
					fullName: users.fullName,
					email: users.email,
					studentId: users.studentId,
					department: users.department,
					batch: users.batch,
					createdAt: users.createdAt,
				})
				.from(users)
				.where(and(eq(users.role, "student"), eq(users.isVerified, false)))
				.orderBy(users.createdAt)
				.limit(8);

			const recentEvents = await fastify.db
				.select({
					id: events.id,
					title: events.title,
					eventDate: events.eventDate,
					status: events.status,
					societyName: societies.name,
				})
				.from(events)
				.leftJoin(societies, eq(events.societyId, societies.id))
				.orderBy(desc(events.createdAt))
				.limit(5);

			const recentRegistrations = await fastify.db
				.select({
					registrationId: eventRegistrations.id,
					status: eventRegistrations.status,
					registeredAt: eventRegistrations.registeredAt,
					studentName: users.fullName,
					eventTitle: events.title,
				})
				.from(eventRegistrations)
				.leftJoin(users, eq(eventRegistrations.userId, users.id))
				.leftJoin(events, eq(eventRegistrations.eventId, events.id))
				.orderBy(desc(eventRegistrations.registeredAt))
				.limit(5);

			return reply.success({
				metrics: {
					totalStudents: totalStudents[0].count,
					verifiedStudents: verifiedStudents[0].count,
					pendingVerifications: pendingVerifications[0].count,
					totalSocieties: totalSocieties[0].count,
					totalEvents: totalEvents[0].count,
				},
				pendingStudents,
				recentEvents,
				recentRegistrations,
			});
		},
	);
};
