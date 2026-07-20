import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	layout("./routes/public-layout.tsx", [
		route("sign-in", "./routes/Auth/SignIn.tsx"),
		route("sign-up", "./routes/Auth/SignUp.tsx"),
	]),

	layout("./routes/protected-layout.tsx", [
		index("routes/home.tsx"),
		route("my-society", "./routes/Societies/my-society.tsx"),

		route("society-events", "./routes/Events/society-events.tsx"),
		route("society-events/create", "./routes/Events/create-event.tsx"),
		route("society-events/:id/manage", "./routes/Events/update-event.tsx"),

		route("society-members", "./routes/Societies/society-members.tsx"),

		route("events", "./routes/Events/events.tsx"),
		route("register-event/:id", "./routes/Events/register-event.tsx"),
		route("registration-success", "./routes/Events/registration-success.tsx"),

		route("finances", "./routes/Events/finances.tsx"),

		route("society-bank-accounts", "./routes/Societies/society-bank-accounts.tsx"),
	]),

	route("verify-recaptcha", "./routes/verify-recaptcha.ts"),
] satisfies RouteConfig;
