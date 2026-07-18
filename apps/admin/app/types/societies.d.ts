import type { Event, Society, SocietyBankAccount } from "@uni-events-hq/db";

export type SocietiesResponse = {
	societies: Array<{
		id: string;
		name: string;
		description: string | null;
		logoUrl: string | null;
		category: string | null;
		createdAt: Date;
	}>;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		hasMore: boolean;
	};
};

export type SocietyDetails = {
	society: Society;
	bankAccounts: SocietyBankAccount[];
	members: {
		id: string;
		role: "president" | "treasurer" | "member";
		joinedAt: Date;
		user: {
			id: string;
			fullName: string;
			email: string;
			studentId: string | null;
			avatarUrl: string | null;
		} | null;
	}[];
	events: Event[];
	membersCount: number;
	hasMoreMembers: boolean;
};
