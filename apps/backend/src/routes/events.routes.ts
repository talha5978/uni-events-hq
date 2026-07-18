import { events, societyMembers } from "@uni-events-hq/db";
import { and, count, desc, eq, gt, gte, lte, or, sql } from "drizzle-orm";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireRole, studentAuthMiddleware } from "~/middlewares/auth.middleware";
import { ApiError } from "~/utils/ApiError";

export async function eventsRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/:societyId",
		{
			preHandler: [studentAuthMiddleware, requireRole(["president"])],
			schema: {
				params: {
					type: "object",
					properties: {
						societyId: { type: "string" },
					},
					required: ["societyId"],
				},
				body: {
					type: "object",
					required: ["title", "description", "eventDate"],
					properties: {
						title: { type: "string", minLength: 3 },
						description: { type: "string", minLength: 10 },
						bannerUrl: { type: "string" },
						eventDate: { type: "string", format: "date-time" },
						hasMultipleSlots: { type: "boolean" },
						timeslots: { type: "array" },
						location: { type: "string" },
						isPaid: { type: "boolean" },
						ticketPrice: { type: "number" },
						maxParticipants: { type: "integer", minimum: 1 },
						rules: { type: "array" },
						isMembersOnly: { type: "boolean" },
					},
				},
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { societyId } = request.params as { societyId: string };
			const {
				title,
				description,
				bannerUrl,
				eventDate,
				hasMultipleSlots = false,
				timeslots,
				location,
				isPaid = false,
				ticketPrice,
				maxParticipants,
				rules = [],
				isMembersOnly = false,
			} = request.body as any;

			const userId = request.user!.id;

			// Verify that the user has permission to create event in this society
			const hasPermission = await fastify.db.query.societyMembers.findFirst({
				where: and(
					eq(societyMembers.societyId, societyId),
					eq(societyMembers.userId, userId),
					or(eq(societyMembers.role, "president")),
				),
			});

			const isAdmin = request.user!.role === "admin";

			if (!hasPermission && !isAdmin) {
				throw new ApiError(
					"You don't have permission to create events for this society",
					403,
					"FORBIDDEN",
				);
			}

			const [newEvent] = await fastify.db
				.insert(events)
				.values({
					societyId,
					title: title.trim(),
					description: description.trim(),
					bannerUrl: bannerUrl || null,
					eventDate: new Date(eventDate),
					hasMultipleSlots,
					timeslots: timeslots || null,
					location: location?.trim() || null,
					isPaid,
					ticketPrice: isPaid ? ticketPrice : null,
					maxParticipants: maxParticipants || null,
					rules: rules.length > 0 ? rules : null,
					isMembersOnly,
					status: "draft",
					createdBy: userId,
				})
				.returning();

			return reply.success({ event: newEvent }, "Event created successfully", 201);
		},
	);

	fastify.get(
		"/current-user",
		{ preHandler: [studentAuthMiddleware, requireRole(["president"])] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			let societyId = request.user?.societyId;

			if (!societyId) {
				throw new ApiError("Society ID not found in user session", 400, "NO_SOCIETY_ID");
			}

			const eventsList = await fastify.db
				.select()
				.from(events)
				.where(eq(events.societyId, societyId))
				.orderBy(desc(events.eventDate));

			return reply.success({ events: eventsList }, "Society events retrieved successfully");
		},
	);

	fastify.get(
		"/",
		{
			schema: {
				querystring: {
					type: "object",
					properties: {
						pageSize: { type: "string" },
						status: { type: "string", enum: ["all", "upcoming", "ongoing"] },
					},
				},
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { pageSize = "12", status = "all" } = request.query as {
				pageSize?: string;
				status?: "all" | "active";
			};

			const limit = parseInt(pageSize);

			let whereCondition = undefined;

			if (status === "active") {
				whereCondition = or(
					gt(events.eventDate, new Date()),
					and(
						lte(events.eventDate, new Date()),
						gte(events.eventDate, sql`NOW() - INTERVAL '14 days'`),
					),
				);
			}

			const eventsList = await fastify.db
				.select()
				.from(events)
				.where(whereCondition)
				.orderBy(desc(events.eventDate))
				.limit(limit);

			const totalResult = await fastify.db
				.select({ count: count() })
				.from(events)
				.where(whereCondition);

			const total = Number(totalResult[0]?.count || 0);

			return reply.success(
				{
					events: eventsList,
					pagination: {
						pageSize: limit,
						total,
						hasMore: total > limit,
					},
					filters: { status },
				},
				"Events retrieved successfully",
			);
		},
	);
}
