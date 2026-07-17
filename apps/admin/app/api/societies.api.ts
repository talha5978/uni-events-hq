import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { Society } from "@uni-events-hq/db";
import type { SocietiesResponse } from "~/types/societies";

export function createSocietiesApi(client = createApiClient()) {
	return {
		client,

		async create(body: {
			name: string;
			slug: string;
			description?: string | null;
			category?: string | null;
			logoUrl?: string | null;
			bannerUrl?: string | null;
		}) {
			return await client.request<ApiResponse<{ society: Society }>>("/societies/create", {
				method: "POST",
				body: JSON.stringify(body),
			});
		},

		async getAllSocieties(
			query: {
				pageSize?: number;
			} = {},
		) {
			const params = new URLSearchParams();

			if (query.pageSize !== undefined) params.append("pageSize", query.pageSize.toString());

			const url = `/societies/admin/list${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<ApiResponse<SocietiesResponse>>(url, {
				method: "GET",
			});
		},
	};
}
