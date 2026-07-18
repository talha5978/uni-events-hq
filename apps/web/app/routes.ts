import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	layout("./routes/public-layout.tsx", [
		route("sign-in", "./routes/Auth/SignIn.tsx"),
		// route("sign-up", "./routes/Auth/SignUp.tsx"),
	]),

	layout("./routes/protected-layout.tsx", [index("routes/home.tsx")]),
] satisfies RouteConfig;
