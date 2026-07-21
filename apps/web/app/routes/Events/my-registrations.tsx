import { useEffect, useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Calendar, MapPin, QrCode, Clock, Ticket, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import QRCODE from "qrcode";
import { format } from "date-fns";
import { createApiClient } from "~/api/client";
import { createEventsApi } from "~/api/events.api";
import type { RegistrationStatus, Timeslot } from "@uni-events-hq/db";
import { RoleGuard } from "~/components/Auth/RoleGaurd";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const eventsApi = createEventsApi(client);
	const data = await eventsApi.getMyRegistrations();

	return data;
};

function TicketQRCode({ qrCodeId }: { qrCodeId: string }) {
	const [qrUrl, setQrUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!qrCodeId) return;

		QRCODE.toDataURL(qrCodeId, {
			width: 200,
			margin: 1,
			color: {
				dark: "#0f172a",
				light: "#ffffff",
			},
			errorCorrectionLevel: "H",
		})
			.then(setQrUrl)
			.catch(console.error);
	}, [qrCodeId]);

	if (!qrUrl) {
		return <div className="w-32 h-32 bg-muted/60 animate-pulse rounded-lg mx-auto" />;
	}

	return (
		<div className="bg-white p-2 rounded-xl shadow-sm border inline-block">
			<img src={qrUrl} alt="Ticket QR Code" className="w-28 h-28 mx-auto rounded-lg" />
		</div>
	);
}

const getStatusBadge = (status: RegistrationStatus) => {
	switch (status) {
		case "registered":
		case "attended":
			return (
				<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 gap-1.5 flex items-center">
					<CheckCircle2 className="w-3.5 h-3.5" />
					{status.toUpperCase()}
				</Badge>
			);
		case "pending_verification":
			return (
				<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 gap-1.5 flex items-center">
					<Clock className="w-3.5 h-3.5" />
					PENDING PAYMENT
				</Badge>
			);
		case "cancelled":
			return (
				<Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 gap-1.5 flex items-center">
					<AlertCircle className="w-3.5 h-3.5" />
					CANCELLED
				</Badge>
			);
		default:
			return <Badge variant="outline">{status.replace("_", " ").toUpperCase()}</Badge>;
	}
};

export default function MyRegistrationsPage() {
	const loaderData = useLoaderData<typeof loader>();
	const registrations = loaderData.success ? loaderData.data.registrations : [];

	return (
		<RoleGuard allowedRoles={["student", "treasurer", "member"]}>
			<div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
				{/* Page Header */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
					<div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shrink-0 w-fit">
						<Ticket className="h-7 w-7 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">My Registrations</h1>
						<p className="text-muted-foreground mt-1">
							Access your event tickets and check your registration status.
						</p>
					</div>
				</div>
				{/* Empty State */}
				{registrations.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 px-4 border-2 border-dashed border-border/60 rounded-2xl bg-muted/10 text-center">
						<div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-5">
							<QrCode className="h-8 w-8 text-muted-foreground/60" />
						</div>
						<h3 className="text-xl font-semibold mb-2">No registrations yet</h3>
						<p className="text-muted-foreground max-w-sm mx-auto mb-6">
							You haven't registered for any events yet. Browse the events page to find upcoming
							activities.
						</p>
					</div>
				) : (
					/* Tickets Grid */
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{registrations.map((reg) => {
							const timeslot = reg.selectedTimeslot as Timeslot | null;
							return (
								<Card
									key={reg.registrationId}
									className="relative overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 border-border/60 bg-card group pt-0"
								>
									{/* Banner Area */}
									<div className="relative h-40 bg-muted shrink-0">
										{reg.eventBanner ? (
											<img
												src={reg.eventBanner}
												alt={reg.eventTitle || "Event Banner"}
												className="w-full h-full object-cover transition-transform duration-500"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center bg-slate-800">
												<Calendar className="h-10 w-10 text-white/20" />
											</div>
										)}
										<div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
										<div className="absolute bottom-4 left-4 right-4">
											<h3 className="font-semibold text-xl text-white line-clamp-1 leading-tight shadow-sm">
												{reg.eventTitle}
											</h3>
										</div>
									</div>
									{/* Event Details */}
									<div className="p-5 flex-1 space-y-4">
										<div className="space-y-3">
											<div className="flex items-start gap-3 text-sm text-muted-foreground">
												<Calendar className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
												<span className="leading-tight">
													{reg.eventDate
														? format(
																new Date(reg.eventDate),
																"EEE, MMM d, yyyy • h:mm a",
															)
														: "Date & Time TBA"}
												</span>
											</div>
											{reg.eventLocation && (
												<div className="flex items-start gap-3 text-sm text-muted-foreground">
													<MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
													<span className="leading-tight line-clamp-2">
														{reg.eventLocation}
													</span>
												</div>
											)}
											{timeslot && (
												<div className="flex items-start gap-3 text-sm text-muted-foreground">
													<Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
													<span className="leading-tight">
														{timeslot.startTime} - {timeslot.endTime}
													</span>
												</div>
											)}
										</div>
									</div>
									{/* Ticket Divider (Dashed Line with semi-circle cutouts) */}
									<div className="relative flex items-center">
										<div className="absolute -left-3 w-6 h-6 bg-background rounded-full border-r border-border shadow-inner z-10" />
										<div className="w-full border-t-2 border-dashed border-border/60" />
										<div className="absolute -right-3 w-6 h-6 bg-background rounded-full border-l border-border shadow-inner z-10" />
									</div>
									{/* Ticket Stub (QR Code & Status) */}
									<div className="bg-muted/30 p-6 flex flex-col items-center justify-center gap-4 shrink-0">
										{reg.qrCodeId ? (
											<TicketQRCode qrCodeId={reg.qrCodeId} />
										) : (
											<div className="w-28 h-28 bg-muted/50 border border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground text-center p-2">
												No QR available
											</div>
										)}
										{getStatusBadge(reg.status)}
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</RoleGuard>
	);
}
