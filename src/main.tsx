import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Compass, FlaskConical, Menu, Volume2, VolumeX, X, ChevronDown, ScrollText, Code2 } from 'lucide-react';
import type { Component, Embed, Emoji, Interaction, Message, Modal, Response } from './types';
import { samples, simulate, type Screen } from './mock';
import './style.css';
import { connectStandalone } from './standalone';

const spriteBase = 'https://admin.ssod.org/img/icons/';

function Sprite({ name }: { name: string }) {
  const filename = name.length === 2 && name.endsWith('_') ? name.slice(0, -1) : name;
  if (!/^[a-zA-Z0-9_]+$/.test(filename)) return <>{name}</>;
  return <img className="sprite" src={`${spriteBase}${filename}.png`} alt={`:${name}:`} title={`:${name}:`}/>;
}

function EmojiView({ emoji }: { emoji?: Emoji }) {
  if (!emoji?.name) return null;
  return emoji.id ? <Sprite name={emoji.name}/> : <>{emoji.name}</>;
}

function spriteText(text: string): React.ReactNode {
  const parts = text.split(/(<a?:[a-zA-Z0-9_]+:\d+>)/g);
  return parts.map((part, i) => {
    const match = /^<a?:([a-zA-Z0-9_]+):\d+>$/.exec(part);
    return match ? <Sprite key={i} name={match[1]}/> : part;
  });
}

