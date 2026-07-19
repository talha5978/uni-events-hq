import type { LoaderFunctionArgs } from "react-router";
import { createApiClient } from "~/api/client";
import { createEventsApi } from "~/api/events.api";
import { useLoaderData, Link } from "react-router";
import { Calendar, MapPin, Users, Ticket, Clock, AlertCircle, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import { RoleGuard } from "~/components/Auth/RoleGaurd";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const eventsApi = createEventsApi(client);
	const data = await eventsApi.getMySocietyEvents();

	return data;
};

export const meta = () => {
	return [{ title: "Events | Student Portal" }];
};

const getStatusConfig = (status: string) => {
	switch (status) {
		case "draft":
			return {
				label: "Draft",
				className: "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200",
			};
		case "upcoming":
			return {
				label: "Upcoming",
				className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
			};
		case "ongoing":
			return {
				label: "Ongoing",
				className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
			};
		case "completed":
			return {
				label: "Completed",
				className: "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200",
			};
		case "cancelled":
			return {
				label: "Cancelled",
				className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
			};
		case "cancel_requested":
			return {
				label: "Cancel Requested",
				className: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
			};
		default:
			return { label: status, className: "bg-gray-100 text-gray-700" };
	}
};

export default function SocietyEventsPage() {
	const loaderData = useLoaderData<typeof loader>();
	const events = loaderData.success ? loaderData.data.events : [];

	return (
		<RoleGuard allowedRoles={["president"]}>
			<div className="sm:p-6 p-4 ">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
					<div>
						<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Society Events</h1>
						<p className="text-muted-foreground mt-1">
							Manage and track all your society's events
						</p>
					</div>
					<Link to="create">
						<Button className="w-full sm:w-auto">
							<Calendar className="mr-2 h-5 w-5" />
							Create New Event
						</Button>
					</Link>
				</div>

				{events.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-muted/10">
						<Calendar className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
						<h3 className="text-xl font-medium">No events yet</h3>
						<p className="text-muted-foreground mt-2 max-w-sm text-center">
							You haven't created any events for your society yet. Click the button above to get
							started.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{events.map((event) => {
							const status = getStatusConfig(event.status);

							return (
								<Card
									key={event.id}
									className="pt-0 group flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60"
								>
									{/* Banner Image */}
									<div className="relative h-48 overflow-hidden bg-muted">
										{event.bannerUrl ? (
											<img
												src={event.bannerUrl}
												alt={event.title}
												className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
											/>
										) : (
											<div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-700 flex items-center justify-center">
												<Calendar className="h-16 w-16 text-white/20" />
											</div>
										)}

										{/* Overlay Gradient for readability if needed, though we moved text down */}
										<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

										{/* Floating Status Badge */}
										<div className="absolute top-3 right-3">
											<Badge
												variant="outline"
												className={`font-medium border ${status.className}`}
											>
												{status.label}
											</Badge>
										</div>

										{/* Cancel Request Warning (if applicable) */}
										{event.status === "cancel_requested" && (
											<div className="absolute top-3 left-3">
												<Badge
													variant="destructive"
													className="flex items-center gap-1 shadow-sm"
												>
													<AlertCircle className="w-3 h-3" /> Action Required
												</Badge>
											</div>
										)}
									</div>

									{/* Main Content - flex-grow ensures the footer stays at the bottom */}
									<CardContent className="px-4 py-2 grow flex flex-col">
										<h3 className="font-semibold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-4">
											{event.title}
										</h3>

										{/* Event Metadata (Icon list) */}
										<div className="space-y-2.5 mb-4">
											<div className="flex items-start gap-2.5 text-sm text-muted-foreground">
												<Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
												<span className="leading-tight">
													{event.eventDate
														? format(
																new Date(event.eventDate),
																"EEE, MMM d, yyyy • h:mm a",
															)
														: "Date & Time TBA"}
												</span>
											</div>

											<div className="flex items-start gap-2.5 text-sm text-muted-foreground">
												<MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
												<span className="leading-tight line-clamp-2">
													{event.location || "Location TBA"}
												</span>
											</div>

											{(event.isPaid || event.ticketPrice) && (
												<div className="flex items-center gap-2.5 text-sm text-muted-foreground">
													<Ticket className="w-4 h-4 shrink-0 text-primary/70" />
													<span className="font-medium text-foreground">
														{event.ticketPrice ? event.ticketPrice : "Paid Entry"}
													</span>
												</div>
											)}
										</div>

										{/* Description */}
										<p className="text-sm text-muted-foreground line-clamp-3 mb-4">
											{event.description}
										</p>

										{/* Tags Row - Pushed to the bottom of the content area */}
										<div className="flex flex-wrap gap-2 mt-auto pt-2">
											{event.isMembersOnly && (
												<Badge variant="secondary" className="text-xs font-normal">
													Members Only
												</Badge>
											)}
											{event.maxParticipants && (
												<Badge
													variant="outline"
													className="text-xs font-normal flex items-center gap-1"
												>
													<Users className="h-3 w-3" />
													{event.maxParticipants} max
												</Badge>
											)}
										</div>
									</CardContent>

									<CardFooter className="px-4 pt-0 gap-3">
										<Link
											to={`/society-events/${event.id}/manage`}
											viewTransition
											className="flex-1"
										>
											<Button className="w-full" variant="outline">
												Manage
											</Button>
										</Link>
										<Link
											to={`/event-registrations?eventId=${event.id}`}
											className="flex-1"
											viewTransition
										>
											<Button className="w-full">
												Registrations
												<ArrowUpRight className="w-4 h-4" />
											</Button>
										</Link>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</RoleGuard>
	);
}
