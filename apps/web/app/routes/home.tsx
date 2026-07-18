import { useRouteLoaderData } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
	return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export default function Home() {
	const data = useRouteLoaderData("root");

	return <>{JSON.stringify(data)}</>;
}
