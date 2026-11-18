import React from 'react';
import type { Component, Interaction } from '../types';
import { EmojiView, spriteText } from '../rendering/sprites';
import { rich } from '../rendering/rich';
import { SelectView } from './SelectView';
import { ButtonTooltip } from './ButtonTooltip';
import { Globe } from 'lucide-react';

export function ComponentView({
	component: c,
	dispatch,
}: {
	component: Component;
	dispatch: (i: Interaction) => void;
}) {
	switch (c.type) {
		case 1:
			return (
				<div className="action-row">
					{c.components?.map((child, i) => (
						<ComponentView key={i} component={child} dispatch={dispatch} />
					))}
				</div>
			);

		case 2:
			return c.style === 5 ? (
				<ButtonTooltip label={c.label}>
					<a className="discord-button style-5" href={c.url || '#'} target="_blank" rel="noopener noreferrer">
						<Globe size={16} color="#68baff" />
						{c.label && spriteText(c.label)}
					</a>
				</ButtonTooltip>
			) : (
				<ButtonTooltip label={c.label} emoji={c.emoji?.name}>
					<button
						disabled={c.disabled}
						className={`discord-button style-${c.style || 2}`}
						onClick={() => dispatch({ custom_id: c.custom_id || '' })}
					>
						{c.emoji?.name && (
							<span className="emoji">
								<EmojiView emoji={c.emoji} />
							</span>
						)}
						{c.label && spriteText(c.label)}
					</button>
				</ButtonTooltip>
			);

		case 3:
		case 5:
		case 6:
		case 7:
		case 8: {
			const options = c.options || [];

			return <SelectView component={c} options={options} dispatch={dispatch} />;
		}

		case 10:
			return <div className="text-display">{rich(c.content || '')}</div>;

		case 12:
			return (
				<div className="media-gallery">
					{c.items?.map((item, i) => (
						<img key={i} src={item.media.url} alt={item.description || 'Gallery image'} />
					))}
				</div>
			);

		case 14:
			return <hr className="component-divider" />;

		case 9:
			return (
				<div className="section">
					<div className="section-text">
						{c.components?.map((child, i) => (
							<ComponentView key={i} component={child} dispatch={dispatch} />
						))}
					</div>
					{c.accessory && <ComponentView component={c.accessory} dispatch={dispatch} />}
				</div>
			);

		case 17:
			return (
				<div
					className="v2-container"
					style={{
						borderLeftColor:
							c.accent_color === undefined ? 'transparent' : `#${c.accent_color.toString(16).padStart(6, '0')}`,
					}}
				>
					{c.components?.map((child, i) => (
						<ComponentView key={i} component={child} dispatch={dispatch} />
					))}
				</div>
			);

		default:
			return <div className="unsupported">Unsupported component type {c.type}</div>;
	}
}
