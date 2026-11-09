
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { installationToken } from '../standalone';

interface AccountRecoveryProps {
	onClose: () => void;
	onRestore: (token: string) => boolean;
}

export function AccountRecovery({ onClose, onRestore }: AccountRecoveryProps) {
	const [recoveryCode, setRecoveryCode] = useState('');
	const [recoveryError, setRecoveryError] = useState('');
	const [codeVisible, setCodeVisible] = useState(false);
	const [copyStatus, setCopyStatus] = useState('');

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	const copyRecoveryCode = async () => {
		try {
			await navigator.clipboard.writeText(installationToken());
			setCopyStatus('Copied to clipboard.');
		} catch {
			setCopyStatus('Unable to copy automatically. Reveal and select the code instead.');
		}
	};

	const restoreAccount = () => {
		const code = recoveryCode.trim().toLowerCase();

		if (!/^[0-9a-f]{64}$/.test(code)) {
			setRecoveryError('Enter a valid 64-character recovery code.');
			return;
		}

		if (code === installationToken()) {
			setRecoveryError('This recovery code belongs to the account you are currently using.');
			return;
		}

		if (!window.confirm('Replace this device’s current account? Make sure you have backed up its recovery code first.')) {
			return;
		}

		if (!onRestore(code)) {
			setRecoveryError('Unable to save the recovery code on this device.');
		}
	};

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				className="modal account-recovery"
				role="dialog"
				aria-modal="true"
				aria-label="Account recovery"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="modal-header">
					<h2>Account recovery</h2>
					<button
						type="button"
						className="icon-button"
						onClick={onClose}
						aria-label="Close account recovery"
						title="Close"
						style={{ minWidth: 44, minHeight: 44 }}
					>
						<X size={20} />
					</button>
				</div>

				<h3>Back up your account</h3>
				<p>
					Keep this code somewhere safe outside the app. You will need it after
					reinstalling or changing devices. Anyone with this code can access your account.
				</p>

				<div className="account-recovery-actions">
					<button type="button" onClick={copyRecoveryCode}>
						Copy recovery code
					</button>
					<button type="button" onClick={() => setCodeVisible((value) => !value)}>
						{codeVisible ? 'Hide code' : 'Show code'}
					</button>
				</div>

				{codeVisible && (
					<textarea
						className="account-recovery-code"
						readOnly
						value={installationToken()}
						onFocus={(event) => event.currentTarget.select()}
						aria-label="Your recovery code"
					/>
				)}

				{copyStatus && <p role="status">{copyStatus}</p>}

				<h3>Restore an account</h3>
				<p>
					Restoring another account replaces the current account on this device.
					Back up the current code first.
				</p>

				<input
					className="account-recovery-input"
					type="text"
					value={recoveryCode}
					onChange={(event) => {
						setRecoveryCode(event.target.value);
						setRecoveryError('');
					}}
					placeholder="Paste your 64-character recovery code"
					aria-label="Recovery code to restore"
					autoComplete="off"
					autoCapitalize="none"
					spellCheck={false}
				/>

				{recoveryError && (
					<p className="account-recovery-error" role="alert">
						{recoveryError}
					</p>
				)}

				<div className="modal-actions">
					<button type="button" onClick={restoreAccount}>
						Restore account
					</button>
				</div>
			</div>
		</div>
	);
}
