import { Navigate, Outlet } from "react-router";
import { useRouteLoaderData } from "react-router";
import SidebarLayout from "~/components/Nav/nav-layout";
import type { loader } from "~/root";

export default function ProtectedLayout() {
	const rootData = useRouteLoaderData<typeof loader>("root");

	if (!rootData?.isAuthenticated) {
		return <Navigate to="/sign-in" replace />;
	}

	const user = rootData.user?.success ? rootData.user.data.user : null;

	if (!user) {
		return <Navigate to="/sign-in" replace />;
	}

	return (
		<SidebarLayout>
			<Outlet />
		</SidebarLayout>
	);
}
