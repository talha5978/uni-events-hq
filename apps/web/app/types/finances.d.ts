import type { RegistrationStatus } from "@uni-events-hq/db";

export type FinancesResp = {
	registrations: {
		studentId: string | null;
		fullName: string | null;
		email: string | null;
		department: string | null;
		batch: string | null;
		section: string | null;
		registrationId: string;
		transactionProofUrl: string | null;
		status: RegistrationStatus;
		registeredAt: Date;
		paymentVerifiedAt: Date | null;
		eventTitle: string | null;
	}[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		pageCount: number;
	};
};
