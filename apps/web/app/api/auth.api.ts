import type { ApiResponse } from "~/types/response";
import type { UserPayload } from "@uni-events-hq/auth";
import { createApiClient } from "~/api/client";
import type { RawUserRole } from "@uni-events-hq/db";

export function createAuthApi(client = createApiClient()) {
	return {
		client,

		async me() {
			return await client.request<
				ApiResponse<{
					user: UserPayload;
				}>
			>("/auth/student/me");
		},

		async myDetails() {
			return await client.request<
				ApiResponse<{
					user: {
						id: string;
						email: string;
						fullName: string;
						studentId: string | null;
						role: RawUserRole;
						avatarUrl: string | null;
					};
				}>
			>("/auth/student/details");
		},

		async signIn(data: { email: string; password: string }) {
			return await client.request<
				ApiResponse<{
					user: UserPayload;
				}>
			>("/auth/student/signin", {
				method: "POST",
				body: JSON.stringify(data),
			});
		},

		async signUp(data: {
			fullName: string;
			email: string;
			studentId: string;
			password: string;
			department: string;
			batch: string;
			section: string;
		}) {
			return await client.request<ApiResponse<null>>("/auth/student/signup", {
				method: "POST",
				body: JSON.stringify(data),
			});
		},

		async logout() {
			return await client.request("/auth/signout?isAdmin=false", {
				method: "POST",
				body: JSON.stringify({}),
			});
		},
	};
}
