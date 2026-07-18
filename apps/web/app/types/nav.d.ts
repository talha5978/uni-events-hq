import type { UserRole } from "@uni-events-hq/db";

export interface NavItem {
	title: string;
	url: string;
	icon: JSX.Element;
	allowedRoles?: UserRole[];
}
