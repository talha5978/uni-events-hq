import { Loader, LogIn } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useState } from "react";
import { createAuthApi } from "~/api/auth.api";

export const meta = () => {
	return [{ title: "Sign In | Student Portal" }];
};

const signInSchema = z.object({
	email: z.email("Please enter a valid email").refine((val) => val.trim().length > 0, {
		message: "Email is required",
	}),
	password: z
		.string({ error: "Password is required" })
		.min(1, "Password is required")
		.refine((val) => val.trim().length > 0, {
			message: "Password is required",
		}),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();

	const form = useForm<SignInFormData>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: SignInFormData) => {
		setIsSubmitting(true);

		try {
			const authApi = createAuthApi();

			const result = await authApi.signIn({
				email: data.email.trim().toLowerCase(),
				password: data.password.trim(),
			});

			if (result.success) {
				toast.success("Signed in successfully");
				navigate("/");
			} else {
				toast.error(result.error?.message || "Failed to sign in. Please try again later.");
			}
		} catch (error) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md shadow-sm border border-border">
				<CardHeader className="space-y-3 text-center">
					<div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
						<LogIn className="w-6 h-6 text-primary" />
					</div>
					<CardTitle className="text-2xl font-semibold tracking-tight">Sign In</CardTitle>
					<CardDescription>Enter your credentials to access the student panel</CardDescription>
				</CardHeader>

				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email Address</FormLabel>
										<FormControl>
											<Input type="email" placeholder="ixxxxxx@gmail.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

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
								Sign In
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex justify-center border-t p-4 mt-2">
					<p className="text-sm text-muted-foreground">
						Want to create an account?{" "}
						<Link
							to="/sign-up"
							viewTransition
							prefetch="intent"
							className="text-primary font-medium hover:underline"
						>
							Sign Up
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
