import { useLoaderData, useParams, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Loader, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createApiClient } from "~/api/client";
import { createEventsApi } from "~/api/events.api";
import { createMediaApi } from "~/api/media.api";
import { useState } from "react";
import type { Timeslot } from "@uni-events-hq/db";
import { Label } from "~/components/ui/label";
import { GoogleReCaptcha } from "~/components/ReCaptcha/GoogleReCaptcha";
import { RoleGuard } from "~/components/Auth/RoleGaurd";

const registerSchema = z.object({
	selectedTimeslot: z.string().optional(),
	transactionProof: z.instanceof(File).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const eventsApi = createEventsApi(client);
	const data = await eventsApi.getEventById(params.id!);
	return data;
};

function formatPrice(price: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "PKR",
		minimumFractionDigits: 2,
	}).format(price);
}

export const meta = () => {
	return [{ title: "Register Event | Student Portal" }];
};

export default function EventRegistrationPage() {
	const { id: eventId } = useParams();
	const loaderData = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	const event = loaderData.success ? loaderData.data.event : null;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [proofPreview, setProofPreview] = useState<string | null>(null);
	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

	const form = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			selectedTimeslot: "",
		},
	});

	const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			form.setValue("transactionProof", file);
			const reader = new FileReader();
			reader.onload = () => setProofPreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const onSubmit = async (values: RegisterForm) => {
		if (!recaptchaToken) {
			toast.error("Please wait for reCAPTCHA to load or refresh the page.");
			return;
		}

		setIsSubmitting(true);

		const formData = new FormData();
		formData.append("recaptchaToken", recaptchaToken ?? "");
		const recaptchaResponse = await fetch("/verify-recaptcha", {
			body: formData,
			method: "POST",
		});
		const recaptchaResult = await recaptchaResponse.json();
		if (!recaptchaResult.success) {
			toast.error(recaptchaResult.error);
			setIsSubmitting(false);

			return;
		}

		const client = createApiClient();
		const mediaApi = createMediaApi(client);

		try {
			const payload: {
				timeslot?: string | Timeslot | null;
				transactionProof: string | null;
			} = {
				timeslot: values.selectedTimeslot,
				transactionProof: null,
			};

			if (typeof payload.timeslot === "string" && payload.timeslot.trim() === "") {
				payload.timeslot = null;
			}

			if (values.transactionProof) {
				const res = await mediaApi.upload(values.transactionProof);
				if (res.success) payload.transactionProof = res.data.url;
			}

			const eventsApi = createEventsApi(client);
			const res = await eventsApi.registerEvent(eventId!, payload as any);
			if (res.success) {
				toast.success(res.message);
				navigate("/registration-success?regId=" + res.data.registrationId);
			} else {
				toast.error(res.error.message);
			}
		} catch (error: any) {
			toast.error(error?.message || "Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!event) return <div>Event not found</div>;

	return (
		<RoleGuard
			allowedRoles={event.isMembersOnly ? ["member", "treasurer"] : ["treasurer", "member", "student"]}
		>
			<div className="max-w-7xl mx-auto p-6">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">{event.title}</h1>
					<p className="text-muted-foreground mt-1">
						{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "TBA"} •{" "}
						{event.location}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
					{/* Left: Event Info */}
					<div className="lg:col-span-3">
						{event.bannerUrl && (
							<img
								src={event.bannerUrl}
								alt={event.title}
								className="w-full rounded-xl max-h-96 object-cover mb-6"
							/>
						)}

						<div className="prose">
							<p>{event.description}</p>
						</div>
					</div>

					{/* Right: Registration Form */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle>Register for this Event</CardTitle>
								<CardDescription>Complete the registration below</CardDescription>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
										{/* Timeslot Selection */}
										{event.hasMultipleSlots && (event.timeslots as Timeslot[]) && (
											<FormField
												control={form.control}
												name="selectedTimeslot"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Select Time Slot</FormLabel>
														<Select onValueChange={field.onChange}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Choose a time slot" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{(event.timeslots as Timeslot[]).map(
																	(slot, i: number) => (
																		<SelectItem
																			key={i}
																			value={JSON.stringify(slot)}
																		>
																			{`${slot.startTime} - ${slot.endTime}`}
																		</SelectItem>
																	),
																)}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										)}

										{/* Payment Proof (if paid) */}
										{event.isPaid && event.ticketPrice ? (
											<div>
												<div className="mb-4 space-y-1">
													<Label>Event Fee</Label>
													<span className="text-muted-foreground">
														{formatPrice(Number(event.ticketPrice))}
													</span>
												</div>

												<FormLabel>Payment Proof</FormLabel>
												<div className="border-2 border-dashed rounded-xl p-6 text-center mt-2">
													{proofPreview ? (
														<img
															src={proofPreview}
															alt="Proof"
															className="mx-auto max-h-40 rounded"
														/>
													) : (
														<Upload className="mx-auto h-10 w-10 text-muted-foreground" />
													)}
													<Input
														type="file"
														accept="image/*"
														className="hidden"
														id="proof"
														onChange={handleProofUpload}
													/>
													<Button type="button" variant="outline" className="mt-3">
														<label htmlFor="proof" className="cursor-pointer">
															Upload Transaction Screenshot
														</label>
													</Button>
												</div>
											</div>
										) : (
											<div className="font-semibold text-emerald-500">Free Entry</div>
										)}

										<GoogleReCaptcha
											siteKey={process.env.VITE_RECAPTCHA_SITE_KEY as string}
											onChange={(token) => setRecaptchaToken(token)}
										/>

										<Button
											type="submit"
											className="w-full"
											size="lg"
											disabled={isSubmitting}
										>
											{isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
											{event.isPaid ? "Submit Registration & Proof" : "Register Now"}
										</Button>
									</form>
								</Form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</RoleGuard>
	);
}
