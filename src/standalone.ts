const TOKEN_KEY = 'seven-spells-standalone-token';

function installationToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);

  if (token && /^[0-9a-f]{64}$/.test(token)) {
    return token;
  }

  const bytes = crypto.getRandomValues(new Uint8Array(32));
  token = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function connectStandalone(
  url: string,
  onStatus: (status: string) => void,
  onResponse: (response: unknown) => void
): { send: (payload: unknown) => void; close: () => void } {
  const socket = new WebSocket(url);
  let authenticated = false;

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'auth', token: installationToken() }));
    onStatus('Authenticating');
  });

  socket.addEventListener('message', event => {
    try {
      const response: unknown = JSON.parse(event.data);

      if (typeof response !== 'object' || response === null) {
        return;
      }

      const data = response as Record<string, unknown>;

      if (data.type === 'authenticated') {
        authenticated = true;
        onStatus('Connected');
      } else if (typeof data.error === 'string') {
        onStatus(`Error: ${data.error}`);
      } else {
        onResponse(response);
      }
    } catch {
      onStatus('Invalid server response');
    }
  });

  socket.addEventListener('error', () => {
    onStatus('Connection error');
  });

  socket.addEventListener('close', () => {
    authenticated = false;
    onStatus('Disconnected');
  });

  return {
    send: payload => {
      if (!authenticated || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      socket.send(JSON.stringify(payload));
    },

    close: () => socket.close()
  };
}