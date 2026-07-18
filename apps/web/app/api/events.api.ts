import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { Event } from "@uni-events-hq/db";

export function createEventsApi(client = createApiClient()) {
	return {
		client,

		async createEvent(
			societyId: string,
			body: {
				title: string;
				description: string;
				eventDate: string;
				location: string;
				bannerUrl?: string | null;
				isMembersOnly?: boolean;
				isPaid?: boolean;
				ticketPrice?: number | null;
				maxParticipants?: number | null;
				rules?: string[];
				hasMultipleSlots?: boolean;
				timeslots?: { startTime: string; endTime: string }[];
			},
		) {
			return await client.request<ApiResponse<{ event: any }>>(`/events/${societyId}`, {
				method: "POST",
				body: JSON.stringify(body),
			});
		},

		async getMySocietyEvents() {
			return await client.request<
				ApiResponse<{
					events: Event[];
				}>
			>("/events/current-user", {
				method: "GET",
			});
		},

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
