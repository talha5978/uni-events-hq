import { useState, useEffect } from "react";
import { PlusCircle, User, Crown, DollarSign, Loader, MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { createApiClient } from "~/api/client";
import { createSocietiesApi } from "~/api/societies.api";
import type { StudentsListMin } from "~/types/students";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRevalidator } from "react-router";

type Student = StudentsListMin["students"][0];

type AddMembersSheetProps = {
	societyId: string;
	onSuccess?: () => void;
};

export default function AddMembersSheet({ societyId, onSuccess }: AddMembersSheetProps) {
	const revalidator = useRevalidator();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [students, setStudents] = useState<Student[]>([]);
	const [pagination, setPagination] = useState<any>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const [president, setPresident] = useState<Student | null>(null);
	const [treasurer, setTreasurer] = useState<Student | null>(null);
	const [generalMembers, setGeneralMembers] = useState<Student[]>([]);

	const fetchStudents = async (reset = false) => {
		const client = createApiClient();
		const api = createSocietiesApi(client);

		const res = await api.getAvailableStudents(societyId, {
			pageIndex: reset ? 0 : pageIndex,
			pageSize: 15,
			search,
		});

		if (res.success) {
			if (reset) {
				setStudents(res.data.students);
			} else {
				setStudents((prev) => [...prev, ...res.data.students]);
			}
			setPagination(res.data.pagination);
		}
		setIsLoadingMore(false);
	};

	useEffect(() => {
		if (open) {
			fetchStudents(true);
		}
	}, [open, search]);

	const loadMore = () => {
		if (!pagination?.hasMore) return;
		setIsLoadingMore(true);
		setPageIndex((prev) => prev + 1);
		fetchStudents(false);
	};

	const addMember = async (student: Student, role: "president" | "treasurer" | "member") => {
		const client = createApiClient();
		const api = createSocietiesApi(client);

		const res = await api.manageMember(societyId, {
			userId: student.id,
			role,
			action: "add",
		});

		if (res.success) {
			// Update local state
			if (role === "president") setPresident(student);
			else if (role === "treasurer") setTreasurer(student);
			else if (!generalMembers.some((m) => m.id === student.id)) {
				setGeneralMembers([...generalMembers, student]);
			}

			toast.success(`${student.fullName} added as ${role}`);
		} else {
			toast.error("Failed to add member");
		}

		onSuccess?.();
	};

	const removeMember = async (id: string, role: "president" | "treasurer" | "member") => {
		const client = createApiClient();
		const api = createSocietiesApi(client);

		const res = await api.manageMember(societyId, {
			userId: id,
			role,
			action: "remove",
		});

		if (res.success) {
			if (role === "president") setPresident(null);
			else if (role === "treasurer") setTreasurer(null);
			else setGeneralMembers(generalMembers.filter((m) => m.id !== id));

			toast.success("Member removed successfully");
		}

		onSuccess?.();
	};

	return (
		<Sheet
			open={open}
			onOpenChange={() => {
				setOpen(!open);
				revalidator.revalidate();
			}}
		>
			<SheetTrigger asChild>
				<Button variant="outline">
					<PlusCircle className="mr-2 h-4 w-4" />
					Add Members
				</Button>
			</SheetTrigger>

			<SheetContent className="w-full sm:max-w-xl max-h-dvh overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Add Members to Society</SheetTitle>
					<SheetDescription>Assign leadership roles and members</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-8 p-4">
					{/* Search */}
					<Input
						placeholder="Search by name, email or student ID..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPageIndex(0);
						}}
					/>

					{/* Selected Roles */}
					<div className="space-y-6">
						{/* President */}
						<div>
							<div className="flex items-center gap-2 mb-3">
								<Crown className="h-5 w-5 text-amber-600" />
								<h3 className="font-semibold">President</h3>
							</div>
							{president ? (
								<div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-xl">
									<div className="flex items-center gap-3">
										<div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
											<User className="text-amber-600" />
										</div>
										<div>
											<p className="font-medium">{president.fullName}</p>
											<p className="text-sm text-muted-foreground">
												{president.studentId}
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => removeMember(president.id, "president")}
									>
										Remove
									</Button>
								</div>
							) : (
								<p className="text-sm text-muted-foreground italic pl-1">
									No president assigned
								</p>
							)}
						</div>

						{/* Treasurer */}
						<div>
							<div className="flex items-center gap-2 mb-3">
								<DollarSign className="h-5 w-5 text-emerald-600" />
								<h3 className="font-semibold">Treasurer</h3>
							</div>
							{treasurer ? (
								<div className="flex justify-between items-center p-4 text-emerald-100 border border-emerald-200 rounded-xl">
									<div className="flex items-center gap-3">
										<div className="w-11 h-11 rounded-full text-emerald-100 flex items-center justify-center">
											<User className="text-emerald-600" />
										</div>
										<div>
											<p className="font-medium">{treasurer.fullName}</p>
											<p className="text-sm text-muted-foreground">
												{treasurer.studentId}
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => removeMember(treasurer.id, "treasurer")}
									>
										Remove
									</Button>
								</div>
							) : (
								<p className="text-sm text-muted-foreground italic pl-1">
									No treasurer assigned
								</p>
							)}
						</div>
					</div>

					<Separator />

					{/* Available Students */}
					<div>
						<h3 className="font-semibold mb-4 flex items-center justify-between">
							Available Students
							<span className="text-sm font-normal text-muted-foreground">
								{pagination?.total || 0} found
							</span>
						</h3>

						<ScrollArea className="h-105 pr-4">
							<div className="space-y-3">
								{students.map((student) => (
									<div
										key={student.id}
										className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-all group"
									>
										<div className="flex items-center gap-4 flex-1 min-w-0">
											<div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0">
												<User className="h-5 w-5 text-muted-foreground" />
											</div>

											<div className="min-w-0 flex-1">
												<p className="font-medium truncate">{student.fullName}</p>
												<p className="text-sm text-muted-foreground truncate">
													{student.studentId} • {student.department || "N/A"}
												</p>
											</div>
										</div>

										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button variant="ghost" className="h-8 w-8 p-0">
													<span className="sr-only">Open menu</span>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem>
													<Button
														size="sm"
														variant="outline"
														className="text-amber-600 border-amber-200 hover:bg-amber-50"
														onClick={() => addMember(student, "president")}
													>
														<Crown className="h-3.5 w-3.5 mr-1" />
														President
													</Button>
												</DropdownMenuItem>

												<DropdownMenuItem>
													<Button
														size="sm"
														variant="outline"
														className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
														onClick={() => addMember(student, "treasurer")}
													>
														<DollarSign className="h-3.5 w-3.5 mr-1" />
														Treasurer
													</Button>
												</DropdownMenuItem>

												<DropdownMenuItem>
													<Button
														size="sm"
														variant="default"
														onClick={() => addMember(student, "member")}
													>
														Add Member
													</Button>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								))}
							</div>
						</ScrollArea>

						{/* Load More */}
						{pagination?.hasMore && (
							<div className="flex justify-center mt-6">
								<Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
									{isLoadingMore && <Loader className="mr-2 h-4 w-4 animate-spin" />}
									Load More Students
								</Button>
							</div>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
