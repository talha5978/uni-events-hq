import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";

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
			},
		) {
			return await client.request<ApiResponse<{ event: any }>>(`/events/${societyId}`, {
				method: "POST",
				body: JSON.stringify(body),
			});
		},
	};
}
