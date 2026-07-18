import { Navigate, useRouteLoaderData } from "react-router";
import type { UserRole } from "@uni-events-hq/db";
import type { loader } from "~/root";
import { toast } from "sonner";

type RoleGuardProps = {
	allowedRoles: UserRole[];
	children: React.ReactNode;
	redirectTo?: string;
};

export function RoleGuard({ allowedRoles, children, redirectTo = "/" }: RoleGuardProps) {
	const rootData = useRouteLoaderData<typeof loader>("root");
	const userRole = rootData?.user?.success ? rootData.user.data.user.role : "student";

	const isAllowed = allowedRoles.includes(userRole);

	if (!isAllowed) {
		toast.error("You do not have permission to access this page.");
		return <Navigate to={redirectTo} replace />;
	}

	return <>{children}</>;
}
