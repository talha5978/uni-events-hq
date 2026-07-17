import type { FastifyInstance } from "fastify";
import errorHandlerPlugin from "~/plugins/error-handler";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import { connectDB } from "@uni-events-hq/db";
import { authRoutes } from "~/routes/auth.routes";
import helmet from "@fastify/helmet";
import csrf from "@fastify/csrf-protection";
import multipart from "@fastify/multipart";

export async function server(fastify: FastifyInstance) {
	await fastify.register(errorHandlerPlugin);

	await fastify.register(fastifyCors, {
		origin: [process.env.WEB_URL!],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
		exposedHeaders: ["Set-Cookie"],
	});

	await fastify.register(helmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", "data:", "https:"],
			},
		},
		crossOriginEmbedderPolicy: false,
	});

	await fastify.register(csrf, {
		cookieOpts: { httpOnly: true, secure: process.env.NODE_ENV === "production" },
	});

	await fastify.register(fastifyCookie);

	await fastify.register(multipart, {
		limits: {
			fileSize: 50 * 1024 * 1024,
			files: 1,
		},
	});

	const dbConnection = await connectDB(process.env.PG_CONNECTION_STRING!);
	fastify.decorate("db", dbConnection.db);

	await fastify.register(authRoutes, { prefix: "/api/auth" });
}
