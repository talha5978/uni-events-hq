import { useLoaderData, Link, type LoaderFunctionArgs, useRevalidator } from "react-router";
import { Building2, CreditCard, Calendar, ArrowUpRightFromSquare } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { createApiClient } from "~/api/client";
import { createSocietiesApi } from "~/api/societies.api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Society } from "@uni-events-hq/db";
import UpdateSocietySheet from "~/components/Society/EditSocietySheet";
import { RoleGuard } from "~/components/Auth/RoleGaurd";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const societiesApi = createSocietiesApi(client);
	const data = await societiesApi.getById();

	return data;
};

export const meta = () => {
	return [{ title: "Society Details | Admin Portal" }];
};

export default function SocietyDetailPage() {
	const revalidator = useRevalidator();
	const loaderData = useLoaderData<typeof loader>();
	const societyData = loaderData.success ? loaderData.data : null;
	const [initialData, setInitialData] = useState<Society | null>(null);

	if (!societyData) {
		return <div className="p-8 text-center">Society not found</div>;
	}

	const { society, bankAccounts, events } = societyData;

	async function handleSocietyFetch() {
		const societyApi = createSocietiesApi();
		const d = await societyApi.getSocietyForEdit(society.id);
		if (d.success) {
			setInitialData(d.data.society);
		} else {
			toast.error("Error fetching society");
			return;
		}

		setInitialData(d.data.society);
	}

	useEffect(() => {
		handleSocietyFetch();
	}, []);

	return (
		<RoleGuard allowedRoles={["president"]}>
			<div className="p-6 max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between flex-wrap gap-4 mb-8">
					<div>
						<h1 className="text-4xl font-bold tracking-tight">{society.name}</h1>
						<p className="text-muted-foreground flex items-center gap-2 mt-1">
							{society.category && <Badge variant="secondary">{society.category}</Badge>}
							<span>Created {new Date(society.createdAt).toLocaleDateString()}</span>
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Link to="/society-events" viewTransition>
							<Button variant={"outline"}>
								<ArrowUpRightFromSquare className="mr-2 h-4 w-4" />
								Events
							</Button>
						</Link>
						{initialData && (
							<UpdateSocietySheet
								initialData={initialData}
								societyId={society.id}
								onSuccess={() => {
									revalidator.revalidate();
								}}
							/>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* Left Column - Visual + Info */}
					<div className="lg:col-span-5 space-y-6">
						<Card className="pt-0">
							<div className="h-80 relative rounded-t-xl overflow-hidden">
								{society.bannerUrl ? (
									<img
										src={society.bannerUrl}
										alt="Banner"
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full bg-linear-to-br from-primary/20 to-muted" />
								)}
							</div>
							<div className="flex justify-center -mt-12 relative z-10">
								{society.logoUrl ? (
									<img
										src={society.logoUrl}
										alt={society.name}
										className="w-28 h-28 rounded-2xl border-4 border-background shadow-lg object-cover"
									/>
								) : (
									<div className="w-28 h-28 rounded-2xl bg-muted flex items-center justify-center border-4 border-background">
										<Building2 className="w-14 h-14 text-muted-foreground" />
									</div>
								)}
							</div>
							<CardContent className="pt-5 text-center">
								<p className="text-muted-foreground text-sm leading-relaxed">
									{society.description || "No description available."}
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Details */}
					<div className="lg:col-span-7 space-y-6">
						{/* Bank Accounts */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<CreditCard className="h-5 w-5" />
									Bank Accounts
								</CardTitle>
							</CardHeader>
							<CardContent>
								{bankAccounts.length > 0 ? (
									<div className="space-y-3">
										{bankAccounts.map((acc) => (
											<div key={acc.id} className="p-4 border rounded-lg">
												<div className="font-medium">{acc.accountTitle}</div>
												<div className="text-sm text-muted-foreground mt-1">
													{acc.bankName} • {acc.accountNumber}
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-muted-foreground text-center py-8">
										No bank accounts added yet.
									</p>
								)}
							</CardContent>
						</Card>

						{/* Ongoing / Upcoming Events */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Calendar className="h-5 w-5" />
									Events
								</CardTitle>
							</CardHeader>
							<CardContent>
								{events.length > 0 ? (
									<div className="space-y-4">
										{events.map((event) => (
											<div key={event.id} className="border rounded-lg p-4">
												<div className="flex justify-between items-start">
													<div>
														<h4 className="font-semibold">{event.title}</h4>
														{event.eventDate && (
															<p className="text-sm text-muted-foreground mt-1">
																{new Date(
																	event.eventDate,
																).toLocaleDateString()}{" "}
																• {event.location}
															</p>
														)}
													</div>
													<Badge>{event.status}</Badge>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-muted-foreground py-8 text-center">No events yet</p>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</RoleGuard>
	);
}
