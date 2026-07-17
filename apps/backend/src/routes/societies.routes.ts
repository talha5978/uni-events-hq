import { societies } from "@uni-events-hq/db";
import { count, desc, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authMiddleware, requireRole } from "~/middlewares/auth.middleware";
import { ApiError } from "~/utils/ApiError";

export async function societiesRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/create",
		{
			preHandler: [authMiddleware, requireRole(["admin"])],
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
		{ preHandler: [authMiddleware, requireRole(["admin"])] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { pageSize = "12" } = request.query as { pageSize?: string };

			const limit = parseInt(pageSize);
			const offset = 0; // Always start from beginning (as per your requirement)

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
}
