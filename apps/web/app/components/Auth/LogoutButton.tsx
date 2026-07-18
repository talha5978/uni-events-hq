import { useNavigate } from "react-router";
import { createAuthApi } from "~/api/auth.api";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

export function LogoutButton() {
	const navigate = useNavigate();

	async function handleLogout() {
		const authApi = createAuthApi();
		await authApi.logout();
		toast.success("Logged out successfully");
		navigate("/sign-in", { replace: true, state: { from: window.location.pathname } });
	}

	return (
		<Button variant={"destructive"} onClick={handleLogout}>
			Logout
		</Button>
	);
}
