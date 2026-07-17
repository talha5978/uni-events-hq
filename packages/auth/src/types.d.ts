import type { UserRole } from "@uni-events-hq/db";

export type UserPayload = {
	id: string;
	name: string;
	role: UserRole;
	email: string;
};
