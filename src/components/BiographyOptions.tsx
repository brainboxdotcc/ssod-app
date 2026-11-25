import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { getBiography, saveBiography } from '../premium';

export function BiographyOptions() {
	const [editing, setEditing] = useState(false);
	const [busy, setBusy] = useState(false);
	const [bio, setBio] = useState('');
	const [error, setError] = useState('');
	const [saved, setSaved] = useState(false);

	const open = async () => {
		setBusy(true);
		setError('');
		setSaved(false);

		try {
			const result = await getBiography();
			setBio(result.bio);
			setEditing(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unable to load biography');
		} finally {
			setBusy(false);
		}
	};

	const save = async () => {
		setBusy(true);
		setError('');

		try {
			const result = await saveBiography(bio);
			setBio(result.bio);
			setEditing(false);
			setSaved(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unable to save biography');
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="premium-benefit">
			<h3><ScrollText size={18} /> Character biography</h3>
			<p>Tell other adventurers about your character and their history.</p>

			{editing ? (
				<form
					className="premium-rename-form"
					onSubmit={(e) => {
						e.preventDefault();
						void save();
					}}
				>
					<label className="premium-field">
						<span>Biography</span>
						<textarea
							value={bio}
							maxLength={2000}
							rows={8}
							disabled={busy}
							placeholder="Enter your character biography..."
							onChange={(e) => setBio(e.target.value)}
						/>
					</label>

					<div className="premium-character-count">
						{bio.length} / 2000
					</div>

					<div className="premium-actions">
						<button
							className="premium-action"
							type="submit"
							disabled={busy}
						>
							{busy ? 'Saving...' : 'Save biography'}
						</button>

						<button
							className="premium-action"
							type="button"
							disabled={busy}
							onClick={() => {
								setEditing(false);
								setError('');
							}}
						>
							Cancel
						</button>
					</div>
				</form>
			) : (
				<button
					className="premium-action"
					type="button"
					disabled={busy}
					onClick={() => void open()}
				>
					{busy ? 'Loading...' : 'Edit biography'}
				</button>
			)}

			{error && (
				<div className="premium-error" role="alert">{error}</div>
			)}

			{saved && (
				<div className="premium-success" role="status">
					Your biography has been updated.
				</div>
			)}
		</div>
	);
}