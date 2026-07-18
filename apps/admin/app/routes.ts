import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
	layout("./routes/public-layout.tsx", [route("sign-in", "./routes/Auth/SignIn.tsx")]),

	layout("./routes/protected-layout.tsx", [
		index("routes/home.tsx"),
		...prefix("students", [index("./routes/Students/students.tsx")]),

		...prefix("societies", [
			index("./routes/Societies/index.tsx"),
			route("create", "./routes/Societies/create-society.tsx"),
			route(":id", "./routes/Societies/society.tsx"),
		]),

		route("events", "./routes/events.tsx"),
	]),
] satisfies RouteConfig;
