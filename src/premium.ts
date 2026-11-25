export const PREMIUM_API_URL = import.meta.env.DEV
	? 'https://dev-premium.ssod.org/api'
	: 'https://premium.ssod.org/api';

async function premiumRequest<T>(
	path: string,
	method: string = 'GET',
	body?: object
): Promise<T> {
	const token = localStorage.getItem('seven-spells-standalone-token');

	if (!token) {
		throw new Error('Not authenticated');
	}

	const response = await fetch(`${PREMIUM_API_URL}${path}`, {
		method,
		headers: {
			'Authorization': `Bearer ${token}`,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || data.message || 'Request failed');
	}

	return data as T;
}

export function getBiography() {
	return premiumRequest<{ bio: string }>('/character/biography');
}

export function saveBiography(bio: string) {
	return premiumRequest<{ success: boolean; bio: string }>(
		'/character/biography',
		'POST',
		{ bio }
	);
}