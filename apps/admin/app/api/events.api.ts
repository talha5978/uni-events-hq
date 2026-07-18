import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { Event } from "@uni-events-hq/db";

export function createEventsApi(client = createApiClient()) {
	return {
		client,

		async getEvents(
			query: {
				pageSize?: number;
				status?: "all" | "active";
			} = {},
		) {
			const params = new URLSearchParams();

			if (query.pageSize !== undefined) {
				params.append("pageSize", query.pageSize.toString());
			}
			if (query.status) {
				params.append("status", query.status);
			}

			const url = `/events${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<
				ApiResponse<{
					events: Event[];
					pagination: {
						pageSize: number;
						total: number;
						hasMore: boolean;
					};
					filters: { status: string };
				}>
			>(url, { method: "GET" });
		},
	};
}
