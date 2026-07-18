import { LayoutDashboard, Users, Building2, Calendar, FileText } from "lucide-react";
import type { NavItem } from "~/types/nav";

export const navLinks: NavItem[] = [
	{
		title: "Dashboard",
		url: "/",
		icon: <LayoutDashboard size={18} />,
	},
	{
		title: "Students",
		url: "/students",
		icon: <Users size={18} />,
	},
	{
		title: "Societies",
		url: "/societies",
		icon: <Building2 size={18} />,
	},
	{
		title: "Events",
		url: "/events",
		icon: <Calendar size={18} />,
	},
	{
		title: "Reports",
		url: "/reports",
		icon: <FileText size={18} />,
	},
];
