import { Navigate, Outlet } from "react-router";
import { useRouteLoaderData } from "react-router";
import SidebarLayout from "~/components/Nav/nav-layout";

export default function ProtectedLayout() {
	const { isAuthenticated } = useRouteLoaderData("root") as { isAuthenticated: boolean };

	if (!isAuthenticated) {
		return <Navigate to="/sign-in" replace />;
	}

	return (
		<SidebarLayout>
			<Outlet />
		</SidebarLayout>
	);
}
