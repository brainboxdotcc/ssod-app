import './TitleScreen.css';
import { APP_VERSION } from '../version';

export function TitleScreen({ onContinue }: { onContinue: () => void }) {
	return (
		<div className="title-screen">
			<div className="title-screen-content">
				<img src="/logo.png" alt="Seven Spells of Destruction" />
				<h1>Welcome to Cryptillia</h1>
				<p>There are stories yet to be told.</p>
				<button type="button" onClick={onContinue}>
					Click to Continue
				</button>
			</div>
			<span className="title-screen-version">v{APP_VERSION}</span>
		</div>
	);
}