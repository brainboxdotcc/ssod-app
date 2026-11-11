/** Discord-shaped payload subset, intentionally preserving API field names and numeric component types. */

export type Emoji = {
	name?: string;
	id?: string | null;
	animated?: boolean;
};

export type SelectOption = {
	label: string;
	value: string;
	description?: string;
	emoji?: Emoji;
	default?: boolean;
};

export type Component = {
	type: number;
	custom_id?: string;
	style?: number;
	label?: string;
	emoji?: Emoji;
	disabled?: boolean;
	url?: string;
	sku_id?: string;
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	options?: SelectOption[];
	components?: Component[];
	component?: Component;
	value?: string;
	required?: boolean;
	min_length?: number;
	max_length?: number;
	content?: string;
	accessory?: Component;
	media?: { url: string };
	items?: Array<{ media: { url: string }; description?: string }>;
	spoiler?: boolean;
	accent_color?: number;
	description?: string;
};

export type Embed = {
	title?: string;
	description?: string;
	url?: string;
	color?: number;
	author?: {
		name: string;
		url?: string;
		icon_url?: string;
	};
	thumbnail?: { url: string };
	image?: { url: string };
	fields?: Array<{
		name: string;
		value: string;
		inline?: boolean;
	}>;
	footer?: {
		text: string;
		icon_url?: string;
	};
	timestamp?: string;
};

export type Message = {
	nonce?: string;
	id?: string;
	content?: string;
	embeds?: Embed[];
	components?: Component[];
	flags?: number;
	attachments?: Array<{
		id: string;
		filename: string;
		url: string;
		content_type?: string;
	}>;
};

export type Modal = {
	custom_id: string;
	title: string;
	components: Component[];
};

export type Interaction = {
	custom_id: string;
	values?: string[];
	fields?: Record<string, string>;
};

export type Response = { type: 'message'; message: Message } | { type: 'modal'; modal: Modal };
