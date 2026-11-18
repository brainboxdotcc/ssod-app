import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

const descriptions: Record<string, string> = {
	'Inventory': 'View the items, equipment and supplies you are carrying.',
	'Spells': 'View your known spells and magical abilities.',
	'Go Hunting': 'Search the surrounding area for creatures to hunt.',
	'Quest Log': 'Review your active and completed quests.',
	'Get Help': 'Get help with your current situation.',
	'Cook Food': 'Set up camp and cook ingredients you have obtained from hunting.',
};

const emojiDescriptions: Record<string, string> = {
	'♻': 'Refresh the current location.',
	'💬': 'Open the chat.',
};

export function ButtonTooltip({
	label,
	emoji,
	children,
}: {
	label?: string;
	emoji?: string;
	children: React.ReactElement;
}) {
	const description = label
		? descriptions[label]
		: emoji
			? emojiDescriptions[emoji]
			: undefined;

	if (!description) {
		return children;
	}

	return (
		<Tooltip.Provider delayDuration={1000}>
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					{children}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={8}
						className="button-tooltip"
					>
						{description}
						<Tooltip.Arrow className="button-tooltip-arrow" />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
}