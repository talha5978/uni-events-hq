import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Eye, Check, X, Search, AlertTriangle, RefreshCw, Pencil } from "lucide-react";
import { Form, useRevalidator } from "react-router";
import { Link, type LoaderFunctionArgs, useLoaderData } from "react-router";
import { toast } from "sonner";
import { createApiClient } from "~/api/client";
import { createEventsApi } from "~/api/events.api";
import { DataTable, TableColumnsToggle } from "~/components/Table/data-table";
import TableCopyField from "~/components/Table/TableId";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useState } from "react";
import type { FinancesResp } from "~/types/finances";
import { GetPaginationControls } from "~/utils/PaginationControls";
import { getPaginationQueryPayload } from "~/utils/PaginationQueryPayload";
import { Input } from "~/components/ui/input";
import type { RegistrationStatus } from "@uni-events-hq/db";

export const meta = () => [{ title: "Event Finances | Treasurer" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const { q, pageIndex, pageSize } = getPaginationQueryPayload({ request });
	const url = new URL(request.url);
	const eventId = url.searchParams.get("eventId");

	const treasurerApi = createEventsApi(client);
	const data = await treasurerApi.getFinances({
		eventId: eventId || undefined,
		pageIndex,
		pageSize,
		search: q,
	});

	return data;
};

export default function FinancesPage() {
	const loaderData = useLoaderData<typeof loader>();
	const revalidator = useRevalidator();
	const [selectedProof, setSelectedProof] = useState<string | null>(null);

	const financesData = loaderData.success ? loaderData.data : null;
	const registrations = financesData?.registrations ?? [];
	const pagination = financesData?.pagination;

	async function updateStatus(registrationId: string, status: RegistrationStatus) {
		const treasurerApi = createEventsApi();
		const resp = await treasurerApi.updateRegistrationStatus(registrationId, status);
		if (resp.success) {
			toast.success("Status updated");
			revalidator.revalidate();
		} else {
			toast.error(resp.error?.message || "Failed to update status");
		}
	}

	const tableColumns: ColumnDef<FinancesResp["registrations"][number]>[] = [
		{
			id: "Student ID",
			accessorKey: "Student ID",
			header: "Student ID",
			cell: ({ row }) => <TableCopyField id={row.original.studentId ?? ""} />,
		},
		{
			id: "Full Name",
			accessorKey: "Full Name",
			header: "Full Name",
			cell: ({ row }) => row.original.fullName,
		},
		{
			id: "Email",
			accessorKey: "Email",
			header: "Email",
			cell: ({ row }) => row.original.email,
		},
		{
			id: "Department",
			accessorKey: "Department",
			header: "Department",
			cell: ({ row }) => (
				<div>
					{row.original.department} • {row.original.batch} {row.original.section}
				</div>
			),
		},
		{
			id: "Event",
			accessorKey: "Event",
			header: "Event",
			cell: ({ row }) => row.original.eventTitle,
		},
		{
			id: "Status",
			accessorKey: "Status",
			header: "Status",
			cell: ({ row }) => (
				<Badge
					variant={
						row.original.status === "registered" || row.original.status === "attended"
							? "success"
							: row.original.status === "pending_verification"
								? "warning"
								: row.original.status === "absent"
									? "destructive"
									: "secondary"
					}
				>
					{row.original.status.replace("_", " ").toUpperCase()}
				</Badge>
			),
		},
		{
			id: "Payment Proof",
			accessorKey: "Payment Proof",
			header: "Payment Proof",
			cell: ({ row }) => {
				const url = row.original.transactionProofUrl;
				return url ? (
					<Button variant="ghost" size="sm" onClick={() => setSelectedProof(url)}>
						<Eye className="h-4 w-4 mr-1" />
						View
					</Button>
				) : (
					<span className="text-muted-foreground text-sm">N/A</span>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const reg = row.original;
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="p-0">
								<Pencil className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{row.original.status !== "registered" && (
								<DropdownMenuItem
									onClick={() => updateStatus(reg.registrationId, "registered")}
								>
									<Check className="mr-2 h-4 w-4" />
									Confirm Registration
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onClick={() => updateStatus(reg.registrationId, "attended")}>
								<Check className="mr-2 h-4 w-4" />
								Mark as Attended
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => updateStatus(reg.registrationId, "absent")}
								variant="destructive"
							>
								<Check className="mr-2 h-4 w-4" />
								Mark as Absentee
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => updateStatus(reg.registrationId, "cancelled")}
								variant="destructive"
							>
								<X className="mr-2 h-4 w-4" />
								Cancel Registration
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const { onPageChange, onPageSizeChange } = GetPaginationControls({});

	const table = useReactTable({
		data: registrations,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil((pagination?.total || 0) / (pagination?.pageSize || 0)),
		state: {
			pagination: {
				pageIndex: pagination?.page ? pagination.page - 1 : 0,
				pageSize: pagination?.pageSize || 15,
			},
		},
	});

	if (!loaderData.success) {
		const error = loaderData?.error;
		return (
			<div className="flex h-[70vh] items-center justify-center p-6">
				<div className="max-w-md w-full text-center">
					<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-10 w-10 text-destructive" />
					</div>

					<h2 className="text-2xl font-semibold tracking-tight mb-2">Something went wrong</h2>

					<p className="text-muted-foreground mb-6">
						{error?.message || "Failed to load registrations' finances. Please try again."}
					</p>

					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Button onClick={() => window.location.reload()} variant="default">
							<RefreshCw className="mr-2 h-4 w-4" />
							Retry
						</Button>

						<Button variant="outline" asChild>
							<Link to="/">Go to Dashboard</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col gap-6 p-6">
			<h1 className="text-3xl font-semibold tracking-tight">Finances</h1>

			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<Form method="get" className="max-w-sm">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search by name, email or student ID..."
								name="q"
								className="pl-10 max-w-sm"
							/>
						</div>
					</Form>

					<TableColumnsToggle table={table} />
				</div>

				<DataTable
					table={table}
					onPageChange={onPageChange}
					onPageSizeChange={onPageSizeChange}
					pageSize={pagination?.pageSize || 15}
					total={pagination?.total || 0}
				/>
			</div>
			<Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
				<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Payment Proof</DialogTitle>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-2">
						{selectedProof && (
							<img
								src={selectedProof}
								alt="Payment Proof"
								className="w-full h-auto object-cover rounded-md"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
