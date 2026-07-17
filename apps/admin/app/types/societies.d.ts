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
