import { events, societyMembers } from "@uni-events-hq/db";
import { and, eq, or } from "drizzle-orm";
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
}
