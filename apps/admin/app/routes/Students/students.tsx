import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Search, Check, Hourglass, AlertTriangle, RefreshCw } from "lucide-react";
import { useRevalidator } from "react-router";
import { Form, Link, type LoaderFunctionArgs, useLoaderData, useLocation, useNavigation } from "react-router";
import { toast } from "sonner";
import { createApiClient } from "~/api/client";
import { createStudentsApi } from "~/api/students.api";
import { DataTable, DataTableSkeleton, TableColumnsToggle } from "~/components/Table/data-table";
import TableCopyField from "~/components/Table/TableId";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { StudentListResponse } from "~/types/students";
import { GetPaginationControls } from "~/utils/PaginationControls";
import { getPaginationQueryPayload } from "~/utils/PaginationQueryPayload";

export const meta = () => {
	return [
		{ title: "Students | Admin Portal" },
		{ name: "description", content: "Manage all students - Verify, Revoke & Monitor" },
	];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const { q, pageIndex, pageSize } = getPaginationQueryPayload({ request });

	const studentsApi = createStudentsApi(client);
	const data = await studentsApi.getAllStudents({
		search: q,
		pageIndex,
		pageSize,
	});

	return data;
};

export default function AdminStudentsPage() {
	const loaderData = useLoaderData<typeof loader>();

	const navigation = useNavigation();
	const location = useLocation();
	const revalidator = useRevalidator();

	const isFetching = navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const studentsData = loaderData.success ? loaderData.data : null;
	const students = studentsData?.students ?? [];
	const pagination = studentsData?.pagination;

	async function toggleVerification(studentId: string) {
		const studentsApi = createStudentsApi();
		const resp = await studentsApi.toggleVerification(studentId);
		if (resp.success) {
			toast.success(resp.message);
			revalidator.revalidate();
		} else {
			toast.error(resp.error.message || "Something went wrong. Please try again.");
		}
	}

	const tableColumns: ColumnDef<StudentListResponse["students"][number]>[] = [
		{
			id: "Student Id",
			accessorKey: "Student Id",
			header: "Student Id",
			cell: ({ row }) => <TableCopyField id={row.original.studentId} />,
		},
		{
			id: "Full Name",
			accessorKey: "Full Name",
			header: "Full Name",
			cell: ({ row }) => <div className="font-medium">{row.original.fullName}</div>,
		},
		{
			id: "Email",
			accessorKey: "email",
			header: "Email",
			cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>,
		},
		{
			id: "Department/Section",
			accessorKey: "Department/Section",
			header: "Department/Section",
			cell: ({ row }) => (
				<div className="text-muted-foreground">
					{row.original.department} • {row.original.batch} {row.original.section}
				</div>
			),
		},
		{
			id: "Status",
			accessorKey: "Status",
			header: "Status",
			cell: ({ row }) => (
				<Badge variant={row.original.isVerified ? "success" : "destructive"}>
					{row.original.isVerified ? (
						<Check className="w-4 h-4" />
					) : (
						<Hourglass className="w-4 h-4" />
					)}
					{row.original.isVerified ? "Verified" : "Pending"}
				</Badge>
			),
		},
		{
			id: "Joined",
			accessorKey: "Joined",
			header: "Joined",
			cell: ({ row }) =>
				new Date(row.original.createdAt).toLocaleDateString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
				}),
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const student = row.original;
				return (
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<Link to={`/admin/students/${student.id}`} prefetch="intent">
								<DropdownMenuItem>View Details</DropdownMenuItem>
							</Link>

							{!student.isVerified ? (
								<DropdownMenuItem onClick={() => toggleVerification(student.id)}>
									Verify Account
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									className="text-destructive"
									onClick={() => toggleVerification(student.id)}
								>
									Revoke Access
								</DropdownMenuItem>
							)}

							<Link to={`/admin/students/${student.id}/registrations`}>
								<DropdownMenuItem>View Registrations</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const { onPageChange, onPageSizeChange } = GetPaginationControls({});

	const table = useReactTable({
		data: students,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil((pagination?.total || 0) / (pagination?.pageSize || 0)),
		state: {
			pagination: {
				pageIndex: pagination?.page ? pagination.page - 1 : 0,
				pageSize: pagination?.pageSize || 10,
			},
		},
	});

	if (!loaderData.success) {
		const error = loaderData.error;
		return (
			<div className="flex h-[70vh] items-center justify-center p-6">
				<div className="max-w-md w-full text-center">
					<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-10 w-10 text-destructive" />
					</div>

					<h2 className="text-2xl font-semibold tracking-tight mb-2">Something went wrong</h2>

					<p className="text-muted-foreground mb-6">
						{error.message || "Failed to load students. Please try again."}
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
			<div className="flex items-center justify-between flex-wrap gap-2">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Students</h1>
					<p className="text-muted-foreground">
						Manage student accounts, verification, and participation
					</p>
				</div>
			</div>

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

				{isFetching ? (
					<DataTableSkeleton noOfSkeletons={6} columns={tableColumns} />
				) : (
					<DataTable
						table={table}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						pageSize={pagination?.pageSize || 10}
						total={pagination?.total || 0}
					/>
				)}
			</div>
		</div>
	);
}
