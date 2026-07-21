import { users, societies, events, eventRegistrations, societyMembers } from "@uni-events-hq/db";
import { eq, and, desc, count, or, gt, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { adminAuthMiddleware, requireRole, studentAuthMiddleware } from "~/middlewares/auth.middleware";
import { ApiError } from "~/utils/ApiError";

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

	fastify.get(
		"/president",
		{ preHandler: [studentAuthMiddleware, requireRole(["president"])] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const societyId = request.user?.societyId;

			if (!societyId) {
				throw new ApiError("No society associated", 400, "NO_SOCIETY");
			}

			// Metrics
			const totalMembers = await fastify.db
				.select({ count: count() })
				.from(societyMembers)
				.where(eq(societyMembers.societyId, societyId));

			const upcomingEvents = await fastify.db
				.select({ count: count() })
				.from(events)
				.where(and(eq(events.societyId, societyId), gt(events.eventDate, new Date())));

			const pendingPayments = await fastify.db
				.select({ count: count() })
				.from(eventRegistrations)
				.where(
					and(
						eq(eventRegistrations.status, "pending_verification"),
						inArray(
							eventRegistrations.eventId,
							fastify.db
								.select({ id: events.id })
								.from(events)
								.where(eq(events.societyId, societyId)),
						),
					),
				);

			// Upcoming Events
			const recentUpcoming = await fastify.db
				.select({
					id: events.id,
					title: events.title,
					eventDate: events.eventDate,
					location: events.location,
					isPaid: events.isPaid,
				})
				.from(events)
				.where(and(eq(events.societyId, societyId), eq(events.status, "upcoming")))
				.orderBy(events.eventDate)
				.limit(5);

			// Pending Registrations
			const pendingRegistrations = await fastify.db
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
				.where(
					and(
						eq(events.societyId, societyId),
						eq(eventRegistrations.status, "pending_verification"),
					),
				)
				.orderBy(desc(eventRegistrations.registeredAt))
				.limit(6);

			return reply.success({
				metrics: {
					totalMembers: totalMembers[0].count,
					upcomingEvents: upcomingEvents[0].count,
					pendingPayments: pendingPayments[0].count,
				},
				recentUpcoming,
				pendingRegistrations,
			});
		},
	);
};
