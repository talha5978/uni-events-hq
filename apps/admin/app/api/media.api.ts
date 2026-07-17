import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";

export function createMediaApi(client = createApiClient()) {
	return {
		client,

		async upload(file: File) {
			const formData = new FormData();
			formData.append("file", file);

			return await client.request<
				ApiResponse<{
					url: string;
					publicId: string;
				}>
			>("/media/upload", {
				method: "POST",
				body: formData,
			});
		},

		async delete(publicId: string) {
			return await client.request<ApiResponse<null>>("/media/delete", {
				method: "DELETE",
				body: JSON.stringify({ publicId }),
			});
		},
	};
}