const ansiPalette = ['#4f545c', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5'];
const ansiBrightPalette = ['#777c85', '#ff5555', '#b8e986', '#ffd166', '#69b7ff', '#ff85cb', '#67dce3', '#ffffff'];

type AnsiStyle = { color?: string; backgroundColor?: string; fontWeight?: number; fontStyle?: string; textDecoration?: string; opacity?: number };

function ansiColour(codes: number[], index: number): [string | undefined, number] {
  if (codes[index + 1] === 2 && codes.length >= index + 5) {
    const rgb = codes.slice(index + 2, index + 5).map(n => Math.max(0, Math.min(255, n)));
    return [`rgb(${rgb.join(',')})`, 4];
  }
  if (codes[index + 1] === 5 && codes.length >= index + 3) {
    const n = codes[index + 2];
    if (n < 16) return [[...ansiPalette, ...ansiBrightPalette][n], 2];
    if (n < 232) {
      const v = n - 16;
      const channel = (c: number) => c === 0 ? 0 : 55 + c * 40;
      return [`rgb(${channel(Math.floor(v / 36))},${channel(Math.floor(v / 6) % 6)},${channel(v % 6)})`, 2];
    }
    if (n < 256) return [`rgb(${8 + (n - 232) * 10},${8 + (n - 232) * 10},${8 + (n - 232) * 10})`, 2];
  }
  return [undefined, 0];
}

function AnsiBlock({ text }: { text: string }) {
  const fragments: React.ReactNode[] = [];
  const pattern = /\x1b\[([0-9;]*)m/g;
  let style: AnsiStyle = {};
  let cursor = 0;
  let match: RegExpExecArray | null;
  const emit = (value: string) => {
    if (value) fragments.push(<span key={fragments.length} style={{ ...style }}>{spriteText(value)}</span>);
  };
  while ((match = pattern.exec(text)) !== null) {
    emit(text.slice(cursor, match.index));
    const codes = match[1] ? match[1].split(';').map(Number) : [0];
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (code === 0) style = {};
      else if (code === 1) style.fontWeight = 700;
      else if (code === 2) style.opacity = 0.65;
      else if (code === 3) style.fontStyle = 'italic';
      else if (code === 4) style.textDecoration = 'underline';
      else if (code === 9) style.textDecoration = 'line-through';
      else if (code === 22) { delete style.fontWeight; delete style.opacity; }
      else if (code === 23) delete style.fontStyle;
      else if (code === 24 || code === 29) delete style.textDecoration;
      else if (code === 39) delete style.color;
      else if (code === 49) delete style.backgroundColor;
      else if (code >= 30 && code <= 37) style.color = ansiPalette[code - 30];
      else if (code >= 90 && code <= 97) style.color = ansiBrightPalette[code - 90];
      else if (code >= 40 && code <= 47) style.backgroundColor = ansiPalette[code - 40];
      else if (code >= 100 && code <= 107) style.backgroundColor = ansiBrightPalette[code - 100];
      else if (code === 38 || code === 48) {
        const [colour, consumed] = ansiColour(codes, i);
        if (colour) {
          if (code === 38) style.color = colour;
          else style.backgroundColor = colour;
        }
        i += consumed;
      }
    }
    cursor = pattern.lastIndex;
  }
  emit(text.slice(cursor));
  return <pre className="ansi-block"><code>{fragments}</code></pre>;
}

function richInline(text: string): React.ReactNode[] {
  const output: React.ReactNode[] = [];
  const markers: [string, string, string][] = [
    ['***', 'strong', 'em'], ['___', 'u', 'em'], ['**', 'strong', ''],
    ['__', 'u', ''], ['~~', 'del', ''], ['||', 'span', 'spoiler'],
    ['*', 'em', ''], ['_', 'em', '']
  ];
  const append = (value: React.ReactNode) => output.push(<React.Fragment key={output.length}>{value}</React.Fragment>);
  const plain = (value: string) => { if (value) append(spriteText(value)); };
  let cursor = 0;
  let buffer = '';
  const flush = () => { plain(buffer); buffer = ''; };
  while (cursor < text.length) {
    const rest = text.slice(cursor);
    if (rest[0] === '\\' && rest.length > 1 && /[\\*_~|`\[\]()#>!-]/.test(rest[1])) {
      buffer += rest[1]; cursor += 2; continue;
    }
    const code = /^(`+)([\s\S]*?)\1(?!`)/.exec(rest);
    if (code && !code[2].includes('\n')) {
      flush(); append(<code>{code[2]}</code>); cursor += code[0].length; continue;
    }
    const link = /^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/.exec(rest);
    if (link) {
      flush(); append(<a href={link[2]} target="_blank" rel="noopener noreferrer">{richInline(link[1])}</a>);
      cursor += link[0].length; continue;
    }
    const angle = /^<(https?:\/\/[^\s>]+)>/.exec(rest);
    if (angle) {
      flush(); append(<a href={angle[1]} target="_blank" rel="noopener noreferrer">{angle[1]}</a>);
      cursor += angle[0].length; continue;
    }
    const url = /^https?:\/\/[^\s<>]+/.exec(rest);
    if (url) {
      const address = url[0].replace(/[.,;!?]+$/, '');
      flush(); append(<a href={address} target="_blank" rel="noopener noreferrer">{address}</a>);
      cursor += address.length; continue;
    }
    let matched = false;
    for (const [marker, tag, extra] of markers) {
      if (!rest.startsWith(marker)) continue;
      if (marker === '_' && cursor > 0 && /[\w]/.test(text[cursor - 1])) continue;
      let end = cursor + marker.length;
      while ((end = text.indexOf(marker, end)) >= 0) {
        if (text[end - 1] !== '\\' && end > cursor + marker.length &&
            !(marker === '_' && /[\w]/.test(text[end + 1] || ''))) break;
        end += marker.length;
      }
      if (end < 0) continue;
      flush();
      const inner = richInline(text.slice(cursor + marker.length, end));
      if (extra === 'em') append(React.createElement(tag, {}, <em>{inner}</em>));
      else if (extra === 'spoiler') append(<span className="discord-spoiler" title="Spoiler">{inner}</span>);
      else append(React.createElement(tag, {}, inner));
      cursor = end + marker.length;
      matched = true;
      break;
    }
    if (matched) continue;
    buffer += text[cursor++];
  }
  flush();
  return output;
}

function richLines(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  const bullet = /^(\s*)([-*])\s+(.+)$/;
  const numbered = /^(\s*)(\d+)[.)]\s+(.+)$/;
  while (i < lines.length) {
    const line = lines[i];
    const heading = /^(#{1,3})[ \t]+(.+?)\s*$/.exec(line);
    if (heading) {
      blocks.push(React.createElement(`h${heading[1].length}`, { key: i, className: 'discord-heading' }, richInline(heading[2])));
      i++; continue;
    }
    if (line.startsWith('-# ')) {
      blocks.push(<div key={i} className="discord-subtext">{richInline(line.slice(3))}</div>);
      i++; continue;
    }
    if (line.startsWith('>>> ')) {
      blocks.push(<blockquote key={i} className="discord-quote">{richLines([line.slice(4), ...lines.slice(i + 1)].join('\n'))}</blockquote>);
      break;
    }
    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      const key = i;
      while (i < lines.length && /^>\s?/.test(lines[i])) quoted.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={key} className="discord-quote">{richLines(quoted.join('\n'))}</blockquote>);
      continue;
    }
    const firstBullet = bullet.exec(line);
    const firstNumber = numbered.exec(line);
    if (firstBullet || firstNumber) {
      const ordered = !!firstNumber;
      const key = i;
      const items: React.ReactNode[] = [];
      const pattern = ordered ? numbered : bullet;
      const depth = (firstNumber || firstBullet)![1].length;
      const start = firstNumber ? Number(firstNumber[2]) : 1;
      while (i < lines.length) {
        const item = pattern.exec(lines[i]);
        if (!item || item[1].length !== depth) break;
        items.push(<li key={i}>{richInline(ordered ? item[3] : item[3])}</li>);
        i++;
      }
      blocks.push(ordered ? <ol key={key} className="discord-list" start={start}>{items}</ol> : <ul key={key} className="discord-list">{items}</ul>);
      continue;
    }
    blocks.push(<React.Fragment key={i}>{richInline(line)}{i < lines.length - 1 && <br/>}</React.Fragment>);
    i++;
  }
  return blocks;
}

function rich(text: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  const fences = /```([^\n`]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = fences.exec(text)) !== null) {
    if (match.index > cursor) blocks.push(<React.Fragment key={blocks.length}>{richLines(text.slice(cursor, match.index))}</React.Fragment>);
    const language = match[1].trim().toLowerCase();
    blocks.push(language === 'ansi' ? <AnsiBlock key={blocks.length} text={match[2]}/> : <pre className="ansi-block" key={blocks.length}><code>{match[2]}</code></pre>);
    cursor = fences.lastIndex;
  }
  if (cursor < text.length) blocks.push(<React.Fragment key={blocks.length}>{richLines(text.slice(cursor))}</React.Fragment>);
  return blocks;
}
function EmbedView({ embed }: { embed: Embed }) {
  return <article className="embed" style={{ borderLeftColor: embed.color === undefined ? '#4f545c' : `#${embed.color.toString(16).padStart(6, '0')}` }}>
    {embed.author && <div className="embed-author">{embed.author.icon_url && <img src={embed.author.icon_url} alt=""/>}{spriteText(embed.author.name)}</div>}
    {embed.thumbnail && <img className="thumbnail" src={embed.thumbnail.url} alt="Embed thumbnail"/>}
    {embed.title && <h2>{embed.url ? <a href={embed.url} target="_blank" rel="noopener noreferrer">{spriteText(embed.title)}</a> : spriteText(embed.title)}</h2>}
    {embed.description && <div className="description">{rich(embed.description)}</div>}
    {!!embed.fields?.length && <div className="fields">{embed.fields.map((field, i) => <div key={i} className={`field ${field.inline ? 'inline' : ''}`}><div className="field-name">{rich(field.name)}</div><div className="field-value">{rich(field.value)}</div></div>)}</div>}
    {embed.image && <img className="embed-image" src={embed.image.url} alt={embed.title || 'Embed illustration'}/>}
    {(embed.footer || embed.timestamp) && <div className="embed-footer">{embed.footer?.icon_url && <img src={embed.footer.icon_url} alt=""/>}{embed.footer?.text && spriteText(embed.footer.text)}{embed.timestamp && <span> · {new Date(embed.timestamp).toLocaleString('en-GB')}</span>}</div>}
  </article>;
}
function ComponentView({ component: c, dispatch }: { component: Component; dispatch: (i: Interaction) => void }) {
  switch (c.type) {
    case 1: return <div className="action-row">{c.components?.map((child, i) => <ComponentView key={i} component={child} dispatch={dispatch}/>)}</div>;
    case 2: return c.style === 5 ? <a className="discord-button style-5" href={c.url || '#'} target="_blank" rel="noopener noreferrer"><EmojiView emoji={c.emoji}/> {c.label && spriteText(c.label)} ↗</a> :
      <button disabled={c.disabled} className={`discord-button style-${c.style || 2}`} onClick={() => dispatch({ custom_id: c.custom_id || '' })}>{c.emoji?.name && <span className="emoji"><EmojiView emoji={c.emoji}/></span>}{c.label && spriteText(c.label)}</button>;
    case 3: case 5: case 6: case 7: case 8: {
      const options = c.options || [];
      return <SelectView component={c} options={options} dispatch={dispatch}/>;
    }
    case 10: return <div className="text-display">{rich(c.content || '')}</div>;
    case 12: return <div className="media-gallery">{c.items?.map((item, i) => <img key={i} src={item.media.url} alt={item.description || 'Gallery image'}/>)}</div>;
    case 14: return <hr className="component-divider"/>;
    case 9: return <div className="section"> <div className="section-text">{c.components?.map((child, i) => <ComponentView key={i} component={child} dispatch={dispatch}/>)}</div>{c.accessory && <ComponentView component={c.accessory} dispatch={dispatch}/>}</div>;
    case 17: return <div className="v2-container" style={{ borderLeftColor: c.accent_color === undefined ? 'transparent' : `#${c.accent_color.toString(16).padStart(6, '0')}` }}>{c.components?.map((child, i) => <ComponentView key={i} component={child} dispatch={dispatch}/>)}</div>;
    default: return <div className="unsupported">Unsupported component type {c.type}</div>;
  }
}
function SelectView({ component: c, options, dispatch }: { component: Component; options: NonNullable<Component['options']>; dispatch: (i: Interaction) => void }) {
  const [selected, setSelected] = useState<string[]>(() => options.filter(o => o.default).map(o => o.value));
  const [open, setOpen] = useState(false);
  const dropdown = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSelected(options.filter(o => o.default).map(o => o.value));
    setOpen(false);
  }, [options]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!dropdown.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const multiple = (c.max_values || 1) > 1;
  const max = c.max_values || options.length;
  const min = c.min_values ?? 1;
  if (!multiple) return <div className="select-wrap multi-select single-select" ref={dropdown}>
    <button type="button" className="multi-select-control" disabled={c.disabled} onClick={() => setOpen(v => !v)}>
      <span className="multi-select-pills">
        {selected[0] ? <span className="single-select-value"><EmojiView emoji={options.find(o => o.value === selected[0])?.emoji}/> {options.find(o => o.value === selected[0])?.label || selected[0]}</span> : <span className="multi-select-placeholder">{c.placeholder || 'Select an option'}</span>}
      </span>
      <ChevronDown className={open ? 'multi-select-chevron open' : 'multi-select-chevron'} size={17}/>
    </button>
    {open && <div className="multi-select-menu single-select-menu" role="listbox">
      {options.map(o => <button type="button" role="option" aria-selected={selected.includes(o.value)} className="multi-select-option single-select-option" key={o.value} onClick={() => {
        setSelected([o.value]);
        setOpen(false);
        dispatch({ custom_id: c.custom_id || '', values: [o.value] });
      }}>
        <EmojiView emoji={o.emoji}/><span className="multi-select-option-text"><strong>{o.label}</strong>{o.description && <small>{o.description}</small>}</span>
      </button>)}
    </div>}
  </div>;
  const toggle = (value: string) => {
    setSelected(current => current.includes(value) ? current.filter(v => v !== value) : current.length < max ? [...current, value] : current);
  };
  return <div className="select-wrap multi-select" ref={dropdown}>
    <div className="multi-select-control" onClick={() => !c.disabled && setOpen(v => !v)}>
      <div className="multi-select-pills">
        {selected.length ? selected.map(value => {
          const option = options.find(o => o.value === value);
          return <span className="multi-select-pill" key={value}>{option?.emoji?.name && <EmojiView emoji={option.emoji}/>}{option?.label || value}<button type="button" aria-label={`Remove ${option?.label || value}`} disabled={c.disabled} onClick={e => { e.stopPropagation(); toggle(value); }}><X size={12}/></button></span>;
        }) : <span className="multi-select-placeholder">{c.placeholder || 'Select options'}</span>}
      </div>
      <span className="multi-select-count">{selected.length}/{max}</span>
      <ChevronDown className={open ? 'multi-select-chevron open' : 'multi-select-chevron'} size={17}/>
    </div>
    {open && <div className="multi-select-menu" role="group" aria-label={c.placeholder || 'Select options'}>
      {options.map(o => {
        const checked = selected.includes(o.value);
        const blocked = !checked && selected.length >= max;
        return <label className={`multi-select-option${blocked ? ' blocked' : ''}`} key={o.value}>
          <input type="checkbox" checked={checked} disabled={c.disabled || blocked} onChange={() => toggle(o.value)}/>
          <span className="multi-select-option-text"><strong><EmojiView emoji={o.emoji}/>{o.label}</strong>{o.description && <small>{o.description}</small>}</span>
        </label>;
      })}
    </div>}
    <button type="button" className="select-submit" disabled={c.disabled || selected.length < min || selected.length > max} onClick={() => { dispatch({ custom_id: c.custom_id || '', values: selected }); setOpen(false); }}>Confirm</button>
  </div>;
}
function MessageView({ message, dispatch }: { message: Message; dispatch: (i: Interaction) => void }) {
  return <div className="message">
    {message.content && <div className="message-content">{rich(message.content)}</div>}
    {message.embeds?.map((e, i) => <EmbedView key={i} embed={e}/>)}
    {message.attachments?.map(a => <a className="attachment" href={a.url} key={a.id} target="_blank" rel="noopener noreferrer">📎 {a.filename}</a>)}
    {message.components?.map((c, i) => <ComponentView key={`${message.id || 'message'}-${i}`} component={c} dispatch={dispatch}/>)}
  </div>;
}
function ModalView({ modal, close, submit }: { modal: Modal; close: () => void; submit: (i: Interaction) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const inputs = modal.components.flatMap(c => c.type === 18 && c.component ? [{ ...c.component, label: c.label }] : c.type === 1 ? c.components || [] : [c]).filter(c => c.type === 4);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><form className="modal" onSubmit={e => { e.preventDefault(); submit({ custom_id: modal.custom_id, fields: values }); }}>
    <div className="modal-header"><h2>{modal.title}</h2><button type="button" className="icon-button" onClick={close} aria-label="Close modal"><X size={20}/></button></div>
    {inputs.map(c => <label key={c.custom_id} className="modal-field"><span>{c.label} {c.required !== false && <small>*</small>}</span>{c.style === 2 ?
      <textarea required={c.required !== false} maxLength={c.max_length} minLength={c.min_length} placeholder={c.placeholder} value={values[c.custom_id || ''] || ''} onChange={e => setValues(v => ({ ...v, [c.custom_id || '']: e.target.value }))}/> :
      <input required={c.required !== false} maxLength={c.max_length} minLength={c.min_length} placeholder={c.placeholder} value={values[c.custom_id || ''] || ''} onChange={e => setValues(v => ({ ...v, [c.custom_id || '']: e.target.value }))}/>}</label>)}
    <div className="modal-actions"><button type="button" className="discord-button style-2" onClick={close}>Cancel</button><button type="submit" className="discord-button style-1">Submit</button></div>
  </form></div>;
}
function App() {
  const live = Boolean(import.meta.env.VITE_GAME_WS_URL);
  const [connectionStatus, setConnectionStatus] = useState(live ? 'Connecting' : 'Mock transport · Offline');
  const [screen, setScreen] = useState<Screen>('location');
  const [message, setMessage] = useState<Message>(live ? {} : samples.location);
  const [modal, setModal] = useState<Modal | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [lastResponse, setLastResponse] = useState<unknown>(null);
  const [muted, setMuted] = useState(true);
  const [menu, setMenu] = useState(false);
  const [activeCommand, setActiveCommand] = useState('start');
  const socket = useRef<ReturnType<typeof connectStandalone> | null>(null);
  const messageId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!live) return;
    const connection = connectStandalone(import.meta.env.VITE_GAME_WS_URL, setConnectionStatus, response => {
      setLastResponse(response);
      if (!response || typeof response !== 'object') return;
      const packet = response as Record<string, unknown>;
      const isObject = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null && !Array.isArray(value);
      const isMessage = (value: Record<string, unknown>) =>
        ['content', 'embeds', 'components', 'attachments', 'flags'].some(field => field in value);
      const findMessage = (value: unknown, depth = 0): Record<string, unknown> | null => {
        if (!isObject(value) || depth > 4) return null;
        if (isMessage(value)) return value;
        for (const field of ['data', 'message', 'response', 'payload', 'body']) {
          if (field in value) {
            const found = findMessage(value[field], depth + 1);
            if (found) return found;
          }
        }
        return null;
      };
      const callbackType = typeof packet.type === 'number' ? packet.type : undefined;
      const body = isObject(packet.data) ? packet.data : packet;
      if (callbackType === 9 || (typeof body.custom_id === 'string' && typeof body.title === 'string' && Array.isArray(body.components))) {
        setModal(body as Modal);
        return;
      }
      const incoming = findMessage(packet);
      if (!incoming) return;
      if (typeof incoming.id === 'string') messageId.current = incoming.id;
      setMessage(current => ({ ...current, ...incoming }));
      setModal(null);
    });
    socket.current = connection;
    return () => { socket.current = null; connection.close(); };
  }, [live]);

  const navigate = (command: string) => {
    if (!live || connectionStatus !== 'Connected') return;
    setActiveCommand(command);
    setModal(null);
    setMenu(false);
    messageId.current = undefined;
    setMessage({});
    socket.current?.send({ type: 2, data: { type: 1, name: command } });
  };

  const go = (next: Screen) => {
    if (live) return;
    setScreen(next);
    setMessage(samples[next]);
    setModal(null);
    setMenu(false);
    setLog(l => [`Loaded ${next} sample`, ...l].slice(0, 8));
  };
  const dispatch = (interaction: Interaction) => {
    setLog(l => [`${interaction.custom_id}${interaction.values ? ` → ${interaction.values.join(', ')}` : ''}`, ...l].slice(0, 8));
    if (live) {
      if (interaction.fields) {
        const components = modal?.components.map(c => {
          if (c.type === 18 && c.component) {
            return { type: 18, component: { type: c.component.type, custom_id: c.component.custom_id,
              value: interaction.fields?.[c.component.custom_id || ''] || '' } };
          }
          if (c.type === 1) {
            return { type: 1, components: (c.components || []).filter(child => child.type === 4).map(child =>
              ({ type: 4, custom_id: child.custom_id, value: interaction.fields?.[child.custom_id || ''] || '' })) };
          }
          return { type: c.type, custom_id: c.custom_id, value: interaction.fields?.[c.custom_id || ''] || '' };
        }) || [];
        socket.current?.send({ type: 5, data: { custom_id: interaction.custom_id, components } });
        setModal(null);
      } else {
        socket.current?.send({ type: 3, message_id: messageId.current,
          data: { component_type: interaction.values ? 3 : 2, custom_id: interaction.custom_id,
            ...(interaction.values ? { values: interaction.values } : {}) } });
      }
      return;
    }
    if (interaction.custom_id === 'showcase') { go('showcase'); return; }
    const response: Response = simulate(interaction, screen);
    if (response.type === 'modal') setModal(response.modal);
    else { setMessage(response.message); setModal(null); }
  };
  return <div className="app">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <div className="brand"><img src="https://admin.ssod.org/img/cropped-ssod-new-192x192.png" alt="Seven Spells crest"/><div><strong>SEVEN SPELLS</strong><span>OF DESTRUCTION</span></div></div>
      {live && <div className="sidebar-label">GAME</div>}
      {live && ([['start', Compass, 'Adventure'], ['profile', ScrollText, 'Profile'], ['lore', BookOpen, 'Lore']] as const).map(([command, Icon, label]) =>
        <button key={command} className={`nav-item ${activeCommand === command ? 'active' : ''}`} disabled={connectionStatus !== 'Connected'} onClick={() => navigate(command)}><Icon size={17}/>{label}</button>)}
      {!live && <div className="sidebar-label">DEMO SCREENS</div>}
      {!live && ([['location', Compass, 'Port Obligan'], ['inventory', FlaskConical, 'Inventory'], ['quests', ScrollText, 'Quest log'], ['showcase', BookOpen, 'Component playground'], ['v2', Code2, 'Components V2']] as const).map(([key, Icon, label]) => <button key={key} className={`nav-item ${screen === key ? 'active' : ''}`} onClick={() => go(key)}><Icon size={17}/>{label}</button>)}
      <div className="sidebar-bottom"><div className="online-dot"/> {connectionStatus}<br/><span>{import.meta.env.VITE_GAME_WS_URL ? "Live gameplay" : "API integration not connected"}</span></div>
    </aside>
    {menu && <div className="mobile-shade" onClick={() => setMenu(false)}/>}
    <main className="main"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={22}/></button><div className="top-title"><span className="eyebrow">THE SEVEN SPELLS OF DESTRUCTION</span><strong>{live ? ({ start: 'Adventure', profile: 'Profile', lore: 'Lore' } as Record<string, string>)[activeCommand] || 'Seven Spells' : screen === 'location' ? 'Port Obligan' : screen === 'quests' ? 'Quest Log' : screen === 'inventory' ? 'Inventory' : 'Renderer test'}</strong></div><div className="top-actions"><button className="icon-button" onClick={() => setShowJson(v => !v)} title="Toggle payload inspector"><Code2 size={19}/></button><button className="icon-button" onClick={() => setMuted(v => !v)} title="Audio placeholder (not implemented)">{muted ? <VolumeX size={19}/> : <Volume2 size={19}/>}</button></div></header>
      <div className="content"><div className="game-layout"><section className="game-panel"><MessageView message={message} dispatch={dispatch}/></section>
      {showJson && <aside className="inspector"><div className="inspector-title">Last received WebSocket payload</div><pre>{JSON.stringify(lastResponse, null, 2)}</pre><div className="inspector-title">Current message JSON</div><pre>{JSON.stringify(message, null, 2)}</pre><div className="inspector-title">Interaction log</div>{log.map((line, i) => <div className="log-line" key={i}>{line}</div>)}</aside>}</div></div>
      <footer className="footer">Seven Spells of Destruction · v0.1.0</footer>
    </main>{modal && <ModalView key={modal.custom_id} modal={modal} close={() => setModal(null)} submit={dispatch}/>}</div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
