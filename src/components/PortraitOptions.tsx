import { useEffect, useRef, useState } from 'react';
import { Image } from 'lucide-react';
import { installationToken } from '../standalone';

const API_BASE = import.meta.env.DEV
	? 'https://dev-premium.ssod.org'
	: 'https://premium.ssod.org';

export function PortraitOptions({ disabled = false }: { disabled?: boolean }) {
	const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const fileInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const controller = new AbortController();

		const loadPortrait = async () => {
			try {
				const response = await fetch(`${API_BASE}/api/character/biography`, {
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${installationToken()}`
					},
					signal: controller.signal
				});

				if (!response.ok) {
					throw new Error('Unable to load character portrait.');
				}

				const data = await response.json();

				if (!controller.signal.aborted) {
					setPortraitUrl(data.portrait_url ?? null);
				}
			} catch (error) {
				if (!controller.signal.aborted) {
					setError(error instanceof Error ? error.message : 'Unable to load portrait.');
				}
			}
		};

		void loadPortrait();

		return () => controller.abort();
	}, []);

	const uploadPortrait = async (file: File) => {
		if (disabled || uploading) {
			return;
		}

		setError('');
		setSuccess('');

		if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
			setError('Please select a JPEG, PNG, GIF or WebP image.');
			return;
		}

		if (file.size > 8 * 1024 * 1024) {
			setError('Your portrait must be no larger than 8 MB.');
			return;
		}

		setUploading(true);

		try {
			const formData = new FormData();
			formData.append('portrait', file);

			const response = await fetch(`${API_BASE}/api/character/portrait`, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${installationToken()}`
				},
				body: formData
			});

			const data = await response.json().catch(() => null);

			if (!response.ok || !data?.success || !data.portrait_url) {
				throw new Error(
					data?.errors?.portrait?.[0]
					?? data?.message
					?? 'Unable to upload character portrait.'
				);
			}

			setPortraitUrl(data.portrait_url);
			setSuccess('Your character portrait has been updated.');
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unable to upload portrait.');
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="premium-benefit">
			<h3><Image size={18} /> Character portrait</h3>
			<p>Upload a custom image to personalise your character profile.</p>

			{portraitUrl && (
				<img
					className="premium-portrait-preview"
					src={portraitUrl}
					alt="Your character portrait"
				/>
			)}

			<p className="premium-portrait-hint">
				JPEG, PNG, GIF or WebP. Maximum file size: 8 MB.
			</p>

			<input
				ref={fileInput}
				type="file"
				accept="image/jpeg,image/png,image/gif,image/webp"
				hidden
				disabled={disabled || uploading}
				onChange={(e) => {
					const file = e.currentTarget.files?.[0];
					e.currentTarget.value = '';

					if (file) {
						void uploadPortrait(file);
					}
				}}
			/>

			<button
				className="premium-action"
				type="button"
				disabled={disabled || uploading}
				onClick={() => fileInput.current?.click()}
			>
				{uploading ? 'Uploading portrait…' : 'Change portrait'}
			</button>

			{error && (
				<p className="premium-portrait-error" role="alert">{error}</p>
			)}

			{success && (
				<p className="premium-portrait-success" role="status">{success}</p>
			)}
		</div>
	);
}