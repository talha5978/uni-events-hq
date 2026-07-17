import { NavLink, useLocation, useResolvedPath } from "react-router";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { navLinks } from "~/constants/nav";

export function NavMain() {
	const location = useLocation();

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu className="flex flex-col gap-2">
					{navLinks.map((item) => {
						const resolved = useResolvedPath(item.url).pathname;
						let isActive = location.pathname === resolved;

						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									tooltip={item.title}
									className={`w-full ${isActive ? "bg-sidebar-accent" : ""}`}
								>
									<NavLink
										to={item.url}
										prefetch="intent"
										viewTransition
										className={"flex items-center gap-2 rounded-md pl-1 pr-2 py-1"}
									>
										{item.icon && <>{item.icon}</>}
										<span className="my-auto">{item.title}</span>
									</NavLink>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
