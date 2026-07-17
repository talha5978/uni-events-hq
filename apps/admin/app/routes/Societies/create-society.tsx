import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Upload, Loader, Building2, ImagePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { useNavigate } from "react-router";
import { createApiClient } from "~/api/client";
import { createMediaApi } from "~/api/media.api";
import { createSocietiesApi } from "~/api/societies.api";

const CATEGORIES = [
	"Technical",
	"Cultural",
	"Sports",
	"Literary",
	"Science",
	"Social",
	"Arts",
	"Music",
	"Debate",
	"Other",
] as const;

const NewSocietySchema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters"),
	slug: z
		.string()
		.min(3, "Slug must be at least 3 characters")
		.regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
	description: z.string().min(10, "Description must be at least 10 characters").optional(),
	category: z.enum(CATEGORIES),
	logo: z.instanceof(File).optional(),
	banner: z.instanceof(File).optional(),
});

type NewSocietyInput = z.infer<typeof NewSocietySchema>;

export function meta() {
	return [{ title: "Create New Society" }];
}

export default function NewSocietyPage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [bannerPreview, setBannerPreview] = useState<string | null>(null);
	const navigate = useNavigate();

	const form = useForm<NewSocietyInput>({
		resolver: zodResolver(NewSocietySchema),
		defaultValues: {
			name: "",
			slug: "",
			description: "",
			category: "Technical",
		},
	});

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			form.setValue("logo", file);
			const reader = new FileReader();
			reader.onload = () => setLogoPreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			form.setValue("banner", file);
			const reader = new FileReader();
			reader.onload = () => setBannerPreview(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const onSubmit = async (values: NewSocietyInput) => {
		setIsSubmitting(true);
		const client = createApiClient();

		let logoUrl: string | null = null;
		let bannerUrl: string | null = null;

		try {
			const mediaApi = createMediaApi(client);

			if (values.logo) {
				const logoRes = await mediaApi.upload(values.logo);
				if (logoRes.success) logoUrl = logoRes.data.url;
			}

			if (values.banner) {
				const bannerRes = await mediaApi.upload(values.banner);
				if (bannerRes.success) bannerUrl = bannerRes.data.url;
			}

			const societiesApi = createSocietiesApi(client);

			const response = await societiesApi.create({
				name: values.name.trim(),
				slug: values.slug.toLowerCase().trim(),
				description: values.description?.trim(),
				category: values.category,
				logoUrl,
				bannerUrl,
			});

			if (!response.success) {
				toast.error(response.error.message || "Failed to create society");
				return;
			}

			toast.success("Society created successfully!");
			navigate("/societies");
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="w-full sm:px-6 px-4 py-8 lg:px-10 max-w-6xl mx-auto">
			<div className="flex items-center gap-4 mb-8">
				<BackButton href="/societies" />
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Create New Society</h1>
					<p className="text-muted-foreground mt-1">Add a new student society to the platform</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
						<div className="lg:col-span-2">
							<Card>
								<CardHeader>
									<CardTitle>Society Information</CardTitle>
									<CardDescription>
										Basic details and configuration for the society.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Society Name</FormLabel>
													<FormControl>
														<Input
															placeholder="e.g. Computer Science Society"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="slug"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Slug (URL friendly)</FormLabel>
													<FormControl>
														<Input placeholder="e.g. cs-society" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="category"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Category</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="min-w-xs">
															<SelectValue placeholder="Select a category" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{CATEGORIES.map((cat) => (
															<SelectItem key={cat} value={cat}>
																{cat}
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
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Description</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Describe the society's mission, goals, and primary activities..."
														className="resize-y min-h-[200px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-1">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Building2 className="w-5 h-5 text-muted-foreground" />
										Visual Identity
									</CardTitle>
									<CardDescription>Upload the society's branding assets.</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Logo Upload */}
									<div className="space-y-3">
										<div className="text-sm font-medium">Society Logo</div>
										<Input
											type="file"
											accept="image/*"
											className="hidden"
											id="logo"
											onChange={handleLogoChange}
										/>
										{/* Changed from aspect-square max-h-[240px] to a fixed height h-48 to prevent it from growing too large */}
										<label
											htmlFor="logo"
											className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden group relative"
										>
											{logoPreview ? (
												<>
													<img
														src={logoPreview}
														alt="Logo preview"
														className="w-full h-full object-contain p-4"
													/>
													<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
														<span className="text-white text-sm font-medium flex items-center gap-2">
															<Upload className="w-4 h-4" /> Change Logo
														</span>
													</div>
												</>
											) : (
												<div className="flex flex-col items-center justify-center text-muted-foreground">
													<ImagePlus className="w-8 h-8 mb-3 opacity-50" />
													<span className="text-sm font-medium">Upload Logo</span>
													<span className="text-xs mt-1 opacity-70">
														PNG, JPG up to 2MB
													</span>
												</div>
											)}
										</label>
									</div>

									{/* Banner Upload */}
									<div className="space-y-3 pt-2">
										<div className="text-sm font-medium">Cover Banner</div>
										<Input
											type="file"
											accept="image/*"
											className="hidden"
											id="banner"
											onChange={handleBannerChange}
										/>
										<label
											htmlFor="banner"
											className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden group relative"
										>
											{bannerPreview ? (
												<>
													<img
														src={bannerPreview}
														alt="Banner preview"
														className="w-full h-full object-cover"
													/>
													<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
														<span className="text-white text-sm font-medium flex items-center gap-2">
															<Upload className="w-4 h-4" /> Change Banner
														</span>
													</div>
												</>
											) : (
												<div className="flex flex-col items-center justify-center text-muted-foreground">
													<ImagePlus className="w-6 h-6 mb-2 opacity-50" />
													<span className="text-sm font-medium">Upload Banner</span>
												</div>
											)}
										</label>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Bottom Actions */}
					<div className="flex items-center justify-end gap-4 pt-4">
						<Button type="button" variant="outline" onClick={() => navigate("/societies")}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[140px]">
							{isSubmitting ? (
								<>
									<Loader className="mr-1 h-4 w-4 animate-spin" />
									Processing...
								</>
							) : (
								"Submit"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
