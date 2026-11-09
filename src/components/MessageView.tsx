import React from 'react';
import type { Message, Interaction } from '../types';
import { EmbedView } from './EmbedView';
import { ComponentView } from './ComponentView';
import { rich } from '../rendering/rich';

export function MessageView({ message, dispatch, chat }: { message: Message; dispatch: (i: Interaction) => void; chat?: { onProfile: (username: string) => void; response: unknown } }) {
	return (
		<div className="message">
			{message.content && <div className="message-content">{rich(message.content)}</div>}

			{message.embeds?.map((e, i) => (
				<EmbedView key={i} embed={e} chat={i === 1 ? chat : undefined} />
			))}

			{message.attachments?.map((a) => (
				<a className="attachment" href={a.url} key={a.id} target="_blank" rel="noopener noreferrer">
					📎 {a.filename}
				</a>
			))}

			{message.components?.map((c, i) => (
				<ComponentView key={`${message.id || 'message'}-${i}`} component={c} dispatch={dispatch} />
			))}
		</div>
	);
}
