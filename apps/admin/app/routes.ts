import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
	layout("./routes/public-layout.tsx", [route("sign-in", "./routes/Auth/SignIn.tsx")]),

	layout("./routes/protected-layout.tsx", [index("routes/home.tsx")]),
] satisfies RouteConfig;
