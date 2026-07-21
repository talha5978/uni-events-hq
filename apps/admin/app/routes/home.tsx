import { useLoaderData, useRevalidator, type LoaderFunctionArgs } from "react-router";
import {
	Users,
	Building2,
	Calendar,
	UserCheck,
	Clock,
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	XCircle,
	Ticket,
	ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Link } from "react-router";
import { createApiClient } from "~/api/client";
import { createDashboardApi } from "~/api/dashboard.api";
import { format } from "date-fns";
import { createStudentsApi } from "~/api/students.api";
import { toast } from "sonner";

export const meta = () => [{ title: "Dashboard | Admin Portal" }];

export async function loader({ request }: LoaderFunctionArgs) {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const dashboardApi = createDashboardApi(client);
	const data = await dashboardApi.getDashboard();

	return data;
}

// Helper to get initials for avatars
const getInitials = (name: string) => {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.substring(0, 2);
};

// Helper for dynamic event status badges
const getEventStatusBadge = (status: string) => {
	switch (status.toLowerCase()) {
		case "upcoming":
			return (
				<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
					Upcoming
				</Badge>
			);
		case "ongoing":
			return (
				<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
					Ongoing
				</Badge>
			);
		case "completed":
			return (
				<Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
					Completed
				</Badge>
			);
		case "draft":
			return (
				<Badge variant="outline" className="text-muted-foreground">
					Draft
				</Badge>
			);
		case "cancel_requested":
			return (
				<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
					Cancel Requested
				</Badge>
			);
		case "cancelled":
			return (
				<Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Cancelled</Badge>
			);
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
};

// Helper for dynamic registration status badges
const getRegStatusBadge = (status: string) => {
	switch (status.toLowerCase()) {
		case "registered":
		case "approved":
			return (
				<div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 text-sm font-medium">
					<CheckCircle2 className="h-4 w-4" /> Registered
				</div>
			);
		case "pending":
			return (
				<div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 text-sm font-medium">
					<Clock className="h-4 w-4" /> Pending
				</div>
			);
		case "rejected":
		case "cancelled":
			return (
				<div className="flex items-center gap-1.5 text-red-600 dark:text-red-500 text-sm font-medium">
					<XCircle className="h-4 w-4" /> {status}
				</div>
			);
		default:
			return <Badge variant="outline">{status}</Badge>;
	}
};

export default function AdminDashboard() {
	const loaderData = useLoaderData<typeof loader>();
	const data = loaderData.success ? loaderData.data : null;
	const revalidator = useRevalidator();

	if (!data)
		return (
			<div className="flex h-[60vh] items-center justify-center flex-col gap-3 text-muted-foreground">
				<AlertTriangle className="h-10 w-10 opacity-50" />
				<p>Failed to load dashboard data.</p>
			</div>
		);

	const { metrics, pendingStudents, recentEvents, recentRegistrations } = data;

	async function toggleVerification(studentId: string) {
		const studentsApi = createStudentsApi();
		const resp = await studentsApi.toggleVerification(studentId);
		if (resp.success) {
			toast.success(resp.message);
			revalidator.revalidate();
		} else {
			toast.error(resp.error.message || "Something went wrong. Please try again.");
		}
	}

	return (
		<div className="p-4 sm:p-6 lg:p-8 space-y-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
					<p className="text-muted-foreground mt-1.5">
						Monitor university events, societies, and student activity.
					</p>
				</div>
			</div>

			{/* Metrics Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
				{/* Total Students */}
				<Card className="p-0 relative overflow-hidden border-border/60 bg-card hover:border-blue-500/30 hover:shadow-md transition-all duration-200">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between mb-3">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Total Students
							</span>
							<div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
								<Users className="h-4 w-4" />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
							{metrics.totalStudents.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				{/* Verified Students */}
				<Card className="p-0 relative overflow-hidden border-border/60 bg-card hover:border-emerald-500/30 hover:shadow-md transition-all duration-200">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between mb-3">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Verified
							</span>
							<div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
								<UserCheck className="h-4 w-4" />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">
							{metrics.verifiedStudents.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				{/* Pending Review (Highlighted Alert Card) */}
				<Card className="p-0 relative overflow-hidden border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:shadow-md transition-all duration-200 col-span-2 sm:col-span-1">
					<div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between mb-3">
							<span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
								Pending Review
							</span>
							<div className="p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
								<AlertTriangle className="h-4 w-4" />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
							{metrics.pendingVerifications.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				{/* Societies */}
				<Card className="p-0 relative overflow-hidden border-border/60 bg-card hover:border-purple-500/30 hover:shadow-md transition-all duration-200">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between mb-3">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Societies
							</span>
							<div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
								<Building2 className="h-4 w-4" />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
							{metrics.totalSocieties.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				{/* Events */}
				<Card className="p-0 relative overflow-hidden border-border/60 bg-card hover:border-indigo-500/30 hover:shadow-md transition-all duration-200">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between mb-3">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Events
							</span>
							<div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
								<Calendar className="h-4 w-4" />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
							{metrics.totalEvents.toLocaleString()}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
				{/* Left Column: Actions required & Registrations */}
				<div className="xl:col-span-2 space-y-8">
					{/* Pending Verifications */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 pb-4">
							<div>
								<CardTitle className="text-lg">Action Required: Verifications</CardTitle>
								<CardDescription>Students waiting for account approval</CardDescription>
							</div>
							{pendingStudents.length > 0 && (
								<Link
									to="/students"
									className="text-sm font-medium text-primary hover:underline flex items-center"
								>
									View All <ArrowRight className="h-4 w-4 ml-1" />
								</Link>
							)}
						</CardHeader>
						<CardContent className="p-0">
							{pendingStudents.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground flex flex-col items-center">
									<CheckCircle2 className="h-8 w-8 mb-3 text-emerald-500 opacity-50" />
									<p>All caught up! No pending verifications.</p>
								</div>
							) : (
								<Table>
									<TableHeader className="bg-muted/10">
										<TableRow>
											<TableHead className="pl-6">Student</TableHead>
											<TableHead>Department</TableHead>
											<TableHead>Applied On</TableHead>
											<TableHead className="text-right pr-6">Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingStudents.slice(0, 5).map((student) => (
											<TableRow
												key={student.id}
												className="hover:bg-muted/30 transition-colors"
											>
												<TableCell className="pl-6 py-4">
													<div className="flex items-center gap-3">
														<div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
															{getInitials(student.fullName)}
														</div>
														<div>
															<p className="font-medium text-foreground">
																{student.fullName}
															</p>
															<p className="text-xs text-muted-foreground font-mono mt-0.5">
																{student.studentId || "No ID"}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className="text-sm">
														<p className="font-medium">
															{student.department || "N/A"}
														</p>
														<p className="text-xs text-muted-foreground mt-0.5">
															Batch {student.batch || "N/A"}
														</p>
													</div>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{format(new Date(student.createdAt), "MMM d, yyyy")}
												</TableCell>
												<TableCell className="text-right pr-6">
													<Button
														size="sm"
														variant="secondary"
														className="hover:bg-primary hover:text-primary-foreground transition-colors"
														onClick={() => toggleVerification(student.id)}
														type="button"
													>
														Review
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>

					{/* Recent Registrations */}
					<Card className="border-border/60 shadow-sm">
						<CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
							<CardTitle className="text-lg">Latest Event Registrations</CardTitle>
							<CardDescription>Recent booking activity across all societies</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{recentRegistrations.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">
									No recent registrations found.
								</div>
							) : (
								<div className="divide-y divide-border/50">
									{recentRegistrations.slice(0, 6).map((reg) => (
										<div
											key={reg.registrationId}
											className="flex items-center justify-between p-4 sm:px-6 hover:bg-muted/20 transition-colors"
										>
											<div className="flex items-start gap-4">
												<div className="mt-1 h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
													<Ticket className="h-4 w-4 text-muted-foreground" />
												</div>
												<div>
													<p className="font-medium text-foreground">
														{reg.studentName || "Unknown Student"}
													</p>
													<p className="text-sm text-muted-foreground mt-0.5">
														{reg.eventTitle || "Unknown Event"}
													</p>
													<p className="text-xs text-muted-foreground/70 mt-1">
														{format(new Date(reg.registeredAt), "MMM d, h:mm a")}
													</p>
												</div>
											</div>
											<div className="ml-4 shrink-0">
												{getRegStatusBadge(reg.status)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Events Feed */}
				<div className="xl:col-span-1">
					<Card className="border-border/60 shadow-sm h-full">
						<CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
							<CardTitle className="text-lg">Recent Events</CardTitle>
							<CardDescription>Latest events created</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							{recentEvents.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">No events found.</div>
							) : (
								<div className="divide-y divide-border/50">
									{recentEvents.slice(0, 7).map((event) => (
										<Link
											key={event.id}
											to={`/admin/events/${event.id}`}
											className="group flex flex-col p-5 hover:bg-muted/30 transition-colors"
										>
											<div className="flex justify-between items-start mb-2">
												{getEventStatusBadge(event.status)}
												<ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
											</div>

											<h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
												{event.title}
											</h4>

											<div className="mt-2 space-y-1.5">
												<div className="flex items-center text-sm text-muted-foreground">
													<Building2 className="h-3.5 w-3.5 mr-2 shrink-0" />
													<span className="truncate">
														{event.societyName || "General"}
													</span>
												</div>
												<div className="flex items-center text-sm text-muted-foreground">
													<Calendar className="h-3.5 w-3.5 mr-2 shrink-0" />
													<span>
														{event.eventDate
															? format(new Date(event.eventDate), "MMM d, yyyy")
															: "TBA"}
													</span>
												</div>
											</div>
										</Link>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
