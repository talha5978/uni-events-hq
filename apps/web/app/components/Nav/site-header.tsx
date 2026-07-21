import type { RawUserRole } from "@uni-events-hq/db";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createAuthApi } from "~/api/auth.api";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SidebarTrigger } from "~/components/ui/sidebar";

export function SiteHeader() {
	return (
		<header className="flex h-[2.7rem] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[2.7rem]">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1 cursor-pointer" />
				<div className="ml-auto gap-2">
					<UserButton />
				</div>
			</div>
		</header>
	);
}

function UserButton() {
	const [user, setUser] = useState<{
		id: string;
		email: string;
		fullName: string;
		studentId: string | null;
		role: RawUserRole;
		avatarUrl: string | null;
	} | null>(null);

	useEffect(() => {
		async function fetchDetails() {
			const api = createAuthApi();
			const userData = await api.myDetails();
			setUser(userData.success ? userData.data.user : null);
		}

		fetchDetails();
	}, []);

	const navigate = useNavigate();

	async function handleLogout() {
		const authApi = createAuthApi();
		await authApi.logout();
		toast.success("Logged out successfully");
		navigate("/sign-in", { replace: true, state: { from: window.location.pathname } });
	}

	if (!user) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild className="hover:bg-none hover:shadow-none">
				<Button variant="ghost" size={"icon-xs"} className="relative rounded-full">
					<Avatar>
						{user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
						<AvatarFallback>
							{user.fullName.split(" ")[0][0] + user.fullName.split(" ")[1][0] || "U"}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-72" align="end">
				<DropdownMenuLabel className="flex flex-col">
					<span className="font-bold">{user.fullName}</span>
					<span className="text-xs text-muted-foreground">{user.email}</span>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<div className="px-2 py-1.5">
					<div className="flex items-center gap-2 text-sm">
						<Badge variant="outline" className="capitalize">
							{user.role.replace("_", " ").toUpperCase()}
						</Badge>
						{user.studentId && (
							<span className="text-xs text-muted-foreground">{user.studentId}</span>
						)}
					</div>
				</div>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
					<LogOut className="mr-2 h-4 w-4" />
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
