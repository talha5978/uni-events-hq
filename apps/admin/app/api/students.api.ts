import type { ApiResponse } from "~/types/response";
import { createApiClient } from "~/api/client";
import type { StudentListResponse } from "~/types/students";

export function createStudentsApi(client = createApiClient()) {
	return {
		client,

		async getAllStudents(
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

			const url = `/students/admin${params.toString() ? `?${params.toString()}` : ""}`;

			return await client.request<ApiResponse<StudentListResponse>>(url, {
				method: "GET",
			});
		},

		async toggleVerification(studentId: string) {
			return await client.request<ApiResponse<null>>(`/students/admin/toggle-verify/${studentId}`, {
				method: "POST",
				body: JSON.stringify({}),
			});
		},
	};
}
