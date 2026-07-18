import type { SocietyRole } from "@uni-events-hq/db";

export type SocietyMembersResponse = {
	members: {
		id: string;
		role: SocietyRole;
		joinedAt: Date;
		fullName: string | null;
		studentId: string | null;
		batch: string | null;
		department: string | null;
	}[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		pageCount: number;
		hasMore: boolean;
	};
};
