import { Navigate, Outlet } from "react-router";
import { useRouteLoaderData } from "react-router";

export default function PublicLayout() {
	const { isAuthenticated } = useRouteLoaderData("root") as { isAuthenticated: boolean };

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
