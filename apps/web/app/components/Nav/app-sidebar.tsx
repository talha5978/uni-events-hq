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
import QrScannerButton from "~/components/QrScannerButton";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader className="mb-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<Link to="/" viewTransition prefetch="viewport">
							<div className="w-44 h-fit select-none">
								<img src="/logo.png" className="w-44 h-fit mix-blend-multiply" alt="" />
							</div>
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain />
			</SidebarContent>
			<SidebarFooter className="mt-6 space-y-3">
				<QrScannerButton />
				<LogoutButton />
			</SidebarFooter>
		</Sidebar>
	);
}
