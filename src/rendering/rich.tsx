
import React from 'react';
import { spriteText } from './sprites';
import { AnsiBlock } from './ansi';

function richInline(text: string): React.ReactNode[] {
  const output: React.ReactNode[] = [];
  const markers: [string, string, string][] = [
    ['***', 'strong', 'em'],
    ['___', 'u', 'em'],
    ['**', 'strong', ''],
    ['__', 'u', ''],
    ['~~', 'del', ''],
    ['||', 'span', 'spoiler'],
    ['*', 'em', ''],
    ['_', 'em', '']
  ];

  const append = (value: React.ReactNode) => {
    output.push(<React.Fragment key={output.length}>{value}</React.Fragment>);
  };

  const plain = (value: string) => {
    if (value) {
      append(spriteText(value));
    }
  };

  let cursor = 0;
  let buffer = '';

  const flush = () => {
    plain(buffer);
    buffer = '';
  };

  while (cursor < text.length) {
    const rest = text.slice(cursor);

    if (rest[0] === '\\' && rest.length > 1 && /[\\*_~|`\[\]()#>!-]/.test(rest[1])) {
      buffer += rest[1];
      cursor += 2;
      continue;
    }

    const code = /^(`+)([\s\S]*?)\1(?!`)/.exec(rest);
    if (code && !code[2].includes('\n')) {
      flush();
      append(<code>{code[2]}</code>);
      cursor += code[0].length;
      continue;
    }

    const link = /^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/.exec(rest);
    if (link) {
      flush();
      append(
        <a href={link[2]} target="_blank" rel="noopener noreferrer">
          {richInline(link[1])}
        </a>
      );
      cursor += link[0].length;
      continue;
    }

    const angle = /^<(https?:\/\/[^\s>]+)>/.exec(rest);
    if (angle) {
      flush();
      append(
        <a href={angle[1]} target="_blank" rel="noopener noreferrer">
          {angle[1]}
        </a>
      );
      cursor += angle[0].length;
      continue;
    }

    const url = /^https?:\/\/[^\s<>]+/.exec(rest);
    if (url) {
      const address = url[0].replace(/[.,;!?]+$/, '');
      flush();
      append(
        <a href={address} target="_blank" rel="noopener noreferrer">
          {address}
        </a>
      );
      cursor += address.length;
      continue;
    }

    let matched = false;

    for (const [marker, tag, extra] of markers) {
      if (!rest.startsWith(marker)) {
        continue;
      }

      if (marker === '_' && cursor > 0 && /[\w]/.test(text[cursor - 1])) {
        continue;
      }

      let end = cursor + marker.length;

      while ((end = text.indexOf(marker, end)) >= 0) {
        const escaped = text[end - 1] === '\\';
        const empty = end === cursor + marker.length;
        const insideWord = marker === '_' && /[\w]/.test(text[end + 1] || '');
        const longerMarker = (marker === '*' || marker === '_') &&
          (text[end - 1] === marker || text[end + 1] === marker);

        if (!escaped && !empty && !insideWord && !longerMarker) {
          break;
        }

        end += marker.length;
      }

      if (end < 0) {
        continue;
      }

      flush();

      const inner = richInline(text.slice(cursor + marker.length, end));

      if (extra === 'em') {
        append(React.createElement(tag, {}, <em>{inner}</em>));
      } else if (extra === 'spoiler') {
        append(
          <span className="discord-spoiler" title="Spoiler">
            {inner}
          </span>
        );
      } else {
        append(React.createElement(tag, {}, inner));
      }

      cursor = end + marker.length;
      matched = true;
      break;
    }

    if (matched) {
      continue;
    }

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
      blocks.push(
        React.createElement(
          `h${heading[1].length}`,
          { key: i, className: 'discord-heading' },
          richInline(heading[2])
        )
      );
      i++;
      continue;
    }

    if (line.startsWith('-# ')) {
      blocks.push(
        <div key={i} className="discord-subtext">
          {richInline(line.slice(3))}
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('>>> ')) {
      blocks.push(
        <blockquote key={i} className="discord-quote">
          {richLines([line.slice(4), ...lines.slice(i + 1)].join('\n'))}
        </blockquote>
      );
      break;
    }

    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      const key = i;

      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoted.push(lines[i++].replace(/^>\s?/, ''));
      }

      blocks.push(
        <blockquote key={key} className="discord-quote">
          {richLines(quoted.join('\n'))}
        </blockquote>
      );
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

        if (!item || item[1].length !== depth) {
          break;
        }

        items.push(
          <li key={i}>
            {richInline(item[3])}
          </li>
        );
        i++;
      }

      blocks.push(
        ordered
          ? <ol key={key} className="discord-list" start={start}>{items}</ol>
          : <ul key={key} className="discord-list">{items}</ul>
      );
      continue;
    }

    blocks.push(
      <React.Fragment key={i}>
        {richInline(line)}
        {i < lines.length - 1 && <br/>}
      </React.Fragment>
    );
    i++;
  }

  return blocks;
}

export function rich(text: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  const fences = /```([^\n`]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = fences.exec(text)) !== null) {
    if (match.index > cursor) {
      blocks.push(
        <React.Fragment key={blocks.length}>
          {richLines(text.slice(cursor, match.index))}
        </React.Fragment>
      );
    }

    const language = match[1].trim().toLowerCase();

    blocks.push(
      language === 'ansi'
        ? <AnsiBlock key={blocks.length} text={match[2]}/>
        : <pre className="ansi-block" key={blocks.length}>
            <code>{match[2]}</code>
          </pre>
    );

    cursor = fences.lastIndex;
  }

  if (cursor < text.length) {
    blocks.push(
      <React.Fragment key={blocks.length}>
        {richLines(text.slice(cursor))}
      </React.Fragment>
    );
  }

  return blocks;
}
