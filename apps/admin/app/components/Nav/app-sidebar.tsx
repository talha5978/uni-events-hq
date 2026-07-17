import { type ComponentProps } from "react";
import { NavMain } from "~/components/Nav/nav-main";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Link } from "react-router";
import { LogoutButton } from "~/components/Auth/LogoutButton";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader className="mb-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<Link to="/" viewTransition prefetch="viewport">
							<div className="w-52 h-fit -mx-9 select-none">
								<img src="/logo.png" className="w-52 h-fit mix-blend-multiply" alt="" />
							</div>
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain />
			</SidebarContent>
			<SidebarFooter className="mt-6">
				<LogoutButton />
			</SidebarFooter>
		</Sidebar>
	);
}
