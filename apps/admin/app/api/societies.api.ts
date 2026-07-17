import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { Society } from "@uni-events-hq/db";

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

		// You can add more methods later (getAll, getById, update, delete, etc.)
		async getAllSocieties(
			query: {
				pageIndex?: number;
				pageSize?: number;
				search?: string;
				category?: string;
			} = {},
		) {
			const params = new URLSearchParams();

			if (query.pageIndex !== undefined) params.append("pageIndex", query.pageIndex.toString());
			if (query.pageSize !== undefined) params.append("pageSize", query.pageSize.toString());
			if (query.search) params.append("search", query.search);
			if (query.category) params.append("category", query.category);

			const url = `/societies${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<ApiResponse<any>>(url, {
				method: "GET",
			});
		},
	};
}
