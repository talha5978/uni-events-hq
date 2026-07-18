import { Loader, UserPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { useState } from "react";
import { createAuthApi } from "~/api/auth.api";

export const meta = () => {
	return [{ title: "Sign Up | Student Portal" }];
};

const signUpSchema = z.object({
	fullName: z.string().min(2, "Full name is required"),
	email: z.string().email("Please enter a valid email"),
	studentId: z.string().min(1, "Student ID is required"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	department: z.string().min(2, "Department is required"),
	batch: z.string().min(2, "Batch is required (e.g., 2022)"),
	section: z.string().min(1, "Section is required (e.g., A)"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();

	const form = useForm<SignUpFormData>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			fullName: "",
			email: "",
			studentId: "",
			password: "",
			department: "",
			batch: "",
			section: "",
		},
	});

	const onSubmit = async (data: SignUpFormData) => {
		setIsSubmitting(true);

		try {
			const authApi = createAuthApi();
			for (const key in data) {
				// @ts-ignore
				data[key] = data[key].trim();
			}

			const result = await authApi.signUp({
				...data,
				email: data.email.toLowerCase(),
			});

			if (result.success) {
				toast.success("Account created! Please wait for admin verification.");
				navigate("/sign-in");
			} else {
				toast.error(result.error?.message || "Failed to sign up. Please try again later.");
			}
		} catch (error) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 py-10">
			<Card className="w-full max-w-xl shadow-sm border border-border">
				<CardHeader className="space-y-3 text-center">
					<div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
						<UserPlus className="w-6 h-6 text-primary" />
					</div>
					<CardTitle className="text-2xl font-semibold tracking-tight">Create Account</CardTitle>
					<CardDescription>
						Register for the student portal. An admin will verify your account before granting
						access.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
							<FormField
								control={form.control}
								name="fullName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name</FormLabel>
										<FormControl>
											<Input placeholder="Ali Hamza" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Address</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="ixxxxxx@gmail.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="studentId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Student ID</FormLabel>
											<FormControl>
												<Input placeholder="26I-1234" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<FormField
									control={form.control}
									name="department"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Department</FormLabel>
											<FormControl>
												<Input placeholder="Software Engineering" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="batch"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Batch</FormLabel>
											<FormControl>
												<Input placeholder="2026" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="section"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Section</FormLabel>
											<FormControl>
												<Input placeholder="SE-2C" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
								Sign Up
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex justify-center border-t p-4 mt-2">
					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							to="/sign-in"
							viewTransition
							prefetch="intent"
							className="text-primary font-medium hover:underline"
						>
							Sign In
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
