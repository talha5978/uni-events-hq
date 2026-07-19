import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Calendar, MapPin, Clock, QrCode, CheckCircle, DownloadIcon, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createApiClient } from "~/api/client";
import { createEventsApi } from "~/api/events.api";
import QRCODE from "qrcode";
import { format } from "date-fns";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const regId = url.searchParams.get("regId");

	if (!regId) {
		throw new Response("Registration ID is required", { status: 400 });
	}

	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const eventsApi = createEventsApi(client);
	const data = await eventsApi.getRegistration(regId);

	return data;
};

export default function RegistrationSuccessPage() {
	const loaderData = useLoaderData<typeof loader>();

	const data = loaderData.success ? loaderData.data : null;
	const event = data?.event;
	const registration = data?.registration;

	const [isGenerating, setIsGenerating] = useState(false);
	const [qrImage, setQrImage] = useState<string | null>(null);

	if (!event) {
		return <div className="p-8 text-center">Registration not found</div>;
	}

	const handleGenerate = async () => {
		setIsGenerating(true);

		try {
			const qrDataUrl = await QRCODE.toDataURL(data.qrCodeId, {
				width: 300,
				margin: 1,
				errorCorrectionLevel: "H",
			});

			setQrImage(qrDataUrl);
		} catch (error) {
			console.error(error);
			toast.error("Failed to generate QR Code");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = () => {
		if (!qrImage) return;

		const link = document.createElement("a");
		link.href = qrImage;
		link.download = `QR-${data.qrCodeId || "code"}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	useEffect(() => {
		handleGenerate();
	}, []);

	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-2xl mx-auto px-4">
				{registration?.status === "registered" ? (
					<div className="text-center mb-10">
						<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
							<CheckCircle className="w-10 h-10 text-green-600" />
						</div>
						<h1 className="text-4xl font-bold text-green-700">Registration Successful!</h1>
						<p className="text-muted-foreground mt-2">
							Your registration has been successfully submitted
						</p>
					</div>
				) : registration?.status === "pending_verification" ? (
					<div className="text-center mb-10">
						<div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
							<AlertCircle className="w-10 h-10 text-yellow-500" />
						</div>
						<h1 className="text-4xl font-bold text-yellow-500">Pending Verification!</h1>
						<p className="text-muted-foreground mt-2">
							Your registration is under payment verification.
						</p>
					</div>
				) : (
					<></>
				)}

				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="text-2xl">{event.title}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center gap-4 text-lg">
							<Calendar className="h-6 w-6 text-muted-foreground" />
							<div>
								{event.eventDate
									? format(new Date(event.eventDate), "EEEE, dd MMMM yyyy • h:mm a")
									: "Date TBA"}
							</div>
						</div>

						<div className="flex items-center gap-4">
							<MapPin className="h-6 w-6 text-muted-foreground" />
							<div>{event.location || "Location TBA"}</div>
						</div>

						{registration?.selectedTimeslot && (
							<div className="flex items-center gap-4">
								<Clock className="h-6 w-6 text-muted-foreground" />
								<div>
									<strong>Time Slot:</strong>{" "}
									{JSON.parse(registration.selectedTimeslot).startTime} -{" "}
									{JSON.parse(registration.selectedTimeslot).endTime}
								</div>
							</div>
						)}

						{event.isPaid && (
							<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
								<p className="font-medium">Payment Status: Awaiting Verification</p>
								<p className="text-sm text-muted-foreground mt-1">
									Your registration is pending payment confirmation by the society
									treasurer.
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* QR Code */}
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="flex items-center justify-center gap-3">
							<QrCode className="h-6 w-6" />
							Your Event QR Code
						</CardTitle>
						<CardDescription>Show this QR code at the event entrance (if asked)</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center py-8">
						{isGenerating ? (
							<QrCode className="w-36 h-36 animate-pulse" />
						) : (
							<div>
								<div className="bg-white p-2 rounded-xl shadow-sm border mb-6">
									{qrImage && (
										<img src={qrImage} alt="QR Code" className="w-36 h-36 mx-auto" />
									)}
								</div>
								<Button variant="outline" className="w-full" onClick={handleDownload}>
									<DownloadIcon className="w-4 h-4" />
									Download
								</Button>
							</div>
						)}
						<p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
							This QR code is unique to your registration.
							<br />
							Do not share it with others.
						</p>
					</CardContent>
				</Card>

				<div className="flex justify-center sm:flex-row flex-col items-center gap-4 mt-10">
					<Link to="/events" viewTransition>
						<Button variant="outline">Browse More Events</Button>
					</Link>
					<Link to="/my-registrations" viewTransition>
						<Button>View My Registrations</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
