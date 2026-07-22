import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { Event, EventStatus, RegistrationStatus, SocietyBankAccount, Timeslot } from "@uni-events-hq/db";
import type { FinancesResp } from "~/types/finances";

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

		async getEventById(id: string) {
			return await client.request<ApiResponse<{ event: Event; bankAccounts: SocietyBankAccount[] }>>(
				`/events/${id}`,
				{
					method: "GET",
				},
			);
		},

		async updateEvent(
			id: string,
			body: {
				title?: string;
				description?: string;
				eventDate?: string;
				location?: string;
				isMembersOnly?: boolean;
				maxParticipants?: number | null;
				rules?: string[];
				hasMultipleSlots?: boolean;
				timeslots?: Timeslot[] | null;
				bannerUrl?: string | null;
				status?: EventStatus;
			},
		) {
			return await client.request<ApiResponse<{ event: Event }>>(`/events/${id}`, {
				method: "PUT",
				body: JSON.stringify(body),
			});
		},

		async registerEvent(
			eventId: string,
			body: {
				selectedTimeslot: Timeslot | null;
				transactionProof: string | null;
			},
		) {
			return await client.request<
				ApiResponse<{
					registrationId: string;
					qrCodeToken: string;
				}>
			>(`/events/${eventId}/register`, {
				method: "POST",
				body: JSON.stringify(body),
			});
		},

		async getRegistration(regId: string) {
			return await client.request<
				ApiResponse<{
					registration: any;
					event: any;
					qrCodeId: string;
				}>
			>(`/events/registrations/${regId}`, { method: "GET" });
		},

		async getFinances({
			eventId,
			pageIndex,
			pageSize,
			search,
		}: {
			eventId?: string;
			pageIndex?: number;
			pageSize?: number;
			search?: string;
		}) {
			const params = new URLSearchParams();

			if (eventId !== undefined) params.append("eventId", eventId.toString());
			if (pageIndex !== undefined) params.append("pageIndex", pageIndex.toString());
			if (pageSize !== undefined) params.append("pageSize", pageSize.toString());
			if (search !== undefined) params.append("search", search);

			return await client.request<ApiResponse<FinancesResp>>(
				`/events/finances${params.toString() ? `?${params.toString()}` : ""}`,
				{ method: "GET" },
			);
		},

		async updateRegistrationStatus(registrationId: string, status: RegistrationStatus) {
			return await client.request<ApiResponse<null>>(`/events/registrations/${registrationId}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status }),
			});
		},

		async getMyRegistrations() {
			return await client.request<
				ApiResponse<{
					registrations: {
						registrationId: string;
						status: RegistrationStatus;
						selectedTimeslot: unknown;
						registeredAt: Date;
						eventTitle: string | null;
						eventBanner: string | null;
						eventDate: Date | null;
						eventLocation: string | null;
						isPaid: boolean | null;
						qrCodeId: string | null;
					}[];
				}>
			>("/events/my-registrations", { method: "GET" });
		},

		async scanQR(qrCodeId: string) {
			return await client.request<
				ApiResponse<{
					event: {
						id: string | null;
						title: string | null;
						date: Date | null;
						location: string | null;
					};
					student: {
						name: string | null;
						studentId: string | null;
						selectedTimeslot: Timeslot | null;
					};
					status: string;
				}>
			>("/events/scan-qr", {
				method: "POST",
				body: JSON.stringify({ qrCodeId }),
			});
		},
	};
}
