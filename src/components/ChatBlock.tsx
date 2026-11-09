import { useState } from 'react';
import { AnsiBlock } from '../rendering/ansi';
import { spriteText } from '../rendering/sprites';
import { installationToken } from '../standalone';

const BLOCK_KEY = 'seven-spells-blocked-chat-users';

function blockedUsers(): string[] {
	try {
		const saved = JSON.parse(localStorage.getItem(BLOCK_KEY) || '[]');
		return Array.isArray(saved) ? saved.filter((name): name is string => typeof name === 'string') : [];
	} catch { return []; }
}

// Usernames in chat are blue ANSI spans, not Discord identifiers.
function chatUsername(line: string): string | null {
	const match = /\x1b\[(?:[0-9;]*;)?(?:34|94)m([^\x1b\n]+)/.exec(line);
	return match ? match[1].replace(/^[<\s]+|[>\s]+$/g, '') : null;
}

export function ChatBlock({ text, onProfile, response, currentUsername }: {
	text: string;
	onProfile: (username: string) => void;
	response: unknown;
	currentUsername: string | null;
}) {
	const [blocked, setBlocked] = useState(blockedUsers);
	const [selected, setSelected] = useState<{ username: string; line: string } | null>(null);
	const [reportStatus, setReportStatus] = useState('');
	const isOwnMessage = selected !== null && currentUsername !== null &&
		selected.username.trim().toLocaleLowerCase() === currentUsername.trim().toLocaleLowerCase();

	const block = (username: string) => {
		const next = [...new Set([...blocked, username])];
		localStorage.setItem(BLOCK_KEY, JSON.stringify(next));
		setBlocked(next);
		setSelected(null);
	};

	const report = async () => {
		if (!selected || isOwnMessage) return;
		setReportStatus('Sending report…');
		try {
			const result = await fetch('https://admin.ssod.org/api/chat-reporting', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reporter: installationToken(),
					reportee: selected.username,
					message: selected.line.replace(/\x1b\[[0-9;]*m/g, ''),
					interaction: response,
				}),
			});
			if (!result.ok) throw new Error(`HTTP ${result.status}`);
			setReportStatus('Report sent.');
			setSelected(null);
		} catch {
			setReportStatus('Could not send report.');
		}
	};

	return <div className="chat-block">
		<div className="chat-lines">{text.split('\n').filter(line => {
			const name = chatUsername(line);
			return !name || !blocked.includes(name);
		}).map((line, index) => {
			const username = chatUsername(line);
			return <span key={index} className="chat-line">
				<AnsiBlock text={line} onBlueText={username ? value => <button type="button" className="chat-username" onClick={() => { setSelected({ username, line }); setReportStatus(''); }}>{spriteText(value)}</button> : undefined} />
				</span>;
		})}</div>
		{selected && <div className="chat-user-menu" role="group" aria-label={`Actions for ${selected.username}`}>
			<strong>{selected.username}</strong>
			<button type="button" onClick={() => { onProfile(selected.username); setSelected(null); }}>Profile</button>
			<button type="button" onClick={() => block(selected.username)} disabled={isOwnMessage}>Block</button>
			<button type="button" onClick={report} disabled={isOwnMessage} className="chat-menu-report">Report message</button>
			{isOwnMessage && <div className="chat-report-notice">You cannot report yourself</div>}
			{reportStatus && <div className="chat-report-status" role="status">{reportStatus}</div>}
			<button type="button" className="chat-menu-close" aria-label="Close menu" onClick={() => setSelected(null)}>×</button>
		</div>}
		{reportStatus && <div role="status">{reportStatus}</div>}
	</div>;
}
