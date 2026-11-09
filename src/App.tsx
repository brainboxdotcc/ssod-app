import { useEffect, useRef, useState } from 'react';
import { BookOpen, Compass, Menu, Volume2, VolumeX, ScrollText, Code2, Trophy, Map, KeyRound, X, Trash2, ShieldCheck, FileText } from 'lucide-react';
import type { Interaction, Message, Modal } from './types';
import { connectStandalone, restoreInstallationToken } from './standalone';
import { MessageView } from './components/MessageView';
import { ModalView } from './components/ModalView';
import { AccountRecovery } from './components/AccountRecovery';
import './chat.css';

export function App() {
	const [connectionStatus, setConnectionStatus] = useState('Connecting');
	const [message, setMessage] = useState<Message>({});
	const [modal, setModal] = useState<Modal | null>(null);
	const [log, setLog] = useState<string[]>([]);
	const [showJson, setShowJson] = useState(false);
	const [developerUnlocked, setDeveloperUnlocked] = useState(false);
	const developerClicks = useRef(0);
	const [lastResponse, setLastResponse] = useState<unknown>(null);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [currentUsername, setCurrentUsername] = useState<string | null>(null);
	const [muted, setMuted] = useState(true);
	const [menu, setMenu] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [activeCommand, setActiveCommand] = useState('start');
	const socket = useRef<ReturnType<typeof connectStandalone> | null>(null);
	const messageId = useRef<string | undefined>(undefined);
	const currentUserIdRef = useRef<number | null>(null);

	const [interactionPending, setInteractionPending] = useState(false);
	const [interactionError, setInteractionError] = useState('');
	const pendingRef = useRef(false);
	const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const finishInteraction = () => {
		if (pendingTimeout.current !== null) clearTimeout(pendingTimeout.current);
		pendingTimeout.current = null;
		pendingRef.current = false;
		setInteractionPending(false);
	};

	const beginInteraction = () => {
		if (pendingRef.current || connectionStatus !== 'Connected' || !socket.current) return false;
		pendingRef.current = true;
		setInteractionPending(true);
		setInteractionError('');
		pendingTimeout.current = setTimeout(() => {
			finishInteraction();
			setInteractionError('The server did not respond. Please try again.');
		}, 10000);
		return true;
	};

	useEffect(() => {
		const connection = connectStandalone(
			import.meta.env.VITE_GAME_WS_URL,
			(status) => {
				setConnectionStatus(status);
				if (status === 'Connected') setInteractionError('');
				if (status !== 'Connected' && pendingRef.current) {
					finishInteraction();
					setInteractionError('Connection lost. Please try again when connected.');
				}
			},
			(response) => {
				setLastResponse(response);
				if (!response || typeof response !== 'object') return;
				const packet = response as Record<string, unknown>;
				if (typeof packet.ssod_user_id === 'number') {
					if (currentUserIdRef.current !== packet.ssod_user_id) {
						setCurrentUsername(null);
						currentUserIdRef.current = packet.ssod_user_id;
					}
					setCurrentUserId(packet.ssod_user_id);
				}
				if (typeof packet.ssod_username === 'string') {
					setCurrentUsername(packet.ssod_username);
				}
				const isObject = (value: unknown): value is Record<string, unknown> =>
					typeof value === 'object' && value !== null && !Array.isArray(value);
				const isMessage = (value: Record<string, unknown>) =>
					['content', 'embeds', 'components', 'attachments', 'flags'].some((field) => field in value);
				const findMessage = (value: unknown, depth = 0): Record<string, unknown> | null => {
					if (!isObject(value) || depth > 4) return null;
					if (isMessage(value)) return value;
					for (const field of ['data', 'message', 'response', 'payload', 'body']) {
						if (field in value) {
							const found = findMessage(value[field], depth + 1);
							if (found) return found;
						}
					}
					return null;
				};
				const callbackType = typeof packet.type === 'number' ? packet.type : undefined;
				const body = isObject(packet.data) ? packet.data : packet;
				if (
					callbackType === 9 ||
					(typeof body.custom_id === 'string' && typeof body.title === 'string' && Array.isArray(body.components))
				) {
					finishInteraction();
					setModal(body as Modal);
					return;
				}
				const incoming = findMessage(packet);
				if (!incoming) return;
				if (typeof incoming.id === 'string') messageId.current = incoming.id;
				setMessage((current) => ({ ...current, ...incoming }));
				setModal(null);
				finishInteraction();
			}
		);
		socket.current = connection;
		return () => {
			socket.current = null;
			if (pendingTimeout.current !== null) clearTimeout(pendingTimeout.current);
			pendingTimeout.current = null;
			pendingRef.current = false;
			connection.close();
		};
	}, []);


	const restoreAccount = (code: string): boolean => {
		try {
			if (!restoreInstallationToken(code)) return false;
		} catch {
			return false;
		}

		finishInteraction();
		setInteractionError('');
		setMessage({});
		setModal(null);
		setLastResponse(null);
		setCurrentUserId(null);
		currentUserIdRef.current = null;
		setCurrentUsername(null);
		setLog([]);
		messageId.current = undefined;
		setActiveCommand('start');
		setConnectionStatus('Connecting');
		setAccountOpen(false);
		socket.current?.retry();

		return true;
	};

	const navigate = (command: string) => {
		if (!beginInteraction()) return;
		setActiveCommand(command);
		setModal(null);
		setMenu(false);
		messageId.current = undefined;
		socket.current?.send({ type: 2, data: { type: 1, name: command } });
	};

	const openChatProfile = (username: string) => {
		if (!beginInteraction()) return;
		setActiveCommand('profile');
		setModal(null);
		messageId.current = undefined;
		socket.current?.send({ type: 2, data: { type: 1, name: 'profile', options: [{ type: 3, name: 'username', value: username }] } });
	};

	const dispatch = (interaction: Interaction) => {
		if (!beginInteraction()) {
			return;
		}
		setLog((l) =>
			[`${interaction.custom_id}${interaction.values ? ` → ${interaction.values.join(', ')}` : ''}`, ...l].slice(0, 8)
		);
		if (interaction.fields) {
			const components =
				modal?.components.map((c) => {
					if (c.type === 18 && c.component) {
						return {
							type: 18,
							component: {
								type: c.component.type,
								custom_id: c.component.custom_id,
								value: interaction.fields?.[c.component.custom_id || ''] || '',
							},
						};
					}
					if (c.type === 1) {
						return {
							type: 1,
							components: (c.components || [])
								.filter((child) => child.type === 4)
								.map((child) => ({
									type: 4,
									custom_id: child.custom_id,
									value: interaction.fields?.[child.custom_id || ''] || '',
								})),
						};
					}
					return { type: c.type, custom_id: c.custom_id, value: interaction.fields?.[c.custom_id || ''] || '' };
				}) || [];
			socket.current?.send({ type: 5, data: { custom_id: interaction.custom_id, components } });
			setModal(null);
		} else {
			socket.current?.send({
				type: 3,
				message_id: messageId.current,
				data: {
					component_type: interaction.values ? 3 : 2,
					custom_id: interaction.custom_id,
					...(interaction.values ? { values: interaction.values } : {}),
				},
			});
		}
	};

	return (
		<div className="app">
			<aside className={`sidebar ${menu ? 'open' : ''}`}>
				<div className="brand" onClick={() => {
					if (!developerUnlocked && ++developerClicks.current >= 5) {
						setDeveloperUnlocked(true);
					}
				}}>
					<img src="/logo.png" alt="Seven Spells Of Destruction" />
					<div>
						<strong>SEVEN SPELLS</strong>
						<span>OF DESTRUCTION</span>
					</div>
				</div>
				<div className="sidebar-label">GAME</div>
				{(
					[
						['start', Compass, 'Adventure'],
						['profile', ScrollText, 'Profile'],
						['map', Map, 'Map'],
						['lore', BookOpen, 'Lore'],
						['achievements', Trophy, 'Achievements'],
					] as const
				).map(([command, Icon, label]) => (
					<button
						key={command}
						className={`nav-item ${activeCommand === command ? 'active' : ''}`}
						disabled={connectionStatus !== 'Connected' || interactionPending}
						onClick={() => navigate(command)}
					>
						<Icon size={17} />
						{label}
					</button>
				))}
				<div className="sidebar-label">ACCOUNT</div>
				<button className="nav-item" onClick={() => { setAccountOpen(true); setMenu(false); }}>
					<KeyRound size={17} /> Account recovery
				</button>
				{currentUsername && (
					<button
						className="nav-item"
						disabled={connectionStatus !== 'Connected' || interactionPending}
						onClick={() => navigate('reset')}
					>
						<Trash2 size={17} /> Delete Account
					</button>
				)}
				<button className="nav-item" onClick={() => window.open('https://www.ssod.org/privacy-policy', '_blank', 'noopener,noreferrer')}>
					<ShieldCheck size={17} /> Privacy Policy
				</button>
				<button className="nav-item" onClick={() => window.open('https://www.ssod.org/terms-of-service', '_blank', 'noopener,noreferrer')}>
					<FileText size={17} /> Terms of Service
				</button>				
				<div className="sidebar-bottom">
					<div className={`online-dot ${connectionStatus === 'Connected' ? '' : 'offline'}`} />
					{connectionStatus}
					<br />
					<span>{currentUsername ? `Connected as: ${currentUsername}` : currentUserId !== null ? `Account ID: ${currentUserId}` : 'Character not identified'}</span>
				</div>
			</aside>

			{menu && <div className="mobile-shade" onClick={() => setMenu(false)} />}

			<main className="main">
				<header className="topbar">
					<button className="mobile-menu icon-button" onClick={() => setMenu(true)} aria-label="Open menu">
						<Menu size={22} />
					</button>
					<div className="top-title">
						<span className="eyebrow">THE SEVEN SPELLS OF DESTRUCTION</span>
						<strong>
							{(
								{
									start: 'Adventure',
									profile: 'Profile',
									lore: 'Lore',
								} as Record<string, string>
							)[activeCommand] || 'Seven Spells'}
						</strong>
					</div>
					<div className="top-actions">
						{developerUnlocked && (
							<button className="icon-button" onClick={() => setShowJson((v) => !v)} title="Toggle payload inspector">
								<Code2 size={19} />
							</button>
						)}
						<button
							className="icon-button"
							onClick={() => setMuted((v) => !v)}
							title="Audio placeholder (not implemented)"
						>
							{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
						</button>
					</div>
				</header>

				{connectionStatus !== 'Connected' && (
					<div className="connection-banner" role="status">
						<span>{connectionStatus === 'Reconnecting' ? 'Connection lost. Reconnecting automatically…' :
							connectionStatus === 'Connecting' || connectionStatus === 'Authenticating' ?
								'Connecting to Seven Spells…' :
								connectionStatus.startsWith('Error:') ? connectionStatus :
								'Not connected to Seven Spells.'}</span>
						<button type="button" onClick={() => socket.current?.retry()}>Retry now</button>
					</div>
				)}
				{interactionPending && <div role="status">Waiting for Seven Spells…</div>}
				{interactionError && <div role="alert">{interactionError}</div>}

				<div className="content">
					<div className="game-layout">
						<section className="game-panel">
							<fieldset
								disabled={interactionPending || connectionStatus !== 'Connected'}
								style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
							>
								<MessageView message={message} dispatch={dispatch} chat={activeCommand === 'start' ? { onProfile: openChatProfile, response: lastResponse, currentUsername } : undefined} />
							</fieldset>
						</section>

						{showJson && (
							<aside className="inspector">
								<div className="inspector-title">Last received WebSocket payload</div>
								<pre>{JSON.stringify(lastResponse, null, 2)}</pre>
								<div className="inspector-title">Current message JSON</div>
								<pre>{JSON.stringify(message, null, 2)}</pre>
								<div className="inspector-title">Interaction log</div>
								{log.map((line, i) => (
									<div className="log-line" key={i}>
										{line}
									</div>
								))}
							</aside>
						)}
					</div>
				</div>

				<footer className="footer">Seven Spells of Destruction · v0.1.0</footer>
			</main>

			{accountOpen && (
			<AccountRecovery
					onClose={() => setAccountOpen(false)}
					onRestore={restoreAccount}
				/>
			)}
			{modal && <ModalView key={modal.custom_id} modal={modal} close={() => setModal(null)} submit={dispatch} />}
		</div>
	);
}
