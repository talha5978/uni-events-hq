import type { SocietyBankAccount } from "@uni-events-hq/db";
import { createApiClient } from "~/api/client";
import type { ApiResponse } from "~/types/response";

export function createBankAccountsApi(client = createApiClient()) {
	return {
		client,

		async getBankAccounts() {
			return await client.request<ApiResponse<{ accounts: SocietyBankAccount[] }>>(
				"/societies/treasurer/bank-accounts",
				{
					method: "GET",
				},
			);
		},

		async addBankAccount(body: { accountTitle: string; accountNumber: string; bankName: string }) {
			return await client.request<ApiResponse<{ account: SocietyBankAccount }>>(
				"/societies/treasurer/bank-accounts",
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);
		},

		async deleteBankAccount(id: string) {
			return await client.request<ApiResponse<null>>(`/societies/treasurer/bank-accounts/${id}`, {
				method: "DELETE",
				body: JSON.stringify({}),
			});
		},
	};
}
