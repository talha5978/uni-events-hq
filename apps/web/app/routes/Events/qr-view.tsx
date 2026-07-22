import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Calendar, MapPin, Clock, IdCard, CheckCircle2, XCircle, TicketCheck } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { format } from "date-fns";
import { createApiClient } from "~/api/client";
import { createEventsApi } from "~/api/events.api";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	if (!params.id) {
		return null;
	}

	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const eventsApi = createEventsApi(client);
	const data = await eventsApi.scanQR(params.id!);
	return data;
};

export function ErrorBoundary() {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<p className="text-destructive">Invalid or expired QR Code</p>
		</div>
	);
}

export const meta = () => {
	return [{ title: "View QR | Student Portal" }];
};

// Helper for generating student initials
const getInitials = (name: string | null) => {
	if (!name) return "ST";
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.substring(0, 2);
};

export default function QRViewPage() {
	const loaderData = useLoaderData<typeof loader>();
	const data = loaderData?.success ? loaderData.data : null;

	// Error State
	if (!data) {
		return (
			<div className="min-h-[100dvh] flex items-center justify-center p-4 bg-muted/20">
				<Card className="w-full max-w-sm border-destructive/20 shadow-lg">
					<CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
						<div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
							<XCircle className="w-8 h-8 text-destructive" />
						</div>
						<h2 className="text-2xl font-bold text-foreground">Invalid QR Code</h2>
						<p className="text-muted-foreground mt-2">
							This code is invalid, expired, or has already been used.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { event, student } = data;

	return (
		<div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6">
			{/* Digital Ticket Card */}
			<div className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden flex flex-col relative">
				{/* Success Header (Top of Ticket) */}
				<div className="bg-emerald-500 dark:bg-emerald-600 p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
					{/* Background subtle pattern/glow */}
					<div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]" />

					<div className="relative z-10 flex flex-col items-center">
						<div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm animate-in zoom-in duration-500">
							<TicketCheck className="w-10 h-10 text-white" />
						</div>
						<h1 className="text-2xl font-extrabold tracking-tight">Entry Verified</h1>
						<div className="flex items-center gap-1.5 mt-1 text-emerald-50 font-medium text-sm bg-black/10 px-3 py-1 rounded-full">
							<CheckCircle2 className="w-4 h-4" />
							<span>Marked as Attended</span>
						</div>
					</div>
				</div>

				{/* Ticket Body */}
				<div className="p-6 sm:p-8 flex flex-col relative">
					{/* Student Info */}
					<div className="flex flex-col items-center text-center -mt-12 relative z-20 mb-6">
						<div className="w-20 h-20 bg-background rounded-full border-4 border-card flex items-center justify-center shadow-sm">
							<div className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
								{getInitials(student.name)}
							</div>
						</div>
						<h2 className="text-xl font-bold text-foreground mt-3">
							{student.name || "Unknown Student"}
						</h2>
						<div className="flex items-center gap-1.5 text-muted-foreground mt-1 text-sm font-medium">
							<IdCard className="w-4 h-4 shrink-0" />
							<span>{student.studentId || "No ID Provided"}</span>
						</div>
					</div>

					{/* Perforated Divider */}
					<div className="relative flex items-center justify-center my-2">
						<div className="absolute w-[120%] border-t-2 border-dashed border-border/60" />
						<div className="absolute -left-8 w-6 h-6 bg-zinc-50 dark:bg-zinc-950 rounded-full border-r border-border/50" />
						<div className="absolute -right-8 w-6 h-6 bg-zinc-50 dark:bg-zinc-950 rounded-full border-l border-border/50" />
					</div>

					{/* Event Details */}
					<div className="mt-6 space-y-4">
						<h3 className="font-semibold text-lg text-foreground text-center mb-5 line-clamp-2">
							{event.title || "Unnamed Event"}
						</h3>

						<div className="grid gap-4 bg-muted/30 rounded-xl p-4 border border-border/50">
							<div className="flex items-start gap-3">
								<Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
								<div>
									<p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
										Date
									</p>
									<p className="text-sm font-medium text-foreground">
										{event.date
											? format(new Date(event.date), "EEE, dd MMM yyyy")
											: "TBA"}
									</p>
								</div>
							</div>

							{/* Dynamically render timeslot if it exists */}
							{student.selectedTimeslot && (
								<div className="flex items-start gap-3">
									<Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
									<div>
										<p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
											Timeslot
										</p>
										<p className="text-sm font-medium text-foreground">
											{/* Adjust this logic based on your Timeslot interface */}
											{(student.selectedTimeslot as any).startTime ||
												student.selectedTimeslot.toString()}
										</p>
									</div>
								</div>
							)}

							{event.location && (
								<div className="flex items-start gap-3">
									<MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
									<div>
										<p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
											Location
										</p>
										<p className="text-sm font-medium text-foreground break-words pr-2">
											{event.location}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Footer Metadata */}
			<div className="mt-6 text-center">
				<p className="text-xs text-muted-foreground/70 font-medium">
					Verified securely via UniEvents HQ
				</p>
				<p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-widest font-mono">
					TIMESTAMP: {format(new Date(), "HH:mm:ss")}
				</p>
			</div>
		</div>
	);
}
