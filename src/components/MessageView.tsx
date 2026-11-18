import React from 'react';
import type { Message, Interaction } from '../types';
import { EmbedView } from './EmbedView';
import { ComponentView } from './ComponentView';
import { rich } from '../rendering/rich';

export function MessageView({ message, dispatch, chat }: { message: Message; dispatch: (i: Interaction) => void; chat?: { onProfile: (username: string) => void; response: unknown; currentUsername: string | null } }) {
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

			<div className="message-components">
				{(() => {
					const components = message.components || [];

					const buttons = components.flatMap(c =>
						c.type === 1 ? (c.components || []) : []
					);

					const yellow = buttons.filter(c => c.type === 2 && c.style === 1);
					const red = buttons.filter(c => c.type === 2 && c.style === 4);
					const other = buttons.filter(c => !(c.type === 2 && (c.style === 1 || c.style === 4)));
					const hasInventory = buttons.some(c => c.type === 2 && c.label === 'Inventory');

					if ((yellow.length > 0 || red.length > 0) && hasInventory && components.every(c => c.type === 1)) {
						return (
							<div className="message-components">
								{yellow.length > 0 && (
									<div className="action-row">
										{yellow.map((c, i) => (
											<ComponentView key={i} component={c} dispatch={dispatch} />
										))}
									</div>
								)}
								{red.length > 0 && (
									<div className="action-row">
										{red.map((c, i) => (
											<ComponentView key={i} component={c} dispatch={dispatch} />
										))}
									</div>
								)}
								{other.length > 0 && (
									<div className="action-row">
										{other.map((c, i) => (
											<ComponentView key={i} component={c} dispatch={dispatch} />
										))}
									</div>
								)}
							</div>
						);
					}

					return components.map((c, i) => (
						<ComponentView key={`${message.id || 'message'}-${i}`} component={c} dispatch={dispatch} />
					));
				})()}
			</div>
		</div>
	);
}
