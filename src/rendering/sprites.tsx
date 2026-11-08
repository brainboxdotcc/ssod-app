import React from 'react';
import type { Emoji } from '../types';

const spriteBase = 'https://admin.ssod.org/img/icons/';

export function Sprite({ name }: { name: string }) {
	const filename = name.length === 2 && name.endsWith('_') ? name.slice(0, -1) : name;

	if (!/^[a-zA-Z0-9_]+$/.test(filename)) {
		return <>{name}</>;
	}

	return <img className="sprite" src={`${spriteBase}${filename}.png`} alt={`:${name}:`} title={`:${name}:`} />;
}

export function EmojiView({ emoji }: { emoji?: Emoji }) {
	if (!emoji?.name) {
		return null;
	}

	return emoji.id ? <Sprite name={emoji.name} /> : <>{emoji.name}</>;
}

export function spriteText(text: string): React.ReactNode {
	const parts = text.split(/(<a?:[a-zA-Z0-9_]+:\d+>)/g);

	return parts.map((part, i) => {
		const match = /^<a?:([a-zA-Z0-9_]+):\d+>$/.exec(part);

		return match ? <Sprite key={i} name={match[1]} /> : part;
	});
}
