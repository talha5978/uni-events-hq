import { useLoaderData, useParams, useNavigate, type LoaderFunctionArgs } from "react-router";
import {
	Loader,
	Upload,
	Calendar as CalendarIcon,
	MapPin,
	CheckCircle2,
	ShieldAlert,
	Landmark,
	Copy,
	Info,
	Receipt,
	Ticket,
	Users,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
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
import { format } from "date-fns";

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
		minimumFractionDigits: 0,
	}).format(price);
}

export const meta = () => {
	return [{ title: "Register Event | Student Portal" }];
};

export default function EventRegistrationPage() {
	const { id: eventId } = useParams();
	const loaderData = useLoaderData<typeof loader>();
	const navigate = useNavigate();
	console.log(loaderData);

	const event = loaderData.success ? loaderData.data.event : null;
	const bankAccounts = loaderData.success ? loaderData.data.bankAccounts : [];

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

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Account number copied!");
	};

	const onSubmit = async (values: RegisterForm) => {
		if (!recaptchaToken) {
			toast.error("Please wait for reCAPTCHA to load or refresh the page.");
			return;
		}

		if (event?.isPaid && !values.transactionProof) {
			toast.error("Please upload the payment transaction proof.");
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

	if (!event)
		return (
			<div className="flex h-[60vh] items-center justify-center flex-col gap-3 text-muted-foreground">
				<ShieldAlert className="h-10 w-10 opacity-50" />
				<p>Event not found or has been removed.</p>
			</div>
		);

	return (
		<RoleGuard
			allowedRoles={event.isMembersOnly ? ["member", "treasurer"] : ["treasurer", "member", "student"]}
		>
			<div className="p-4 sm:p-6 lg:p-8">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
					{/* LEFT COLUMN: Event Details */}
					<div className="lg:col-span-7 xl:col-span-8 space-y-8">
						{/* Banner */}
						<div className="relative rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm aspect-video sm:aspect-21/9 lg:aspect-video">
							{event.bannerUrl ? (
								<img
									src={event.bannerUrl}
									alt={event.title}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white/40">
									<CalendarIcon className="h-16 w-16 mb-4" />
									<span className="font-medium tracking-widest uppercase text-sm">
										Event Banner
									</span>
								</div>
							)}

							{/* Badges Overlay */}
							<div className="absolute top-4 left-4 flex flex-wrap gap-2">
								{event.isMembersOnly && (
									<Badge className="bg-primary text-primary-foreground shadow-md backdrop-blur-md">
										Members Only
									</Badge>
								)}
								<Badge variant="secondary" className="shadow-md backdrop-blur-md font-medium">
									{event.isPaid && event.ticketPrice
										? formatPrice(Number(event.ticketPrice))
										: "Free Entry"}
								</Badge>
							</div>
						</div>

						{/* Event Header Info */}
						<div>
							<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
								{event.title}
							</h1>

							<div className="flex flex-wrap gap-x-6 gap-y-3 text-muted-foreground">
								<div className="flex items-center gap-2">
									<CalendarIcon className="h-5 w-5 text-primary/80" />
									<span className="font-medium">
										{event.eventDate
											? format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")
											: "Date TBA"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<MapPin className="h-5 w-5 text-primary/80" />
									<span className="font-medium">{event.location || "Location TBA"}</span>
								</div>
								{event.maxParticipants && (
									<div className="flex items-center gap-2">
										<Users className="h-5 w-5 text-primary/80" />
										<span className="font-medium">Capacity: {event.maxParticipants}</span>
									</div>
								)}
							</div>
						</div>

						{/* Description */}
						<div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<Info className="h-5 w-5 text-primary" />
								About This Event
							</h3>
							<div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
								{event.description}
							</div>
						</div>

						{/* Rules Section (If any) */}
						{event.rules && event.rules.length > 0 && (
							<div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 shadow-sm text-amber-900 dark:text-amber-200">
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500" />
									Event Rules & Guidelines
								</h3>
								<ul className="space-y-2 list-disc pl-5">
									{event.rules.map((rule, idx) => (
										<li key={idx} className="pl-1 opacity-90">
											{rule}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>

					{/* RIGHT COLUMN: Sticky Registration Form */}
					<div className="lg:col-span-5 xl:col-span-4 relative">
						<div className="sticky top-6">
							<Card className="border-border/60 shadow-lg overflow-hidden">
								<CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
									<CardTitle className="text-2xl flex items-center gap-2">
										<Ticket className="h-5 w-5 text-primary" />
										Registration
									</CardTitle>
									<CardDescription>
										Fill out the details below to secure your spot.
									</CardDescription>
								</CardHeader>

								<CardContent className="pt-6">
									<Form {...form}>
										<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
											{/* Timeslot Selection */}
											{event.hasMultipleSlots && (event.timeslots as Timeslot[]) && (
												<FormField
													control={form.control}
													name="selectedTimeslot"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-foreground/80 font-semibold">
																Select Time Slot
															</FormLabel>
															<Select onValueChange={field.onChange}>
																<FormControl>
																	<SelectTrigger className="h-12 bg-background">
																		<SelectValue placeholder="Choose your preferred time" />
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

											{/* Payment Details & Proof */}
											{event.isPaid && event.ticketPrice ? (
												<div className="space-y-6">
													{/* Price Summary */}
													<div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex justify-between items-center">
														<span className="font-semibold text-primary/80">
															Registration Fee
														</span>
														<span className="text-2xl font-bold text-primary">
															{formatPrice(Number(event.ticketPrice))}
														</span>
													</div>

													{/* Bank Accounts List */}
													<div className="space-y-3">
														<Label className="text-foreground/80 font-semibold flex items-center gap-2">
															<Landmark className="h-4 w-4" />
															Pay to any account below:
														</Label>

														{bankAccounts.length === 0 ? (
															<p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
																No bank accounts configured. Please contact
																the society administration.
															</p>
														) : (
															<div className="grid gap-3">
																{bankAccounts.map((acc) => (
																	<div
																		key={acc.id}
																		className="group flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
																	>
																		<div className="overflow-hidden">
																			<p className="font-semibold text-sm truncate">
																				{acc.bankName}
																			</p>
																			<p className="text-xs text-muted-foreground truncate">
																				{acc.accountTitle}
																			</p>
																			<p className="font-mono text-xs mt-0.5 tracking-wider text-foreground/80">
																				{acc.accountNumber}
																			</p>
																		</div>
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
																			onClick={() =>
																				copyToClipboard(
																					acc.accountNumber,
																				)
																			}
																		>
																			<Copy className="h-4 w-4" />
																		</Button>
																	</div>
																))}
															</div>
														)}
													</div>

													{/* Upload Area */}
													<div className="space-y-2">
														<FormLabel className="text-foreground/80 font-semibold flex items-center gap-2">
															<Receipt className="h-4 w-4" />
															Upload Payment Receipt
														</FormLabel>
														<div className="relative group rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-muted/10">
															<Input
																type="file"
																accept="image/*"
																className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
																id="proof"
																onChange={handleProofUpload}
															/>
															<div className="p-6 text-center flex flex-col items-center justify-center gap-3">
																{proofPreview ? (
																	<div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 shadow-sm">
																		<img
																			src={proofPreview}
																			alt="Proof"
																			className="w-full h-full object-cover"
																		/>
																		<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
																			<span className="text-white text-sm font-medium flex items-center gap-2">
																				<Upload className="h-4 w-4" />{" "}
																				Change Image
																			</span>
																		</div>
																	</div>
																) : (
																	<>
																		<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
																			<Upload className="h-6 w-6 text-primary" />
																		</div>
																		<div>
																			<p className="font-medium text-sm">
																				Click to upload screenshot
																			</p>
																			<p className="text-xs text-muted-foreground mt-1">
																				JPEG, PNG or WebP
																			</p>
																		</div>
																	</>
																)}
															</div>
														</div>
													</div>
												</div>
											) : (
												<div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 flex items-start gap-3">
													<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
													<div>
														<h4 className="font-semibold text-emerald-900 dark:text-emerald-300">
															Free Event
														</h4>
														<p className="text-sm text-emerald-700 dark:text-emerald-400/80 mt-1">
															No payment required. Just confirm your
															registration below.
														</p>
													</div>
												</div>
											)}

											<div className="pt-2">
												<GoogleReCaptcha
													siteKey={process.env.VITE_RECAPTCHA_SITE_KEY as string}
													onChange={(token) => setRecaptchaToken(token)}
												/>
											</div>
										</form>
									</Form>
								</CardContent>
								<CardFooter className="bg-muted/30 border-t border-border/50 p-6">
									<Button
										onClick={form.handleSubmit(onSubmit)}
										className="w-full h-12 text-base font-semibold shadow-md"
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<Loader className="mr-2 h-5 w-5 animate-spin" />
												Processing...
											</>
										) : event.isPaid ? (
											"Submit Registration & Proof"
										) : (
											"Confirm Registration"
										)}
									</Button>
								</CardFooter>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</RoleGuard>
	);
}
