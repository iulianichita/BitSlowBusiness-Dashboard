export const fetchWithRefresh = async (url: string, options: RequestInit) => {
	let response = await fetch(url, options);

	if (response.status === 401) {
		// expired acces token
		const refreshResponse = await fetch("/api/refresh", {
			method: "GET",
			headers: { Authentificate: `${response.headers.get("Authentificate")}` },
			credentials: "include",
		});

		if (refreshResponse.ok) {
			const { accessToken } = await refreshResponse.json();

			options.headers = {
				...options.headers,
				Authentificate: `${accessToken}`,
			};
			response = await fetch(url, options);
		}
	}

	return response;
};
