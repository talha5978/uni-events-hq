import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { CalendarIcon, Upload, Loader, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { createApiClient } from "~/api/client";
import { createMediaApi } from "~/api/media.api";
import { createEventsApi } from "~/api/events.api";
import BackButton from "~/components/Nav/BackButton";
import type { LoaderFunctionArgs } from "react-router";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Timeslot } from "@uni-events-hq/db";

const statusEnum = ["draft", "upcoming", "ongoing", "completed", "cancelled", "cancel_requested"] as const;

const updateEventSchema = z.object({
	title: z.string().min(5, "Title must be at least 5 characters"),
	description: z.string().min(20, "Description must be at least 20 characters"),
	eventDate: z.date(),
	location: z.string().min(3, "Location is required"),
	isMembersOnly: z.boolean().default(false).optional(),
	maxParticipants: z.number().min(1).optional(),
	rules: z.array(z.string().min(1, "Rule cannot be empty")).default([]).optional(),
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
	banner: z.instanceof(File).optional(),
	status: z.enum(statusEnum),
});

type UpdateEventValues = z.infer<typeof updateEventSchema>;

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	if (!params.id) {
		return null;
	}

	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const eventsApi = createEventsApi(client);
	const data = await eventsApi.getEventById(params.id!);

	return data;
};

export const meta = () => {
	return [{ title: "Manage Event | Student Portal" }];
};

export default function UpdateEventPage() {
	const { id } = useParams();
	const loaderData = useLoaderData<typeof loader>();
	const navigate = useNavigate();

	const event = loaderData?.success ? loaderData?.data.event : null;

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [bannerPreview, setBannerPreview] = useState<string | null>(event?.bannerUrl || null);

	const form = useForm<UpdateEventValues>({
		resolver: zodResolver(updateEventSchema),
		defaultValues: {
			title: event?.title || "",
			description: event?.description || "",
			eventDate: event?.eventDate ? new Date(event.eventDate) : new Date(),
			location: event?.location || "",
			isMembersOnly: event?.isMembersOnly || false,
			maxParticipants: event?.maxParticipants || undefined,
			rules: event?.rules || [],
			hasMultipleSlots: event?.hasMultipleSlots || false,
			timeslots: (event?.timeslots as Timeslot[]) || [],
			status: event?.status || "draft",
		},
	});

	const {
		fields: rulesFields,
		append: appendRule,
		remove: removeRule,
	} = useFieldArray({
		control: form.control,
		//@ts-ignore
		name: "rules",
	});

	const {
		fields: timeslotFields,
		append: appendTimeslot,
		remove: removeTimeslot,
	} = useFieldArray({
		control: form.control,
		name: "timeslots",
	});

	const hasMultipleSlots = form.watch("hasMultipleSlots");

	const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			form.setValue("banner", file);
			const reader = new FileReader();
			reader.onload = () => setBannerPreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const onSubmit = async (values: UpdateEventValues) => {
		setIsSubmitting(true);
		const client = createApiClient();

		let bannerUrl = event?.bannerUrl;

		try {
			if (values.banner && typeof values.banner !== "string") {
				const mediaApi = createMediaApi(client);
				const res = await mediaApi.upload(values.banner);
				if (res.success) bannerUrl = res.data.url;
			}

			const eventsApi = createEventsApi(client);

			const payload = {
				title: values.title,
				description: values.description,
				eventDate: values.eventDate.toISOString(),
				location: values.location,
				isMembersOnly: values.isMembersOnly,
				maxParticipants: values.maxParticipants,
				rules: values.rules,
				hasMultipleSlots: values.hasMultipleSlots,
				timeslots: values.hasMultipleSlots ? values.timeslots : null,
				bannerUrl,
				status: values.status,
			};

			const res = await eventsApi.updateEvent(id!, payload);

			if (res.success) {
				toast.success(values.title + " event updated successfully!");
				navigate(`/society-events`);
			} else {
				toast.error(res.error?.message || "Failed to update event");
			}
		} catch (error) {
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6">
			<div className="flex items-center gap-4 mb-8">
				<BackButton href={`/society-events`} />
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Update Event</h1>
					<p className="text-muted-foreground">Modify event details</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					{/* Event Information Card */}
					<Card>
						<CardHeader>
							<CardTitle>Event Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Event Title</FormLabel>
										<FormControl>
											<Input {...field} />
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
											<Textarea rows={5} {...field} />
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
										className="mx-auto max-h-52 rounded-lg mb-4"
									/>
								) : (
									<Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
								)}

								<Input
									type="file"
									accept="image/*"
									className="hidden"
									id="banner-upload"
									onChange={handleBannerChange}
								/>

								<label htmlFor="banner-upload" className="cursor-pointer">
									<Button type="button" variant="outline" asChild>
										<span>Upload Banner Image</span>
									</Button>
								</label>

								<p className="text-xs text-muted-foreground mt-3">
									Recommended: Wide image (1200x400 or larger)
								</p>
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
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Event Status</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger className="min-w-xs">
													<SelectValue placeholder="Select a category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{statusEnum.map((s) => (
													<SelectItem key={s} value={s}>
														{s === "cancel_requested"
															? "Cancel Requested"
															: s.charAt(0).toUpperCase() + s.slice(1)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

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

							{!event?.isPaid && (
								<div className="p-4 border border-border bg-accent rounded-md font-semibold">
									Free Entry
								</div>
							)}

							{event?.isPaid && event?.ticketPrice && (
								<div className="grid gap-2">
									<Label>Ticket Price</Label>
									<Input type="number" disabled value={event.ticketPrice} />
								</div>
							)}

							{event?.maxParticipants && (
								<div className="grid gap-2">
									<Label>Maximum Participants</Label>
									<Input type="number" disabled value={event.maxParticipants} />
								</div>
							)}

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
							Update Event
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
