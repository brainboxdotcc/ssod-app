import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Modal, Interaction } from '../types';

export function ModalView({ modal, close, submit }: { modal: Modal; close: () => void; submit: (i: Interaction) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});

  const inputs = modal.components.flatMap(c =>
    c.type === 18 && c.component
      ? [{ ...c.component, label: c.label }]
      : c.type === 1
        ? c.components || []
        : [c]
  ).filter(c => c.type === 4);

  return <div
    className="modal-backdrop"
    onMouseDown={e => {
      if (e.target === e.currentTarget) {
        close();
      }
    }}
  >
    <form
      className="modal"
      onSubmit={e => {
        e.preventDefault();
        submit({ custom_id: modal.custom_id, fields: values });
      }}
    >
      <div className="modal-header">
        <h2>{modal.title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={close}
          aria-label="Close modal"
        >
          <X size={20}/>
        </button>
      </div>

      {inputs.map(c => (
        <label key={c.custom_id} className="modal-field">
          <span>
            {c.label}
            {' '}
            {c.required !== false && <small>*</small>}
          </span>

          {c.style === 2 ? (
            <textarea
              required={c.required !== false}
              maxLength={c.max_length}
              minLength={c.min_length}
              placeholder={c.placeholder}
              value={values[c.custom_id || ''] || ''}
              onChange={e => setValues(v => ({
                ...v,
                [c.custom_id || '']: e.target.value
              }))}
            />
          ) : (
            <input
              required={c.required !== false}
              maxLength={c.max_length}
              minLength={c.min_length}
              placeholder={c.placeholder}
              value={values[c.custom_id || ''] || ''}
              onChange={e => setValues(v => ({
                ...v,
                [c.custom_id || '']: e.target.value
              }))}
            />
          )}
        </label>
      ))}

      <div className="modal-actions">
        <button
          type="button"
          className="discord-button style-2"
          onClick={close}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="discord-button style-1"
        >
          Submit
        </button>
      </div>
    </form>
  </div>;
}