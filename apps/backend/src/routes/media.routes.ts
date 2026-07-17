import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { deleteFromCloudinary, uploadToCloudinary } from "~/lib/cloudinary";
import { authMiddleware } from "~/middlewares/auth.middleware";
import { ApiError } from "~/utils/ApiError";

export async function mediaRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/upload",
		{
			preHandler: [authMiddleware],
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const data = await request.file();
			if (!data) {
				throw new ApiError("No file uploaded", 400, "NO_FILE_UPLOADED");
			}
			// console.log(data);

			try {
				const buffer = await data.toBuffer();

				const result = await uploadToCloudinary(buffer, "uni-events-hq");

				return reply.success(
					{
						url: result.secure_url,
						publicId: result.public_id,
					},
					"Image uploaded successfully",
				);
			} catch (error) {
				throw new ApiError("Failed to upload image", 500, "FAILED_TO_UPLOAD_IMAGE", {
					error,
				});
			}
		},
	);

	fastify.delete(
		"/delete",
		{
			preHandler: [authMiddleware],
			schema: {
				body: {
					type: "object",
					required: ["publicId"],
					properties: {
						publicId: { type: "string" },
					},
				},
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			const { publicId } = request.body as { publicId: string };
			try {
				await deleteFromCloudinary(publicId);
				return reply.success(null, "Image deleted successfully");
			} catch (error) {
				throw new ApiError("Failed to delete image", 500, "FAILED_TO_DELETE_IMAGE", {
					error,
				});
			}
		},
	);
}
