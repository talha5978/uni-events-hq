import type { RegistrationStatus } from "@uni-events-hq/db";
import { createApiClient } from "~/api/client";
import type { ApiResponse } from "~/types/response";

export function createDashboardApi(client = createApiClient()) {
	return {
		client,

		async getPresidentDashboard() {
			return await client.request<
				ApiResponse<{
					metrics: {
						totalMembers: number;
						upcomingEvents: number;
						pendingPayments: number;
					};
					recentUpcoming: {
						id: string;
						title: string;
						eventDate: Date | null;
						location: string | null;
						isPaid: boolean | null;
					}[];
					pendingRegistrations: {
						registrationId: string;
						status: RegistrationStatus;
						registeredAt: Date;
						studentName: string | null;
						eventTitle: string | null;
					}[];
				}>
			>("/dashboard/president", { method: "GET" });
		},
	};
}
