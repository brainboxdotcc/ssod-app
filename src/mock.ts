import type { Component, Interaction, Message, Modal, Response } from './types';
const button = (id: string, label: string, style = 2, emoji?: string, disabled = false): Component =>
  ({ type: 2, custom_id: id, label, style, disabled, ...(emoji ? { emoji: { name: emoji } } : {}) });
const row = (...components: Component[]): Component => ({ type: 1, components });
const select = (id: string, placeholder: string, options: Array<[string, string, string?]>): Component =>
  ({ type: 3, custom_id: id, placeholder, min_values: 1, max_values: 1,
    options: options.map(([label, value, description]) => ({ label, value, description })) });
const colour = 0xc4a57d;
const footer = (text: string) => ({ text: `✦  ${text}` });
const location: Message = {
  id: '1001', embeds: [{ color: colour, title: 'Port Obligan',
    description: 'As twilight descends, you arrive at **Port Obligan**. Towns like this provide a wealth of prospects for intrepid adventurers like you — ideal hubs to stockpile provisions, forge alliances, or glean invaluable information. Do you set your sights on finding a vessel willing to ferry you to **Castle Scythe** 1️⃣ or explore the bustling city 2️⃣ and unearth its secrets?',
    image: { url: '/harbour.svg' }, footer: footer('Location 6b1f4c08') },
    { color: colour, title: 'Chat', description: '`[16:20:49] *** Adventurer wanders into the location`' }],
  components: [row(button('travel', 'Ferry to Castle Scythe', 1, '1️⃣'), button('explore', 'Explore bustling city', 1, '2️⃣')),
    row(button('inventory', 'Inventory', 2, '🎒'), button('spells', 'Spells', 2, '📖'), button('hunting', 'Go Hunting', 2, '🦌')),
    row(button('quests', 'Quest Log', 2, '📜'), button('recycle', 'Refresh', 2, '♻️'), button('chat', 'Chat', 2, '💬'), button('help', 'Get Help', 5, '❔'))]
};
const inventory: Message = { id: '1002', embeds: [{ color: colour, title: 'Inventory', description: 'Your possessions, equipment and supplies.', fields: [
  { name: '🗝️ keys (x2)', value: 'A small set of lightweight metal keys on a brass keyring, that jangle lightly when moved.\n🪙 1 Value' },
  { name: '🥩 poison (x2)', value: 'Consumable: A small sachet of rat poison, possibly enough to knock out an enemy.\n🪙 1 Value' },
  { name: '🧪 stamina potion (x5)', value: 'Stamina +5: Adds to your stamina score.\n🪙 3 Value' },
  { name: '🛡️ steel shield (x2)', value: 'Armour 4: A strong, single piece steel shield.\n🪙 1 Value' },
  { name: '🎒 water canister (x2)', value: 'A small tin can used for holding water. Looks like it could hold several days worth.\n🪙 1 Value' }
], footer: footer("Adventurer's Inventory (Page 1)") }], components: [
  row(button('home', 'Back', 1, '🚪'), button('previous', '◀', 2, undefined, true), button('next', '▶', 2), button('help', 'Get Help', 5)),
  row(select('drop', 'Drop Item', [['Keys', 'keys'], ['Poison', 'poison'], ['Water canister', 'water']])),
  row(select('use', 'Use Item', [['Stamina potion', 'potion'], ['Water canister', 'water']])),
  row(select('equip', 'Equip Item', [['Steel shield', 'shield']]))
] };
const quests: Message = { id: '1003', embeds: [{ color: colour, title: 'Quest Log', description: '3 active quests, 0 completed quests', fields: [
  { name: 'The Thirsting Dunes', value: '`[SIDE QUEST]` Investigate the ancient ruins uncovered beneath the Desert of Skulls, discover the fate of those who entered before you, and uncover the secret buried within.\n\n• Descend the ancient stairway beneath the dunes. *(In Progress)*' },
  { name: 'Purchase the scroll from the vendor in Littletown', value: '`[MAIN QUEST]` A vendor selling a scroll? Make sure nobody else purchases it from him before it is too late.\n\n• Purchase the scroll from the vendor *(In Progress)*' },
  { name: 'The Seven Scrolls', value: '`[MAIN QUEST]` The seven ancient scrolls must be recovered, lest Garneth’s servants find them first.\n\n• Find the first scroll *(In Progress)*' }
], footer: footer('Page 1 of 1') }], components: [row(button('home', 'Back', 1, '🚪'), button('previous', '◀', 2, undefined, true), button('next', '▶', 2, undefined, true), button('help', 'Get Help', 5))] };
const showcase: Message = { id: '1004', content: '**Discord API component playground** — a sample payload for testing rendering and interactions.',
  embeds: [{ title: 'The Guildmaster’s Notice', url: 'https://discord.com/developers/docs/components/overview', color: 0x5865f2,
    author: { name: 'Port Obligan Adventurers’ Guild' }, description: 'This is a **rich embed** with *Markdown*, ~~strikethrough~~, `inline code`, a [link](https://discord.com/developers/docs/), fields, an image and a footer.',
    fields: [{ name: 'Skill', value: '**19**', inline: true }, { name: 'Stamina', value: '**24**', inline: true }, { name: 'Gold', value: '**132**', inline: true }, { name: 'Notice', value: 'All travellers must register before departure.' }],
    thumbnail: { url: '/crest.svg' }, image: { url: '/harbour.svg' }, footer: footer('Test embed · Discord-compatible fields'), timestamp: '2026-11-07T16:20:00Z' }],
  components: [row(button('primary', 'Primary', 1), button('secondary', 'Secondary', 2), button('success', 'Success', 3), button('danger', 'Danger', 4)),
    row({ type: 2, style: 5, label: 'Link button', url: 'https://discord.com/developers/docs/' }, button('disabled', 'Disabled', 2, undefined, true)),
    row(select('single', 'Choose a destination', [['Port Obligan', 'port', 'Return to the harbour'], ['Castle Scythe', 'castle', 'Cross the water'], ['Desert of Skulls', 'desert', 'Venture into the dunes']])),
    row({ type: 3, custom_id: 'multiple', placeholder: 'Select up to three supplies', min_values: 1, max_values: 3,
      options: ['Water', 'Rope', 'Torch', 'Rations'].map(v => ({ label: v, value: v.toLowerCase() })) }),
    row(button('open_modal', 'Open modal', 1, '📝'), button('show_v2', 'Components V2', 2))]
};
const v2: Message = { id: '1005', flags: 32768, components: [
  { type: 17, accent_color: 0xc4a57d, components: [
    { type: 10, content: '## Components V2\nA **container** with text displays, a section, a separator and interactive controls.' },
    { type: 14 },
    { type: 9, components: [{ type: 10, content: '**Castle Scythe**\nAn ancient fortress beyond the harbour.' }], accessory: button('travel', 'Travel', 1) },
    { type: 12, items: [{ media: { url: '/harbour.svg' }, description: 'Port Obligan at twilight' }] },
    { type: 10, content: '*A simple text display below the media gallery.*' },
    { type: 1, components: [button('home', 'Return', 2), button('open_modal', 'Open modal', 1)] }
  ] }
] };
const modal: Modal = { custom_id: 'character_form', title: 'Adventurer details', components: [
  row({ type: 4, custom_id: 'character_name', label: 'Character name', style: 1, required: true, min_length: 2, max_length: 32, placeholder: 'Enter your name' }),
  row({ type: 4, custom_id: 'character_story', label: 'Background', style: 2, required: false, max_length: 500, placeholder: 'Where did you come from?' })
] };
export const samples = { location, inventory, quests, showcase, v2 };
export type Screen = keyof typeof samples;
export function simulate(input: Interaction, current: Screen): Response {
  const id = input.custom_id;
  if (id === 'open_modal') return { type: 'modal', modal };
  if (id === 'home' || id === 'recycle') return { type: 'message', message: location };
  if (id === 'inventory' || id === 'quests' || id === 'show_v2') return { type: 'message', message: samples[id === 'show_v2' ? 'v2' : id] };
  if (id === 'character_form') return { type: 'message', message: { embeds: [{ color: 0x57f287, title: 'Character details saved (mock)', description: `**Name:** ${input.fields?.character_name || 'Unknown'}\n\n${input.fields?.character_story || 'No background supplied.'}` }], components: [row(button('home', 'Return', 1))] } };
  const choice = input.values?.join(', ') || id.replaceAll('_', ' ');
  return { type: 'message', message: { embeds: [{ color: colour, title: 'Interaction received', description: `**Custom ID:** \`${id}\`\n**Selection:** ${choice}\n\nThis response was generated by the local mock transport. Later, Drogon will supply the replacement message.` }], components: [row(button('home', 'Return to Port Obligan', 1), button('showcase', 'Component playground', 2))] } };
}
