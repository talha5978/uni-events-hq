const API_BASE = (process.env.API_BASE_URL || "http://localhost:3000") + "/api";

export function createApiClient() {
	let cookie = "";

	const setCookie = (c: string) => {
		cookie = c;
	};

	const getCookie = () => cookie;

	async function request<T>(
		endpoint: string,
		options: RequestInit & { skipAuthRefresh?: boolean } = {},
	): Promise<T> {
		const isFormData = options.body instanceof FormData;

		const headers: HeadersInit = {
			...(cookie ? { Cookie: cookie } : {}),
			...options.headers,
		};

		if (
			!isFormData &&
			!headers["Content-Type" as keyof typeof headers] &&
			!headers["content-type" as keyof typeof headers]
		) {
			headers["Content-Type" as keyof typeof headers] = "application/json";
		}

		const res = await fetch(`${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`, {
			...options,
			credentials: "include",
			headers,
		});

		if (
			res.status !== 401 ||
			options.skipAuthRefresh ||
			["signin", "signup", "signout"].some((e) => endpoint.includes(e))
		) {
			const data = await res.json();
			return data;
		}

		// refresh once
		const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
			method: "POST",
			credentials: "include",
			headers: cookie ? { Cookie: cookie } : {},
		});

		if (!refreshRes.ok) {
			throw new Error("SESSION_EXPIRED");
		}

		const setCookies = refreshRes.headers.getSetCookie?.() || refreshRes.headers.get("set-cookie");

		const newCookie = Array.isArray(setCookies)
			? setCookies.map((c) => c.split(";")[0]).join("; ")
			: (setCookies as string)?.split(";")[0] || "";

		setCookie(newCookie);

		// retry original request with new cookies
		const retryRes = await fetch(`${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`, {
			...options,
			credentials: "include",
			headers: {
				...headers,
				Cookie: newCookie,
			},
		});

		const data = await retryRes.json();
		return data;
	}

	return {
		request,
		setCookie,
		getCookie,
	};
}
