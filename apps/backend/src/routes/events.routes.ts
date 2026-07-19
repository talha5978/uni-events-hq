import { eventRegistrations, events, qrCodes, societyMembers, users } from "@uni-events-hq/db";
import { and, count, desc, eq, getTableColumns, gt, gte, lte, or, sql } from "drizzle-orm";
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
						status: { type: "string", enum: ["all", "active"] },
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

	fastify.get(
		"/:id",
		{ preHandler: [studentAuthMiddleware] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { id } = request.params as { id: string };
			const societyId = request.user?.societyId;

			if (!societyId) {
				throw new ApiError("Society ID not found in user session", 400, "NO_SOCIETY_ID");
			}

			const event = await fastify.db.query.events.findFirst({
				where: eq(events.id, id),
			});

			if (!event) {
				throw new ApiError("Event not found", 404, "EVENT_NOT_FOUND");
			}

			if (event.societyId !== societyId) {
				throw new ApiError("You don't have access to this event", 403, "FORBIDDEN");
			}

			return reply.success({ event }, "Event details retrieved successfully");
		},
	);

	fastify.put(
		"/:id",
		{ preHandler: [studentAuthMiddleware, requireRole(["president"])] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { id } = request.params as { id: string };
			const userId = request.user?.id;
			const societyId = request.user?.societyId;

			if (!societyId) {
				throw new ApiError("Society ID not found in user session", 400, "NO_SOCIETY_ID");
			}

			const {
				title,
				description,
				eventDate,
				location,
				isMembersOnly,
				maxParticipants,
				rules,
				hasMultipleSlots,
				timeslots,
				bannerUrl,
				status,
			} = request.body as any;

			// Check if event exists and belongs to user's society
			const existingEvent = await fastify.db.query.events.findFirst({
				where: eq(events.id, id),
			});

			if (!existingEvent) {
				throw new ApiError("Event not found", 404, "EVENT_NOT_FOUND");
			}

			if (existingEvent.societyId !== societyId || existingEvent.createdBy !== userId) {
				throw new ApiError("You don't have permission to update this event", 403, "FORBIDDEN");
			}

			const [updatedEvent] = await fastify.db
				.update(events)
				.set({
					title: title?.trim(),
					description: description?.trim(),
					eventDate: eventDate ? new Date(eventDate) : undefined,
					location: location?.trim(),
					isMembersOnly: isMembersOnly,
					maxParticipants: maxParticipants,
					rules: rules?.length > 0 ? rules : null,
					hasMultipleSlots: hasMultipleSlots,
					timeslots: hasMultipleSlots ? timeslots : null,
					bannerUrl: bannerUrl || existingEvent.bannerUrl,
					updatedAt: new Date(),
					status,
				})
				.where(eq(events.id, id))
				.returning();

			return reply.success({ event: updatedEvent }, title + " event updated successfully");
		},
	);

	fastify.post(
		"/:eventId/register",
		{ preHandler: [studentAuthMiddleware] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { eventId } = request.params as { eventId: string };
			const userId = request.user?.id;

			if (!userId) {
				throw new ApiError("User ID not found in user session", 400, "NO_USER_ID");
			}

			const { selectedTimeslot, transactionProofUrl } = request.body as {
				selectedTimeslot?: any;
				transactionProofUrl?: string;
			};

			// Start transaction
			const result = await fastify.db.transaction(async (tx) => {
				// 1. Check if already registered
				const existingRegistration = await tx.query.eventRegistrations.findFirst({
					where: and(
						eq(eventRegistrations.eventId, eventId),
						eq(eventRegistrations.userId, userId),
					),
				});

				if (existingRegistration) {
					throw new ApiError(
						"You are already registered for this event",
						409,
						"ALREADY_REGISTERED",
					);
				}

				// 2. Get event details
				const event = await tx.query.events.findFirst({
					where: eq(events.id, eventId),
				});

				if (!event) {
					throw new ApiError("Event not found", 404, "EVENT_NOT_FOUND");
				}

				// 3. Create registration
				const [newRegistration] = await tx
					.insert(eventRegistrations)
					.values({
						eventId,
						userId,
						selectedTimeslot: selectedTimeslot || null,
						transactionProofUrl: transactionProofUrl || null,
						status: event.isPaid ? "pending_verification" : "registered",
					})
					.returning();

				// 4. Create QR Code entry
				await tx.insert(qrCodes).values({
					eventRegistrationId: newRegistration.id,
					userId,
				});

				return { newRegistration, event };
			});

			return reply.success(
				{
					registrationId: result.newRegistration.id,
				},
				result.event.isPaid
					? "Registration submitted! Waiting for payment verification."
					: "Registration successful!",
				201,
			);
		},
	);

	fastify.get(
		"/registrations/:regId",
		{ preHandler: [studentAuthMiddleware] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { regId } = request.params as { regId: string };
			const userId = request.user?.id;

			const {
				transactionProofUrl,
				paymentVerifiedAt,
				paymentVerifiedBy,
				scannedAt,
				...safeRegistrationColumns
			} = getTableColumns(eventRegistrations);

			const [registration] = await fastify.db
				.select({
					...safeRegistrationColumns,
					event: events,
					user: users,
				})
				.from(eventRegistrations)
				.innerJoin(events, eq(eventRegistrations.eventId, events.id))
				.innerJoin(users, eq(eventRegistrations.userId, users.id))
				.where(eq(eventRegistrations.id, regId))
				.limit(1);

			if (!registration) {
				throw new ApiError("Registration not found", 404, "REGISTRATION_NOT_FOUND");
			}

			if (registration.userId !== userId) {
				throw new ApiError("You don't have access to this registration", 403, "FORBIDDEN");
			}

			const qrCode = await fastify.db
				.select({ id: qrCodes.id })
				.from(qrCodes)
				.where(eq(qrCodes.eventRegistrationId, regId))
				.limit(1);

			return reply.success({
				registration,
				event: registration.event,
				qrCodeId: qrCode[0]?.id,
			});
		},
	);
}
