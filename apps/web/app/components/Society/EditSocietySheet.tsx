import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Loader, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createApiClient } from "~/api/client";
import { createSocietiesApi } from "~/api/societies.api";
import { createMediaApi } from "~/api/media.api";
import type { Society } from "@uni-events-hq/db";

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

const UpdateSocietySchema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters"),
	description: z.string().optional(),
	category: z.enum(CATEGORIES),
	logo: z.instanceof(File).optional(),
	banner: z.instanceof(File).optional(),
});

type UpdateSocietyInput = z.infer<typeof UpdateSocietySchema>;

type UpdateSocietySheetProps = {
	societyId: string;
	initialData: Society;
	onSuccess?: () => void;
};

export default function UpdateSocietySheet({ societyId, initialData, onSuccess }: UpdateSocietySheetProps) {
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logoUrl || null);
	const [bannerPreview, setBannerPreview] = useState<string | null>(initialData.bannerUrl || null);

	const form = useForm<UpdateSocietyInput>({
		resolver: zodResolver(UpdateSocietySchema),
		defaultValues: {
			name: initialData.name || "",
			description: initialData.description || "",
			category: (initialData.category as (typeof CATEGORIES)[number]) || "Technical",
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

	const onSubmit = async (values: UpdateSocietyInput) => {
		setIsSubmitting(true);
		const client = createApiClient();
		let logoUrl = initialData.logoUrl;
		let bannerUrl = initialData.bannerUrl;

		try {
			const mediaApi = createMediaApi(client);

			if (values.logo) {
				const res = await mediaApi.upload(values.logo);
				if (res.success) logoUrl = res.data.url;
			}
			if (values.banner) {
				const res = await mediaApi.upload(values.banner);
				if (res.success) bannerUrl = res.data.url;
			}

			const societiesApi = createSocietiesApi(client);
			// TODO: Add update method in societiesApi

			const res = await societiesApi.update(societyId, {
				name: values.name,
				description: values.description,
				category: values.category,
				logoUrl,
				bannerUrl,
			});

			if (res.success) {
				toast.success("Society updated successfully");
				setOpen(false);
				onSuccess?.();
			} else {
				toast.error(res.error?.message || "Failed to update society");
			}
		} catch (error) {
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button disabled={isSubmitting}>
					{isSubmitting ? (
						<Loader className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Edit className="mr-2 h-4 w-4" />
					)}
					Edit Society
				</Button>
			</SheetTrigger>

			<SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
				<SheetHeader>
					<SheetTitle>Edit Society</SheetTitle>
					<SheetDescription>Update basic information of the society</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-8">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Society Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="category"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Category</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue />
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
										<Textarea rows={5} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Logo & Banner Uploads */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-sm font-medium">Logo</label>
								<div className="mt-2 border rounded-xl p-4 text-center">
									{logoPreview && (
										<img
											src={logoPreview}
											alt="logo"
											className="mx-auto h-20 object-contain mb-3"
										/>
									)}
									<Input type="file" accept="image/*" onChange={handleLogoChange} />
								</div>
							</div>

							<div>
								<label className="text-sm font-medium">Banner</label>
								<div className="mt-2 border rounded-xl p-4 text-center">
									{bannerPreview && (
										<img
											src={bannerPreview}
											alt="banner"
											className="mx-auto h-20 object-cover rounded"
										/>
									)}
									<Input type="file" accept="image/*" onChange={handleBannerChange} />
								</div>
							</div>
						</div>

						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
							Update Society
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
