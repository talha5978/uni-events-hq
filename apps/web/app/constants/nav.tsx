import { LayoutDashboard, Building2, Calendar, Clock, Users, Settings } from "lucide-react";
import type { NavItem } from "~/types/nav";

export const navLinks: NavItem[] = [
	{
		title: "Home",
		url: "/",
		icon: <LayoutDashboard size={18} />,
	},
	{
		title: "Events",
		url: "/events",
		icon: <Calendar size={18} />,
		allowedRoles: ["treasurer", "student", "member"],
	},
	{
		title: "Events",
		url: "/society-events",
		icon: <Calendar size={18} />,
		allowedRoles: ["president"],
	},
	{
		title: "My Registrations",
		url: "/my-registrations",
		icon: <Clock size={18} />,
		allowedRoles: ["member", "student", "treasurer"],
	},

	{
		title: "Societies",
		url: "/societies",
		icon: <Building2 size={18} />,
		allowedRoles: ["member", "student", "treasurer"],
	},

	{
		title: "My Society",
		url: "/my-society",
		icon: <Building2 size={18} />,
		allowedRoles: ["president"],
	},

	{
		title: "Society Members",
		url: "/society-members",
		icon: <Users size={18} />,
		allowedRoles: ["president", "treasurer", "member"],
	},

	{
		title: "Finances",
		url: "/finances",
		icon: <Settings size={18} />,
		allowedRoles: ["president", "treasurer"],
	},
];
