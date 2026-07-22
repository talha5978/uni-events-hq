import { Navigate, useLoaderData, useRouteLoaderData, type LoaderFunctionArgs } from "react-router";
import {
	Calendar,
	Users,
	CreditCard,
	Plus,
	MapPin,
	CheckCircle2,
	ArrowRight,
	ShieldAlert,
	Sparkles,
	Ticket,
	Clock,
	ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Link } from "react-router";
import { format } from "date-fns";
import { createApiClient } from "~/api/client";
import { createDashboardApi } from "~/api/dashboard.api";
import { RoleGuard } from "~/components/Auth/RoleGaurd";

export async function loader({ request }: LoaderFunctionArgs) {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const dashboardApi = createDashboardApi(client);
	const data = await dashboardApi.getPresidentDashboard();

	return data;
}

export const meta = () => {
	return [
		{
			title: "Student Portal",
		},
	];
};

// Helper for student initials
const getInitials = (name: string) => {
	if (!name) return "ST";
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.substring(0, 2);
};

export default function PresidentDashboard() {
	const rootData = useRouteLoaderData<any>("root");
	const loaderData = useLoaderData<typeof loader>();

	const user = rootData.user?.success ? rootData.user.data.user : null;

	if (user?.role !== "president") {
		return <Navigate to="/events" replace />;
	}

	const data = loaderData.success ? loaderData.data : null;

	if (!data)
		return (
			<div className="flex h-[60vh] items-center justify-center flex-col gap-3 text-muted-foreground">
				<ShieldAlert className="h-10 w-10 text-destructive opacity-80" />
				<p className="font-medium text-destructive">Failed to load president dashboard</p>
			</div>
		);

	const { metrics, recentUpcoming, pendingRegistrations } = data;

	return (
		<RoleGuard allowedRoles={["president"]}>
			<div className="p-4 sm:p-6 lg:p-8 space-y-8">
				{/* Header Area */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<Badge
								variant="outline"
								className="bg-primary/5 text-primary border-primary/20 gap-1.5 font-medium"
							>
								<Sparkles className="w-3.5 h-3.5 text-primary" /> Society President
							</Badge>
						</div>
						<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
							Dashboard
						</h1>
						<p className="text-muted-foreground mt-1">
							Manage society events, members, and payment verifications.
						</p>
					</div>

					<Link to="/society-events/create" viewTransition className="shrink-0">
						<Button
							size="lg"
							className="shadow-md hover:shadow-lg transition-all gap-2 font-semibold w-full sm:w-auto"
						>
							<Plus className="h-5 w-5" />
							Create New Event
						</Button>
					</Link>
				</div>

				{/* Metrics Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
					{/* Total Members */}
					<Card className="relative overflow-hidden border-border/60 bg-card hover:border-purple-500/30 hover:shadow-md transition-all duration-200">
						<CardContent className="p-5 sm:p-6">
							<div className="flex items-center justify-between mb-4">
								<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									Total Members
								</span>
								<div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
									<Users className="h-5 w-5" />
								</div>
							</div>
							<div className="flex items-baseline justify-between">
								<div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
									{metrics.totalMembers.toLocaleString()}
								</div>
								<span className="text-xs text-muted-foreground font-medium">
									Active Enrolled
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Upcoming Events */}
					<Card className="relative overflow-hidden border-border/60 bg-card hover:border-blue-500/30 hover:shadow-md transition-all duration-200">
						<CardContent className="p-5 sm:p-6">
							<div className="flex items-center justify-between mb-4">
								<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									Upcoming Events
								</span>
								<div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
									<Calendar className="h-5 w-5" />
								</div>
							</div>
							<div className="flex items-baseline justify-between">
								<div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
									{metrics.upcomingEvents.toLocaleString()}
								</div>
								<span className="text-xs text-muted-foreground font-medium">Scheduled</span>
							</div>
						</CardContent>
					</Card>

					{/* Pending Payments Alert */}
					<Card className="relative overflow-hidden border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:shadow-md transition-all duration-200">
						<div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
						<CardContent className="p-5 sm:p-6">
							<div className="flex items-center justify-between mb-4">
								<span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
									Pending Payments
								</span>
								<div className="p-2.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
									<CreditCard className="h-5 w-5" />
								</div>
							</div>
							<div className="flex items-baseline justify-between">
								<div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
									{metrics.pendingPayments.toLocaleString()}
								</div>
								<span className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">
									Requires Review
								</span>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Content Sections */}
				<div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
					{/* Upcoming Events Column */}
					<div className="xl:col-span-5 space-y-6">
						<Card className="border-border/60 shadow-sm h-full flex flex-col">
							<CardHeader className="border-b border-border/50 bg-muted/20 pb-4 flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-lg flex items-center gap-2">
										<Calendar className="h-5 w-5 text-primary" />
										Upcoming Events
									</CardTitle>
									<CardDescription>Events organized by your society</CardDescription>
								</div>
								<Link
									to="/society-events"
									viewTransition
									className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
								>
									View All <ChevronRight className="h-3.5 w-3.5" />
								</Link>
							</CardHeader>

							<CardContent className="p-0 flex-1">
								{recentUpcoming.length === 0 ? (
									<div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-55">
										<Calendar className="h-10 w-10 opacity-30 mb-2" />
										<p className="font-medium text-sm">No upcoming events found</p>
										<p className="text-xs text-muted-foreground mt-1">
											Create an event to start gathering registrations.
										</p>
									</div>
								) : (
									<div className="divide-y divide-border/50">
										{recentUpcoming.map((event) => (
											<div
												key={event.id}
												className="p-4 sm:p-5 hover:bg-muted/30 transition-colors flex items-start justify-between gap-4 group"
											>
												<div className="space-y-1.5 flex-1 min-w-0">
													<div className="flex items-center gap-2 flex-wrap">
														<h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
															{event.title}
														</h4>
														<Badge
															variant={event.isPaid ? "secondary" : "outline"}
															className="text-[10px] uppercase h-5 px-1.5 shrink-0"
														>
															{event.isPaid ? "Paid" : "Free"}
														</Badge>
													</div>

													<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
														<div className="flex items-center gap-1">
															<Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
															<span>
																{event.eventDate
																	? format(
																			new Date(event.eventDate),
																			"EEE, MMM d, yyyy",
																		)
																	: "Date TBA"}
															</span>
														</div>
														{event.location && (
															<div className="flex items-center gap-1">
																<MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
																<span className="truncate max-w-35">
																	{event.location}
																</span>
															</div>
														)}
													</div>
												</div>

												<Link
													to={`/society-events/${event.id}/manage`}
													className="shrink-0"
												>
													<Button
														size="icon"
														variant="ghost"
														className="h-8 w-8 opacity-70 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary"
													>
														<ChevronRight className="h-4 w-4" />
													</Button>
												</Link>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Pending Payments Column */}
					<div className="xl:col-span-7 space-y-6">
						<Card className="border-border/60 shadow-sm">
							<CardHeader className="border-b border-border/50 bg-muted/20 pb-4 flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-lg flex items-center gap-2">
										<CreditCard className="h-5 w-5 text-amber-500" />
										Pending Payment Verifications
									</CardTitle>
									<CardDescription>
										Student event payments requiring verification
									</CardDescription>
								</div>
							</CardHeader>

							<CardContent className="p-0">
								{pendingRegistrations.length === 0 ? (
									<div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
										<CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-60 mb-2" />
										<p className="font-semibold text-foreground">All caught up!</p>
										<p className="text-xs text-muted-foreground mt-1">
											There are no pending payments to verify.
										</p>
									</div>
								) : (
									<Table>
										<TableHeader className="bg-muted/10">
											<TableRow>
												<TableHead className="pl-6">Student</TableHead>
												<TableHead>Event</TableHead>
												<TableHead>Date</TableHead>
												<TableHead className="text-right pr-6">Action</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{pendingRegistrations.map((reg) => (
												<TableRow
													key={reg.registrationId}
													className="hover:bg-muted/30 transition-colors"
												>
													<TableCell className="pl-6 py-3.5">
														<div className="flex items-center gap-3">
															<div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/20 shrink-0">
																{getInitials(reg.studentName || "")}
															</div>
															<span className="font-medium text-foreground text-sm">
																{reg.studentName || "Unknown Student"}
															</span>
														</div>
													</TableCell>

													<TableCell>
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
															<Ticket className="h-3.5 w-3.5 text-primary/70 shrink-0" />
															<span className="truncate max-w-37.5 text-foreground">
																{reg.eventTitle || "N/A"}
															</span>
														</div>
													</TableCell>

													<TableCell className="text-xs text-muted-foreground">
														{format(new Date(reg.registeredAt), "MMM d, yyyy")}
													</TableCell>

													<TableCell className="text-right pr-6">
														<Button
															size="sm"
															variant="outline"
															className="h-8 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 border-amber-500/30 text-amber-700 dark:text-amber-400 gap-1.5 text-xs font-semibold"
															asChild
														>
															<Link
																to={`/treasurer/verify/${reg.registrationId}`}
															>
																Verify
																<ArrowRight className="h-3.5 w-3.5" />
															</Link>
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</RoleGuard>
	);
}
