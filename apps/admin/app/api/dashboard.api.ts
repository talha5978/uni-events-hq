import type { EventStatus, RegistrationStatus } from "@uni-events-hq/db";
import { createApiClient } from "~/api/client";
import type { ApiResponse } from "~/types/response";

export function createDashboardApi(client = createApiClient()) {
	return {
		client,

		async getDashboard() {
			return await client.request<
				ApiResponse<{
					metrics: {
						totalStudents: number;
						verifiedStudents: number;
						pendingVerifications: number;
						totalSocieties: number;
						totalEvents: number;
					};
					pendingStudents: {
						id: string;
						fullName: string;
						email: string;
						studentId: string | null;
						department: string | null;
						batch: string | null;
						createdAt: Date;
					}[];
					recentEvents: {
						id: string;
						title: string;
						eventDate: Date | null;
						status: EventStatus;
						societyName: string | null;
					}[];
					recentRegistrations: {
						registrationId: string;
						status: RegistrationStatus;
						registeredAt: Date;
						studentName: string | null;
						eventTitle: string | null;
					}[];
				}>
			>("/dashboard/admin", { method: "GET" });
		},
	};
}
