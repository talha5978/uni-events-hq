import { Loader, PlusCircle, Building2 } from "lucide-react";
import { Link, useLoaderData, useSearchParams, useNavigation } from "react-router";
import { createApiClient } from "~/api/client";
import { createSocietiesApi } from "~/api/societies.api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const url = new URL(request.url);
	const pageSize = parseInt(url.searchParams.get("pageSize") || "12");

	const societiesApi = createSocietiesApi(client);
	const data = await societiesApi.getAllSocieties({ pageSize });
	return data;
};

export const meta = () => {
	return [
		{
			title: "Societies | Admin Portal",
		},
		{
			name: "description",
			content: "Manage all societies - Verify, Revoke & Monitor",
		},
	];
};

export default function AdminSocietiesPage() {
	const loaderData = useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
	const navigation = useNavigation();

	const societiesData = loaderData.success ? loaderData.data : null;
	const societies = societiesData?.societies ?? [];
	const pagination = societiesData?.pagination;

	const currentPageSize = parseInt(searchParams.get("pageSize") || "12");
	const isLoading = navigation.state === "loading";

	const loadMore = () => {
		const newPageSize = currentPageSize + 12;
		setSearchParams({ pageSize: newPageSize.toString() });
	};

	return (
		<div className="p-6">
			<div className="flex items-center flex-wrap gap-4 justify-between mb-8">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Societies</h1>
					<p className="text-muted-foreground">Manage all university societies</p>
				</div>

				<Link to="/societies/create" className="ml-auto" viewTransition prefetch="intent">
					<Button>
						<PlusCircle className="mr-1 h-4 w-4" />
						Create New Society
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{societies.map((society) => (
					<Card
						key={society.id}
						className="overflow-hidden hover:shadow-lg transition-all duration-200 group pt-0"
					>
						<div className="h-44 bg-muted relative">
							{society.logoUrl ? (
								<img
									src={society.logoUrl}
									alt={society.name}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
									<Building2 className="w-20 h-20 text-primary/30" />
								</div>
							)}
						</div>

						<CardHeader>
							<CardTitle className="line-clamp-2 text-lg">{society.name}</CardTitle>
							{society.category && (
								<p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
									{society.category}
								</p>
							)}
						</CardHeader>

						<CardContent className="pt-0">
							<CardDescription className="line-clamp-4 min-h-20 text-sm">
								{society.description || "No description available for this society."}
							</CardDescription>

							<div className="mt-6">
								<Link to={`/societies/${society.id}`} prefetch="intent">
									<Button variant="outline" className="w-full">
										Manage Society
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{pagination?.hasMore && (
				<div className="flex justify-center mt-12">
					<Button onClick={loadMore} disabled={isLoading} size="lg" variant="outline">
						{isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
						Show More
					</Button>
				</div>
			)}

			{societies.length === 0 && (
				<div className="text-center py-20">
					<Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
					<p className="text-muted-foreground text-lg">No societies found</p>
				</div>
			)}
		</div>
	);
}
