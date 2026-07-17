import type { ApiResponse } from "~/types/response";
import type { UserPayload } from "@uni-events-hq/auth";
import { createApiClient } from "~/api/client";

export function createAuthApi(client = createApiClient()) {
	return {
		client,

		async me() {
			return await client.request<
				ApiResponse<{
					user: UserPayload;
				}>
			>("/auth/me");
		},

		async signIn(data: any) {
			return await client.request<
				ApiResponse<{
					user: UserPayload;
				}>
			>("/auth/admin/signin", {
				method: "POST",
				body: JSON.stringify(data),
			});
		},

		async logout() {
			return await client.request("/auth/signout", {
				method: "POST",
				body: JSON.stringify({}),
			});
		},
	};
}
