import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Crown, DollarSign, User } from "lucide-react";
import { type LoaderFunctionArgs, useLoaderData, useLocation, useNavigation } from "react-router";
import { createApiClient } from "~/api/client";
import { createSocietiesApi } from "~/api/societies.api";
import { RoleGuard } from "~/components/Auth/RoleGaurd";
import { DataTable, DataTableSkeleton } from "~/components/Table/data-table";
import TableCopyField from "~/components/Table/TableId";
import { Badge } from "~/components/ui/badge";
import { GetPaginationControls } from "~/utils/PaginationControls";
import { getPaginationQueryPayload } from "~/utils/PaginationQueryPayload";

export const meta = () => {
	return [{ title: "Society Members" }, { name: "description", content: "Manage your society members" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const client = createApiClient();
	client.setCookie(cookieHeader);

	const { pageSize, pageIndex } = getPaginationQueryPayload({ request });

	const societiesApi = createSocietiesApi(client);
	const data = await societiesApi.getSocietyMembers({
		pageSize,
		pageIndex,
	});

	return data;
};

export default function SocietyMembersPage() {
	const loaderData = useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const location = useLocation();

	const isFetching = navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const membersData = loaderData.success ? loaderData.data : null;
	const members = membersData?.members ?? [];
	const pagination = membersData?.pagination;

	const tableColumns: ColumnDef<(typeof members)[number]>[] = [
		{
			id: "studentId",
			accessorKey: "studentId",
			header: "Student ID",
			cell: ({ row }) => <TableCopyField id={row.original.studentId ?? ""} />,
		},
		{
			id: "fullName",
			accessorKey: "fullName",
			header: "Full Name",
			cell: ({ row }) => <div className="font-medium">{row.original.fullName}</div>,
		},
		{
			id: "role",
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => {
				let role = row.original.role;
				return (
					<Badge
						variant={
							role === "president" ? "default" : role === "treasurer" ? "secondary" : "outline"
						}
						className="capitalize flex items-center gap-1"
					>
						{role === "president" && <Crown className="h-3.5 w-3.5" />}
						{role === "treasurer" && <DollarSign className="h-3.5 w-3.5" />}
						{role === "member" && <User className="h-3.5 w-3.5" />}
						{role}
					</Badge>
				);
			},
		},
		{
			id: "Batch",
			accessorKey: "Batch",
			header: "Batch",
			cell: ({ row }) => <div className="font-medium">{row.original.batch}</div>,
		},
		{
			id: "Department",
			accessorKey: "Department",
			header: "Department",
			cell: ({ row }) => <div className="font-medium">{row.original.department}</div>,
		},
		{
			id: "joinedAt",
			accessorKey: "joinedAt",
			header: "Joined",
			cell: ({ row }) =>
				new Date(row.original.joinedAt).toLocaleDateString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
				}),
		},
	];

	const { onPageChange, onPageSizeChange } = GetPaginationControls({});

	const table = useReactTable({
		data: members,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil((pagination?.total || 0) / (pagination?.pageSize || 0)),
		state: {
			pagination: {
				pageIndex: pagination?.page ? pagination.page - 1 : 0,
				pageSize: pagination?.pageSize || 12,
			},
		},
	});

	if (!loaderData.success) {
		return <div className="p-6 text-destructive">Failed to load members</div>;
	}

	return (
		<RoleGuard allowedRoles={["president", "treasurer", "member"]}>
			<div className="flex-1 flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between flex-wrap gap-2">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Society Members</h1>
						<p className="text-muted-foreground">Manage members and their roles</p>
					</div>
				</div>

				<div className="space-y-4">
					{isFetching ? (
						<DataTableSkeleton noOfSkeletons={5} columns={tableColumns} />
					) : (
						<DataTable
							table={table}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
							pageSize={pagination?.pageSize || 12}
							total={pagination?.total || 0}
						/>
					)}
				</div>
			</div>
		</RoleGuard>
	);
}
