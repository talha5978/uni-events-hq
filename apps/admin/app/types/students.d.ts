import type { RawUserRole } from "@uni-events-hq/db";

export type Student = {
	id: string;
	fullName: string;
	email: string;
	avatarUrl: string | null;
	role: RawUserRole;
	studentId: string;
	department: string;
	batch: string;
	section: string;
	isVerified: boolean;
	createdAt: Date;
}[];

export type StudentListResponse = {
	students: Student;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		pageCount: number;
	};
};
