import "fastify";
import type { DbClient } from "@uni-events-hq/db";
import type { UserPayload } from "@uni-events-hq/auth";

declare module "fastify" {
	interface FastifyInstance {
		db: DbClient;
	}

	interface FastifyRequest {
		user: UserPayload | null;
	}

	interface FastifyReply {
		success<D>(data: D, message?: string, statusCode?: number): FastifyReply;
	}
}
