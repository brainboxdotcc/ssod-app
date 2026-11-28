import { useState } from 'react';
import { Crown, FlaskConical, Compass, ShieldOff } from 'lucide-react';
import { SelectView } from './SelectView';
import { BiographyOptions } from './BiographyOptions';
import { PortraitOptions } from './PortraitOptions';
import { Capacitor } from '@capacitor/core';

type PremiumOptionsProps = {
	onRename: (item: string, name: string) => void;
	onSearch: (query: string) => void;
	disabled: boolean;
	equipmentChoices: { name: string; value: string }[];
};

export function PremiumOptions({
	onRename,
	onSearch,
	disabled,
	equipmentChoices
}: PremiumOptionsProps) {
	const [item, setItem] = useState('');
	const [name, setName] = useState('');

	return (
		<section className="premium-options">
			<h2><Crown size={20} /> Premium Benefits</h2>

			{Capacitor.isNativePlatform() && (
				<div className="premium-benefit">
					<h3><ShieldOff size={18} /> No adverts</h3>
					<p>Enjoy uninterrupted adventures without adverts, even when your character dies.</p>
				</div>
			)}

			<div className="premium-benefit">
				<h3><Compass size={18} /> Premium content</h3>
				<p>Explore exclusive areas, quests and rewards throughout Cryptillia.</p>
			</div>

			<div className="premium-benefit">
				<h3><FlaskConical size={18} /> Daily potion drops</h3>
				<p>Receive automatic skill and stamina potion drops twice daily when you run out.</p>
			</div>

			<div className="premium-benefit">
				<h3>Rename equipment</h3>
				<p>Give your weapons and armour unique names, visible during combat.</p>

				<form className="premium-rename-form" onSubmit={(e) => {
					e.preventDefault();

					if (!disabled && item && name.trim()) {
						onRename(item, name.trim());
					}
				}}>
					<div className="premium-field">
						<span>Equipment</span>

						<SelectView
							component={{
								type: 3,
								custom_id: 'rename_item',
								placeholder: 'Select equipment',
								min_values: 1,
								max_values: 1,
								disabled
							}}
							options={equipmentChoices.map((choice) => ({
								label: choice.name,
								value: choice.value
							}))}
							onSearch={onSearch}
							dispatch={(interaction) => {
								setItem(interaction.values?.[0] ?? '');
							}}
						/>
					</div>

					<label className="premium-field">
						<span>New equipment name</span>
						<input
							type="text"
							value={name}
							placeholder="Enter a new name"
							maxLength={20}
							disabled={disabled}
							onChange={(e) => setName(e.target.value)}
						/>
					</label>

					<button
						className="premium-action"
						type="submit"
						disabled={disabled || !item || !name.trim()}
					>
						Rename equipment
					</button>
				</form>
			</div>

			<PortraitOptions disabled={disabled} />

			<BiographyOptions />
		</section>
	);
}