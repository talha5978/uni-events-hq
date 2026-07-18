import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	layout("./routes/public-layout.tsx", [
		route("sign-in", "./routes/Auth/SignIn.tsx"),
		// route("sign-up", "./routes/Auth/SignUp.tsx"),
	]),

	layout("./routes/protected-layout.tsx", [
		index("routes/home.tsx"),
		route("my-society", "./routes/Societies/my-society.tsx"),

		route("society-events", "./routes/Events/society-events.tsx"),
		route("society-events/create", "./routes/Events/create-event.tsx"),

		route("society-members", "./routes/Societies/society-members.tsx"),
	]),
] satisfies RouteConfig;
