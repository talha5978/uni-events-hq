import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { Society } from "@uni-events-hq/db";
import type { SocietiesResponse, SocietyDetails } from "~/types/societies";
import type { SocietyMembersResponse } from "~/types/users";

export function createSocietiesApi(client = createApiClient()) {
	return {
		client,

		async getAllSocieties(
			query: {
				pageSize?: number;
			} = {},
		) {
			const params = new URLSearchParams();

			if (query.pageSize !== undefined) params.append("pageSize", query.pageSize.toString());

			const url = `/societies/list${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<ApiResponse<SocietiesResponse>>(url, {
				method: "GET",
			});
		},

		async getById() {
			return await client.request<ApiResponse<SocietyDetails>>(`/societies/student/current`, {
				method: "GET",
			});
		},

		async getSocietyForEdit(id: string) {
			return await client.request<ApiResponse<{ society: Society }>>(`/societies/${id}/edit`, {
				method: "GET",
			});
		},

		async update(
			id: string,
			body: {
				name: string;
				description?: string | null;
				category?: string | null;
				logoUrl?: string | null;
				bannerUrl?: string | null;
			},
		) {
			return await client.request<ApiResponse<{ society: Society }>>(`/societies/${id}/edit`, {
				method: "PUT",
				body: JSON.stringify(body),
			});
		},

		async getSocietyMembers(query: { pageSize?: number; pageIndex?: number } = {}) {
			const params = new URLSearchParams();
			if (query.pageSize) params.append("pageSize", query.pageSize.toString());
			if (query.pageIndex) params.append("pageIndex", query.pageIndex.toString());

			const url = `/societies/members${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<ApiResponse<SocietyMembersResponse>>(url, { method: "GET" });
		},
	};
}
