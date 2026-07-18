import { events, societies, societyBankAccounts, societyMembers, users } from "@uni-events-hq/db";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { adminAuthMiddleware, requireRole } from "~/middlewares/auth.middleware";
import { ApiError } from "~/utils/ApiError";

export async function societiesRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/create",
		{
			preHandler: [adminAuthMiddleware, requireRole(["admin"])],
			schema: {
				body: {
					type: "object",
					required: ["name", "slug"],
					properties: {
						name: { type: "string", minLength: 2 },
						slug: { type: "string", pattern: "^[a-z0-9-]+" },
						description: { type: "string" },
						category: { type: "string" },
						logoUrl: { type: "string" },
						bannerUrl: { type: "string" },
					},
				},
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { name, slug, description, category, logoUrl, bannerUrl } = request.body as {
				name: string;
				slug: string;
				description?: string;
				category?: string;
				logoUrl?: string;
				bannerUrl?: string;
			};

			const adminId = request.user!.id;

			if (!adminId) {
				throw new ApiError("Admin not found", 404, "ADMIN_NOT_FOUND");
			}

			// Check if slug already exists
			const existingSociety = await fastify.db.query.societies.findFirst({
				where: eq(societies.slug, slug),
			});

			if (existingSociety) {
				throw new ApiError("Society with this slug already exists", 409, "SOCIETY_SLUG_EXISTS");
			}

			const [newSociety] = await fastify.db
				.insert(societies)
				.values({
					name: name.trim(),
					slug: slug.toLowerCase().trim(),
					description: description?.trim() || null,
					category: category?.trim() || null,
					logoUrl: logoUrl || null,
					bannerUrl: bannerUrl || null,
					createdBy: adminId,
				})
				.returning();

			return reply.success({ society: newSociety }, "Society created successfully", 201);
		},
	);

	fastify.get(
		"/admin/list",
		{ preHandler: [adminAuthMiddleware, requireRole(["admin"])] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { pageSize = "12" } = request.query as { pageSize?: string };

			const limit = parseInt(pageSize);
			const offset = 0;

			const societiesData = await fastify.db
				.select({
					id: societies.id,
					name: societies.name,
					description: societies.description,
					logoUrl: societies.logoUrl,
					category: societies.category,
					createdAt: societies.createdAt,
				})
				.from(societies)
				.orderBy(desc(societies.createdAt))
				.limit(limit)
				.offset(offset);

			const totalResult = await fastify.db.select({ count: count() }).from(societies);

			const total = Number(totalResult[0]?.count || 0);

			return reply.success({
				societies: societiesData,
				pagination: {
					page: 1,
					pageSize: limit,
					total,
					hasMore: total > limit,
				},
			});
		},
	);

	fastify.get(
		"/admin/:id",
		{
			schema: { params: { type: "object", required: ["id"], properties: { id: { type: "string" } } } },
			preHandler: [adminAuthMiddleware, requireRole(["admin"])],
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const { pageSize = "12" } = request.query as { pageSize?: string };

			const limit = parseInt(pageSize);

			// Fetch Society Details
			const society = await fastify.db.query.societies.findFirst({
				where: eq(societies.id, id),
			});

			if (!society) {
				throw new ApiError("Society not found", 404, "SOCIETY_NOT_FOUND");
			}

			// Bank Accounts
			const bankAccounts = await fastify.db
				.select()
				.from(societyBankAccounts)
				.where(eq(societyBankAccounts.societyId, id))
				.orderBy(desc(societyBankAccounts.createdAt));

			// Members with User Info + Priority (President & Treasurer first)
			const members = await fastify.db
				.select({
					id: societyMembers.id,
					role: societyMembers.role,
					joinedAt: societyMembers.joinedAt,
					user: {
						id: users.id,
						fullName: users.fullName,
						email: users.email,
						studentId: users.studentId,
						avatarUrl: users.avatarUrl,
					},
				})
				.from(societyMembers)
				.leftJoin(users, eq(societyMembers.userId, users.id))
				.where(eq(societyMembers.societyId, id))
				.orderBy(
					// President and Treasurer on top
					sql`CASE 
					WHEN ${societyMembers.role} = 'president' THEN 1
					WHEN ${societyMembers.role} = 'treasurer' THEN 2
					ELSE 3 
				END`,
					desc(societyMembers.joinedAt),
				)
				.limit(limit);

			// Events (Upcoming + Ongoing)
			const eventsList = await fastify.db
				.select()
				.from(events)
				.where(eq(events.societyId, id))
				.orderBy(events.eventDate);

			const totalMembersResult = await fastify.db
				.select({ count: count() })
				.from(societyMembers)
				.where(eq(societyMembers.societyId, id));

			const totalMembers = Number(totalMembersResult[0]?.count || 0);

			return reply.success({
				society,
				bankAccounts,
				members,
				events: eventsList,
				membersCount: totalMembers,
				hasMoreMembers: totalMembers > limit,
			});
		},
	);

	fastify.post(
		"/:societyId/members",
		{
			preHandler: [adminAuthMiddleware, requireRole(["admin"])],
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { societyId } = request.params as { societyId: string };
			const { userId, role, action } = request.body as {
				userId: string;
				role: "president" | "treasurer" | "member";
				action: "add" | "remove";
			};

			if (action === "add") {
				// Check if already a member
				const existing = await fastify.db.query.societyMembers.findFirst({
					where: and(eq(societyMembers.societyId, societyId), eq(societyMembers.userId, userId)),
				});

				if (existing) {
					// Update role if already exists
					await fastify.db
						.update(societyMembers)
						.set({ role })
						.where(
							and(eq(societyMembers.societyId, societyId), eq(societyMembers.userId, userId)),
						);
				} else {
					await fastify.db.insert(societyMembers).values({
						societyId,
						userId,
						role,
					});

					await fastify.db.update(users).set({ role: "society_head" }).where(eq(users.id, userId));
				}
			} else if (action === "remove") {
				await fastify.db
					.delete(societyMembers)
					.where(and(eq(societyMembers.societyId, societyId), eq(societyMembers.userId, userId)));

				await fastify.db.update(users).set({ role: "student" }).where(eq(users.id, userId));
			}

			return reply.success(
				{ userId },
				action === "add" ? "Member added successfully" : "Member removed successfully",
			);
		},
	);

	fastify.get(
		"/:id/edit",
		{
			schema: { params: { type: "object", properties: { id: { type: "string" } } } },
			preHandler: [adminAuthMiddleware, requireRole(["admin"])],
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { id } = request.params as { id: string };

			const society = await fastify.db.query.societies.findFirst({
				where: eq(societies.id, id),
			});

			if (!society) {
				throw new ApiError("Society not found", 404, "SOCIETY_NOT_FOUND");
			}

			return reply.success({ society }, "Society details fetched successfully");
		},
	);

	// PUT /societies/:id
	fastify.put(
		"/:id/edit",
		{
			schema: { params: { type: "object", properties: { id: { type: "string" } } } },
			preHandler: [adminAuthMiddleware, requireRole(["admin"])],
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { id } = request.params as { id: string };
			const { name, description, category, logoUrl, bannerUrl } = request.body as {
				name: string;
				description?: string;
				category?: string;
				logoUrl?: string;
				bannerUrl?: string;
			};

			const society = await fastify.db.query.societies.findFirst({
				where: eq(societies.id, id),
			});

			if (!society) {
				throw new ApiError("Society not found", 404, "SOCIETY_NOT_FOUND");
			}

			const [updatedSociety] = await fastify.db
				.update(societies)
				.set({
					name: name.trim(),
					description: description?.trim() || null,
					category: category?.trim() || null,
					logoUrl: logoUrl || society.logoUrl,
					bannerUrl: bannerUrl || society.bannerUrl,
					updatedAt: new Date(),
				})
				.where(eq(societies.id, id))
				.returning();

			return reply.success({ society: updatedSociety }, "Society updated successfully");
		},
	);
}
