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
								<NavLink to={item.url} prefetch="intent" viewTransition>
									<SidebarMenuButton
										tooltip={item.title}
										className={`cursor-pointer ${isActive ? "bg-sidebar-accent" : ""}`}
									>
										{item.icon && <>{item.icon}</>}
										<span className="my-auto">{item.title}</span>
									</SidebarMenuButton>
								</NavLink>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
