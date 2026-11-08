import React from 'react';
import { spriteText } from './sprites';

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

export function AnsiBlock({ text }: { text: string }) {
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

