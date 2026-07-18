import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useRouteLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { CalendarIcon, Upload, Loader, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { createApiClient } from "~/api/client";
import { createMediaApi } from "~/api/media.api";
import BackButton from "~/components/Nav/BackButton";
import type { loader } from "~/root";
import { createEventsApi } from "~/api/events.api";

const eventFormSchema = z.object({
	title: z.string().min(5, "Title must be at least 5 characters"),
	description: z.string().min(20, "Description must be at least 20 characters"),
	eventDate: z.date(),
	location: z.string().min(3, "Location is required"),
	isMembersOnly: z.boolean().default(false).optional(),
	isPaid: z.boolean().default(false).optional(),
	ticketPrice: z.number().min(0).optional(),
	maxParticipants: z.number().min(1).optional(),
	rules: z.array(z.string().min(1, "Rule cannot be empty")).default([]).optional(),
	banner: z.instanceof(File).optional(),
	hasMultipleSlots: z.boolean().default(false).optional(),
	timeslots: z
		.array(
			z.object({
				startTime: z.string(),
				endTime: z.string(),
			}),
		)
		.default([])
		.optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function CreateEventPage() {
	const rootData = useRouteLoaderData<typeof loader>("root");
	const navigate = useNavigate();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [bannerPreview, setBannerPreview] = useState<string | null>(null);

	const form = useForm<EventFormValues>({
		resolver: zodResolver(eventFormSchema),
		defaultValues: {
			isMembersOnly: false,
			isPaid: false,
			rules: [],
			banner: undefined,
			description: "",
			eventDate: new Date(),
			location: "",
			maxParticipants: undefined,
			ticketPrice: 0,
			title: "",
			hasMultipleSlots: false,
			timeslots: [],
		},
	});

	const {
		fields: rulesFields,
		append: appendRule,
		remove: removeRule,
	} = useFieldArray({
		control: form.control,
		// @ts-ignore
		name: "rules" as const,
	});

	const {
		fields: timeslotFields,
		append: appendTimeslot,
		remove: removeTimeslot,
	} = useFieldArray({
		control: form.control,
		name: "timeslots" as const,
	});

	const hasMultipleSlots = useWatch({ control: form.control, name: "hasMultipleSlots" });

	const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			form.setValue("banner", file);
			const reader = new FileReader();
			reader.onload = () => setBannerPreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const onSubmit = async (values: EventFormValues) => {
		setIsSubmitting(true);
		const client = createApiClient();

		let bannerUrl: string | null = null;

		const societyId = rootData?.user?.success ? rootData.user.data.user.societyId : null;

		if (!societyId) {
			toast.error("Something went wrong. Please try again.");
			return;
		}

		try {
			if (values.banner) {
				const mediaApi = createMediaApi(client);
				const uploadRes = await mediaApi.upload(values.banner);
				if (uploadRes.success) bannerUrl = uploadRes.data.url;
			}

			const eventsApi = createEventsApi(client);

			const payload = {
				title: values.title,
				description: values.description,
				eventDate: values.eventDate.toISOString(),
				location: values.location,
				isMembersOnly: values.isMembersOnly,
				isPaid: values.isPaid,
				ticketPrice: values.isPaid ? values.ticketPrice : null,
				maxParticipants: values.maxParticipants,
				rules: values.rules || [],
				bannerUrl,
				hasMultipleSlots: values.hasMultipleSlots,
				timeslots: values.timeslots ?? [],
			};

			const res = await eventsApi.createEvent(societyId!, payload);

			if (res.success) {
				toast.success("Event created successfully!");
				navigate(`/society-events`);
			} else {
				toast.error(res.error?.message || "Failed to create event");
			}
		} catch (error) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6">
			<div className="flex items-center gap-4 mb-8">
				<BackButton href={`/society-events`} />
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Create New Event</h1>
					<p className="text-muted-foreground">Fill in the details for your upcoming event</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>Event Information</CardTitle>
							<CardDescription>Basic details about the event</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Event Title</FormLabel>
										<FormControl>
											<Input placeholder="Annual Tech Symposium 2026" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												rows={5}
												placeholder="Describe your event..."
												className="resize-none min-h-37.5"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<FormField
									control={form.control}
									name="eventDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Event Date</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<Button
														variant="outline"
														className={cn(
															"w-full justify-start text-left",
															!field.value && "text-muted-foreground",
														)}
													>
														<CalendarIcon className="mr-2 h-4 w-4" />
														{field.value
															? format(field.value, "PPPp")
															: "Select date"}
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0">
													<Input
														type="datetime-local"
														{...field}
														value={field.value.toString()}
														onChange={(e) =>
															field.onChange(new Date(e.target.value))
														}
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="location"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Location</FormLabel>
											<FormControl>
												<Input placeholder="Auditorium A, Main Campus" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Banner Upload */}
					<Card>
						<CardHeader>
							<CardTitle>Event Banner</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="border-2 border-dashed border-muted-foreground/50 rounded-xl p-8 text-center">
								{bannerPreview ? (
									<img
										src={bannerPreview}
										alt="Banner Preview"
										className="mx-auto max-h-52 rounded-lg"
									/>
								) : (
									<Upload className="mx-auto h-12 w-12 text-muted-foreground" />
								)}
								<Input
									type="file"
									accept="image/*"
									className="hidden"
									id="banner"
									onChange={handleBannerChange}
								/>
								<label htmlFor="banner" className="cursor-pointer">
									<Button type="button" variant="outline" className="mt-4">
										Upload Banner Image
									</Button>
								</label>
							</div>
						</CardContent>
					</Card>

					{/* Event Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Event Settings</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<FormField
								control={form.control}
								name="isMembersOnly"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div>
											<FormLabel>Members Only</FormLabel>
											<p className="text-sm text-muted-foreground">
												Only society members can register
											</p>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isPaid"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div>
											<FormLabel>Paid Event</FormLabel>
											<p className="text-sm text-muted-foreground">
												Require payment for registration
											</p>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							{form.watch("isPaid") && (
								<FormField
									control={form.control}
									name="ticketPrice"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ticket Price (PKR)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="500"
													{...field}
													onChange={(e) => field.onChange(Number(e.target.value))}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="maxParticipants"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Maximum Participants (Optional)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="200"
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="hasMultipleSlots"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div>
											<FormLabel>Multiple Time Slots</FormLabel>
											<p className="text-sm text-muted-foreground">
												Event has different time slots (workshops, sessions, etc.)
											</p>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{hasMultipleSlots && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									Time Slots
									<Button
										type="button"
										variant="outline"
										size="icon-sm"
										onClick={() => appendTimeslot({ startTime: "", endTime: "" })}
									>
										<Plus />
									</Button>
								</CardTitle>
								<CardDescription>
									Define different sessions or time slots for this event
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{timeslotFields.map((field, index) => (
										<div
											key={field.id}
											className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded-lg p-4"
										>
											<div className="md:col-span-5">
												<FormField
													control={form.control}
													name={`timeslots.${index}.startTime`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Start Time</FormLabel>
															<FormControl>
																<Input type="time" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="md:col-span-5">
												<FormField
													control={form.control}
													name={`timeslots.${index}.endTime`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>End Time</FormLabel>
															<FormControl>
																<Input type="time" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="md:col-span-2">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="text-destructive"
													onClick={() => removeTimeslot(index)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									))}

									{timeslotFields.length === 0 && (
										<p className="text-muted-foreground text-center py-8">
											No time slots added yet.
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								Event Rules
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									// @ts-ignore
									onClick={() => appendRule(" ")}
								>
									<Plus />
								</Button>
							</CardTitle>
							<CardDescription>
								Add important rules and guidelines for participants
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{rulesFields.map((field, index) => (
									<div key={field.id} className="flex gap-3 items-start">
										<FormField
											control={form.control}
											name={`rules.${index}`}
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormControl>
														<Input
															placeholder={`Rule ${index + 1} (e.g., No late entry allowed)`}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="mt-1 text-destructive hover:bg-destructive/10"
											onClick={() => removeRule(index)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}

								{rulesFields.length === 0 && (
									<p className="text-muted-foreground text-center py-8">
										No rules added yet.
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					<div className="flex justify-end gap-4">
						<Button type="button" variant="outline" onClick={() => navigate(-1)}>
							Cancel
						</Button>
						<Button type="submit" size="lg" disabled={isSubmitting}>
							{isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
							Create Event
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
