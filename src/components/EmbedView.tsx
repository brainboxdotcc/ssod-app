
import React from 'react';
import type { Embed } from '../types';
import { spriteText } from '../rendering/sprites';
import { rich } from '../rendering/rich';

export function EmbedView({ embed }: { embed: Embed }) {
  return <article
    className="embed"
    style={{
      borderLeftColor: embed.color === undefined
        ? '#4f545c'
        : `#${embed.color.toString(16).padStart(6, '0')}`
    }}
  >
    {embed.author && (
      <div className="embed-author">
        {embed.author.icon_url && (
          <img src={embed.author.icon_url} alt=""/>
        )}
        {spriteText(embed.author.name)}
      </div>
    )}

    {embed.thumbnail && (
      <img
        className="thumbnail"
        src={embed.thumbnail.url}
        alt="Embed thumbnail"
      />
    )}

    {embed.title && (
      <h2>
        {embed.url ? (
          <a href={embed.url} target="_blank" rel="noopener noreferrer">
            {spriteText(embed.title)}
          </a>
        ) : spriteText(embed.title)}
      </h2>
    )}

    {embed.description && (
      <div className="description">
        {rich(embed.description)}
      </div>
    )}

    {!!embed.fields?.length && (
      <div className="fields">
        {embed.fields.map((field, i) => (
          <div
            key={i}
            className={`field ${field.inline ? 'inline' : ''}`}
          >
            <div className="field-name">
              {rich(field.name)}
            </div>
            <div className="field-value">
              {rich(field.value)}
            </div>
          </div>
        ))}
      </div>
    )}

    {embed.image && (
      <img
        className="embed-image"
        src={embed.image.url}
        alt={embed.title || 'Embed illustration'}
      />
    )}

  </article>;
}
