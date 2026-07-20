import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Plus, Trash2, CreditCard, Landmark, Building2, CalendarDays } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { createApiClient } from "~/api/client";
import { createBankAccountsApi } from "~/api/bank-accounts.api";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const api = createBankAccountsApi(client);
	const data = await api.getBankAccounts();

	return data;
};

export default function TreasurerBankAccountsPage() {
	const loaderData = useLoaderData<typeof loader>();
	const accounts = loaderData.success ? loaderData.data.accounts : [];

	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState({
		accountTitle: "",
		accountNumber: "",
		bankName: "",
	});

	const addAccount = async () => {
		const client = createApiClient();
		const api = createBankAccountsApi(client);

		const res = await api.addBankAccount(formData);
		if (res.success) {
			toast.success("Bank account added successfully");
			setOpen(false);
			setFormData({ accountTitle: "", accountNumber: "", bankName: "" }); // Clear form
			window.location.reload(); // Simple refresh for now
		} else {
			toast.error(res.error?.message || "Failed to add account");
		}
	};

	const deleteAccount = async (id: string) => {
		if (!confirm("Are you sure you want to delete this bank account?")) return;

		const client = createApiClient();
		const api = createBankAccountsApi(client);

		const res = await api.deleteBankAccount(id);
		if (res.success) {
			toast.success("Bank account deleted");
			window.location.reload();
		} else {
			toast.error(res.error?.message || "Failed to delete");
		}
	};

	return (
		<div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
						<CreditCard className="h-7 w-7 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
						<p className="text-muted-foreground text-sm mt-1">
							Manage society payment accounts for event registrations
						</p>
					</div>
				</div>

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button className="shadow-sm">
							<Plus className="mr-2 h-4 w-4" />
							Add New Account
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-xl">
								<Building2 className="h-5 w-5 text-primary" />
								Add Bank Account
							</DialogTitle>
							<p className="text-sm text-muted-foreground pt-1">
								Enter the details of the society's bank account for receiving payments.
							</p>
						</DialogHeader>
						<div className="grid gap-5 py-4">
							<div className="space-y-2">
								<Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
									Account Title
								</Label>
								<Input
									value={formData.accountTitle}
									onChange={(e) =>
										setFormData({ ...formData, accountTitle: e.target.value })
									}
									placeholder="e.g. Society Main Fund"
									className="h-11"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
									Account Number
								</Label>
								<Input
									value={formData.accountNumber}
									onChange={(e) =>
										setFormData({ ...formData, accountNumber: e.target.value })
									}
									placeholder="e.g. 123456789012"
									className="h-11 font-mono"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
									Bank Name
								</Label>
								<Input
									value={formData.bankName}
									onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
									placeholder="e.g. HBL Bank"
									className="h-11"
								/>
							</div>
						</div>
						<Button onClick={addAccount} className="w-full h-11 text-base font-medium">
							Save Account
						</Button>
					</DialogContent>
				</Dialog>
			</div>

			{/* Accounts Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{accounts.map((acc) => (
					<Card
						key={acc.id}
						className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60 bg-linear-to-br from-card to-muted/30"
					>
						{/* Gradient Accent Line */}
						<div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-primary/50 to-transparent" />

						<CardHeader className="pb-4">
							<CardTitle className="flex justify-between items-start">
								<div className="flex items-center gap-2.5">
									<div className="p-2 bg-background rounded-lg border shadow-sm">
										<Landmark className="h-4 w-4 text-foreground/70" />
									</div>
									<span className="font-semibold text-lg">{acc.bankName}</span>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2 h-8 w-8 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
									onClick={() => deleteAccount(acc.id)}
									title="Delete Account"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-6">
							{/* Account Number Section */}
							<div>
								<p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
									Account Number
								</p>
								<p className="font-mono text-xl sm:text-2xl tracking-[0.15em] text-foreground font-medium break-all">
									{acc.accountNumber}
								</p>
							</div>

							{/* Bottom Info Section */}
							<div className="flex items-end justify-between border-t border-border/50 pt-4 mt-2">
								<div className="space-y-1">
									<p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
										Account Title
									</p>
									<p className="font-medium text-sm truncate max-w-[180px]">
										{acc.accountTitle}
									</p>
								</div>

								<div className="flex flex-col items-end space-y-1">
									<div className="flex items-center gap-1.5 text-muted-foreground">
										<CalendarDays className="h-3 w-3" />
										<span className="text-[11px] uppercase tracking-wider font-semibold">
											Added
										</span>
									</div>
									<p className="text-sm font-medium">
										{new Date(acc.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Empty State */}
			{accounts.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 px-4 border-2 border-dashed border-border/60 rounded-2xl bg-muted/20 text-center">
					<div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-5">
						<CreditCard className="h-8 w-8 text-primary/80" />
					</div>
					<h3 className="text-xl font-semibold mb-2">No bank accounts added</h3>
					<p className="text-muted-foreground max-w-md mx-auto mb-6">
						You haven't added any payment methods yet. Add a bank account to allow students to pay
						for event registrations.
					</p>
					<Button
						onClick={() => setOpen(true)}
						variant="outline"
						className="border-primary/20 hover:bg-primary/5"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add First Account
					</Button>
				</div>
			)}
		</div>
	);
}
