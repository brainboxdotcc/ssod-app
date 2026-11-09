const TOKEN_KEY = 'seven-spells-standalone-token';

export function installationToken(): string {
	let token = localStorage.getItem(TOKEN_KEY);

	if (token && /^[0-9a-f]{64}$/.test(token)) {
		return token;
	}

	const bytes = crypto.getRandomValues(new Uint8Array(32));
	token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

	localStorage.setItem(TOKEN_KEY, token);
	return token;
}

export function restoreInstallationToken(token: string): boolean {
	const value = token.trim().toLowerCase();
	if (!/^[0-9a-f]{64}$/.test(value)) return false;
	localStorage.setItem(TOKEN_KEY, value);
	return true;
}

export function connectStandalone(
	url: string,
	onStatus: (status: string) => void,
	onResponse: (response: unknown) => void
): { send: (payload: unknown) => void; close: () => void; retry: () => void } {
	let socket: WebSocket | null = null;
	let authenticated = false;
	let stopped = false;
	let rejected = false;
	let attempts = 0;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;
	let authTimer: ReturnType<typeof setTimeout> | null = null;

	const clearTimers = () => {
		if (retryTimer !== null) clearTimeout(retryTimer);
		if (authTimer !== null) clearTimeout(authTimer);
		retryTimer = null;
		authTimer = null;
	};

	const connect = () => {
		if (stopped || rejected) return;
		clearTimers();
		authenticated = false;
		onStatus(attempts ? 'Reconnecting' : 'Connecting');

		let current: WebSocket;
		try {
			current = new WebSocket(url);
		} catch {
			scheduleRetry();
			return;
		}
		socket = current;

		current.addEventListener('open', () => {
			if (stopped || current !== socket) return;
			current.send(JSON.stringify({ type: 'auth', token: installationToken() }));
			onStatus('Authenticating');
			authTimer = setTimeout(() => {
				if (current === socket && !authenticated) current.close();
			}, 10000);
		});

		current.addEventListener('message', (event) => {
			if (stopped || current !== socket) return;
			try {
				const response: unknown = JSON.parse(event.data);
				if (typeof response !== 'object' || response === null) return;
				const data = response as Record<string, unknown>;

				if (data.type === 'authenticated') {
					authenticated = true;
					attempts = 0;
					if (authTimer !== null) clearTimeout(authTimer);
					authTimer = null;
					onStatus('Connected');
				} else if (typeof data.error === 'string') {
					if (!authenticated) {
						rejected = true;
						onStatus(`Error: ${data.error}`);
						current.close();
					} else {
						onResponse(response);
					}
				} else if (authenticated) {
					onResponse(response);
				}
			} catch {
				if (!authenticated) {
					onStatus('Error: Invalid authentication response');
					current.close();
				}
			}
		});

		current.addEventListener('error', () => {
			if (stopped || current !== socket || rejected) return;
			onStatus('Connection error');
		});

		current.addEventListener('close', () => {
			if (current !== socket) return;
			socket = null;
			authenticated = false;
			if (authTimer !== null) clearTimeout(authTimer);
			authTimer = null;
			if (stopped || rejected) return;
			scheduleRetry();
		});
	};

	const scheduleRetry = () => {
		if (stopped || rejected) return;
		const delay = Math.min(2000 * 2 ** Math.min(attempts, 4), 30000);
		const jitter = delay * (0.8 + Math.random() * 0.4);
		attempts++;
		onStatus('Reconnecting');
		retryTimer = setTimeout(connect, jitter);
	};

	connect();

	return {
		send: (payload) => {
			if (!authenticated || socket?.readyState !== WebSocket.OPEN) return;
			socket.send(JSON.stringify(payload));
		},
		close: () => {
			stopped = true;
			clearTimers();
			socket?.close();
			socket = null;
		},
		retry: () => {
			if (stopped) return;
			rejected = false;
			attempts = 0;
			clearTimers();
			const old = socket;
			socket = null;
			old?.close();
			connect();
		},
	};
}
