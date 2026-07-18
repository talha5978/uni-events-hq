import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { Society, SocietyRole } from "@uni-events-hq/db";
import type { SocietiesResponse, SocietyDetails } from "~/types/societies";
import type { StudentsListMin } from "~/types/students";

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

			const url = `/societies/list${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<ApiResponse<SocietiesResponse>>(url, {
				method: "GET",
			});
		},

		async getById(id: string) {
			return await client.request<ApiResponse<SocietyDetails>>(`/societies/admin/${id}`, {
				method: "GET",
			});
		},

		async getAvailableStudents(
			societyId: string,
			query: {
				pageIndex?: number;
				pageSize?: number;
				search?: string;
			} = {},
		) {
			const params = new URLSearchParams();

			if (query.pageIndex !== undefined) params.append("pageIndex", query.pageIndex.toString());
			if (query.pageSize !== undefined) params.append("pageSize", query.pageSize.toString());
			if (query.search) params.append("search", query.search);

			const url = `/students/admin/${societyId}/available-students${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<ApiResponse<StudentsListMin>>(url, { method: "GET" });
		},

		async getSocietyMembers(societyId: string) {
			return await client.request<
				ApiResponse<{
					members: {
						id: string;
						fullName: string;
						email: string;
						studentId: string | null;
						department: string | null;
						batch: string | null;
						societyRole: SocietyRole;
					}[];
				}>
			>(`/societies/admin/${societyId}/members`, {
				method: "GET",
			});
		},

		async manageMember(
			societyId: string,
			body: {
				userId: string;
				role: SocietyRole;
				action: "add" | "remove";
			},
		) {
			return await client.request<ApiResponse<{ success: boolean }>>(
				`/societies/${societyId}/members`,
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);
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
	};
}
