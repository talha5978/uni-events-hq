import { v2 as cloudinary } from "cloudinary";
import { type Readable } from "stream";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResponse {
	public_id: string;
	url: string;
	secure_url: string;
	bytes: number;
	format: string;
}

/**
 * Upload image buffer or stream to Cloudinary
 */
export const uploadToCloudinary = async (
	file: Buffer | Readable,
	folder: string = "uni-events-hq",
	options: { width?: number; height?: number; crop?: string } = {},
): Promise<CloudinaryUploadResponse> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				transformation: [
					{
						width: options.width || 400,
						height: options.height || 400,
						crop: options.crop || "fill",
						gravity: "face",
					},
				],
				resource_type: "image",
			},
			(error, result) => {
				if (error) return reject(error);
				if (!result) return reject(new Error("Upload failed"));
				resolve({
					public_id: result.public_id,
					url: result.url,
					secure_url: result.secure_url,
					bytes: result.bytes,
					format: result.format,
				});
			},
		);

		if (Buffer.isBuffer(file)) {
			uploadStream.end(file);
		} else {
			file.pipe(uploadStream);
		}
	});
};

/**
 * Delete image from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
	await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
