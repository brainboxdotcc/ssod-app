import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { Component, Interaction } from '../types';
import { EmojiView } from '../rendering/sprites';

export function SelectView({
	component: c,
	options,
	dispatch,
	onSearch,
}: {
	component: Component;
	options: NonNullable<Component['options']>;
	dispatch: (i: Interaction) => void;
	onSearch?: (query: string) => void;
}) {
	const [selected, setSelected] = useState<string[]>(() => options.filter((o) => o.default).map((o) => o.value));
	const [selectedLabel, setSelectedLabel] = useState('');
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const dropdown = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!onSearch) {
			setSelected(options.filter((o) => o.default).map((o) => o.value));
			setOpen(false);
		}
	}, [options, onSearch]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const close = (e: PointerEvent) => {
			if (!dropdown.current?.contains(e.target as Node)) {
				commitSelection();
			}
		};

		const escape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				commitSelection();
			}
		};

		document.addEventListener('pointerdown', close);
		document.addEventListener('keydown', escape);

		return () => {
			document.removeEventListener('pointerdown', close);
			document.removeEventListener('keydown', escape);
		};
	}, [open, selected]);

	const commitSelection = () => {
		setOpen(false);

		if (!multiple) {
			return;
		}

		if (selected.length < min || selected.length > max) {
			return;
		}

		dispatch({
			custom_id: c.custom_id || '',
			values: selected,
		});
	};

	const multiple = (c.max_values || 1) > 1;
	const max = c.max_values || options.length;
	const min = c.min_values ?? 1;

	if (!multiple) {
		return (
			<div className="select-wrap multi-select single-select" ref={dropdown}>
				<button
					type="button"
					className="multi-select-control"
					disabled={c.disabled}
					onClick={() => {
						if (!open && onSearch) {
							setSearch('');
							onSearch('');
						}

						setOpen((v) => !v);
					}}
				>
					<span className="multi-select-pills">
						{selected[0] ? (
							<span className="single-select-value">
								<EmojiView emoji={options.find((o) => o.value === selected[0])?.emoji} />{' '}
								{options.find((o) => o.value === selected[0])?.label || selectedLabel || selected[0]}
							</span>
						) : (
							<span className="multi-select-placeholder">{c.placeholder || 'Select an option'}</span>
						)}
					</span>
					<ChevronDown className={open ? 'multi-select-chevron open' : 'multi-select-chevron'} size={17} />
				</button>

				{open && (
					<div className="multi-select-menu single-select-menu">
						{onSearch && (
							<input
								type="search"
								value={search}
								placeholder="Search…"
								aria-label="Search options"
								autoFocus
								style={{ width: '100%', boxSizing: 'border-box' }}
								onChange={(e) => {
									setSearch(e.target.value);
									onSearch(e.target.value);
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
									}
								}}
							/>
						)}

						<div role="listbox">
							{onSearch && options.length === 0 && (
								<span className="multi-select-placeholder">No matching items</span>
							)}

							{options.map((o) => (
								<button
									type="button"
									role="option"
									aria-selected={selected.includes(o.value)}
									className="multi-select-option single-select-option"
									key={o.value}
									onClick={() => {
										setSelected([o.value]);
										setSelectedLabel(o.label);
										setOpen(false);
										dispatch({ custom_id: c.custom_id || '', values: [o.value] });
									}}
								>
									<EmojiView emoji={o.emoji} />
									<span className="multi-select-option-text">
										<strong>{o.label}</strong>
										{o.description && <small>{o.description}</small>}
									</span>
								</button>
							))}
						</div>
					</div>
				)}
			</div>
		);
	}

	const toggle = (value: string) => {
		setSelected((current) =>
			current.includes(value)
				? current.filter((v) => v !== value)
				: current.length < max
				? [...current, value]
				: current
		);
	};

	return (
		<div className="select-wrap multi-select" ref={dropdown}>
			<div className="multi-select-control" onClick={() => {
				if (c.disabled) {
					return;
				}

				if (open) {
					commitSelection();
				} else {
					setOpen(true);
				}
			}}>
				<div className="multi-select-pills">
					{selected.length ? (
						selected.map((value) => {
							const option = options.find((o) => o.value === value);

							return (
								<span className="multi-select-pill" key={value}>
									{option?.emoji?.name && <EmojiView emoji={option.emoji} />}
									{option?.label || value}
									<button
										type="button"
										aria-label={`Remove ${option?.label || value}`}
										disabled={c.disabled}
										onClick={(e) => {
											e.stopPropagation();

											const updated = selected.filter((v) => v !== value);
											setSelected(updated);

											if (updated.length >= min) {
												dispatch({
													custom_id: c.custom_id || '',
													values: updated,
												});
											}
										}}
									>
										<X size={12} />
									</button>
								</span>
							);
						})
					) : (
						<span className="multi-select-placeholder">{c.placeholder || 'Select options'}</span>
					)}
				</div>
				<span className="multi-select-count">
					{selected.length}/{max}
				</span>
				<ChevronDown className={open ? 'multi-select-chevron open' : 'multi-select-chevron'} size={17} />
			</div>

			{open && (
				<div className="multi-select-menu" role="group" aria-label={c.placeholder || 'Select options'}>
					{options.map((o) => {
						const checked = selected.includes(o.value);
						const blocked = !checked && selected.length >= max;

						return (
							<label className={`multi-select-option${blocked ? ' blocked' : ''}`} key={o.value}>
								<input
									type="checkbox"
									checked={checked}
									disabled={c.disabled || blocked}
									onChange={() => toggle(o.value)}
								/>
								<span className="multi-select-option-text">
									<strong>
										<EmojiView emoji={o.emoji} />
										{o.label}
									</strong>
									{o.description && <small>{o.description}</small>}
								</span>
							</label>
						);
					})}
				</div>
			)}
		</div>
	);
}