import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { useTrustOptions } from './useTrustOptions.js';

export type TrustOption = { id: string; name: string };

type Props = {
	value: string[];
	onChange: (ids: string[]) => void;
	options: TrustOption[];
	loading?: boolean;
	error?: string | null;
	disabled?: boolean;
	placeholder?: string;
	'data-testid'?: string;
};

export function TrustMultiSelect({
	value,
	onChange,
	options,
	loading = false,
	error = null,
	disabled = false,
	placeholder = 'Search trusts...',
	'data-testid': testId = 'trust-ms',
}: Props) {
	console.log('TrustMultiSelect props:', { value, options, loading, error, disabled });
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const triggerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const listId = `${testId}-list`;

	const selected = new Set(value);
	const selectedOptions = options.filter(opt => selected.has(opt.id));

	// Filter options based on search term
	const filteredOptions = options.filter(opt =>
		opt.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Handle option selection
	const handleOptionToggle = useCallback((optionId: string) => {
		console.log('TrustMultiSelect handleOptionToggle called with id:', optionId);
		const newValue = value.includes(optionId)
			? value.filter(id => id !== optionId)
			: [...value, optionId];
		console.log('TrustMultiSelect new value:', newValue);
		onChange(newValue);
	}, [value, onChange]);

	// Handle chip removal
	const handleChipRemove = useCallback((optionId: string) => {
		onChange(value.filter(id => id !== optionId));
	}, [value, onChange]);

	// Handle select all filtered
	const handleSelectAll = useCallback(() => {
		const filteredIds = filteredOptions.map(option => option.id);
		const newValue = [...new Set([...value, ...filteredIds])];
		onChange(newValue);
	}, [filteredOptions, value, onChange]);

	// Handle clear all
	const handleClear = useCallback(() => {
		onChange([]);
	}, [onChange]);

	const toggleOpen = () => {
		if (!disabled) {
			setOpen(!open);
			if (!open) {
				setSearchTerm('');
				setFocusedIndex(-1);
			}
		}
	};

	const close = () => {
		setOpen(false);
		setSearchTerm('');
		setFocusedIndex(-1);
	};

	const focusFirstOption = () => {
		if (filteredOptions.length > 0) {
			setFocusedIndex(0);
		}
	};

	const focusOption = (index: number) => {
		if (index >= 0 && index < filteredOptions.length) {
			setFocusedIndex(index);
		}
	};

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!open) return;

			switch (e.key) {
				case 'Escape':
					e.preventDefault();
					close();
					break;
				case 'ArrowDown':
					e.preventDefault();
					focusOption(focusedIndex + 1);
					break;
				case 'ArrowUp':
					e.preventDefault();
					focusOption(focusedIndex - 1);
					break;
				case 'Enter':
				case ' ':
					e.preventDefault();
					if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
						toggle(filteredOptions[focusedIndex].id);
					}
					break;
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [open, focusedIndex, filteredOptions]);

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (triggerRef.current && !triggerRef.current.contains(target)) {
				close();
			}
		};

		if (open) {
			// Use a small delay to avoid immediate closing
			const timeoutId = setTimeout(() => {
				document.addEventListener('mousedown', handleClickOutside);
			}, 100);

			return () => {
				clearTimeout(timeoutId);
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [open]);

	if (loading) {
		return (
			<div className="border border-gray-300 rounded-md p-3 bg-gray-50">
				<div className="text-sm text-gray-500">Loading trusts...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="border border-red-300 rounded-md p-3 bg-red-50">
				<div className="text-sm text-red-600">Error loading trusts: {error}</div>
			</div>
		);
	}

	return (
		<div className="relative" data-testid={testId}>
			{/* Trigger */}
			<div
				ref={triggerRef}
				role="combobox"
				aria-expanded={open}
				aria-controls={listId}
				tabIndex={0}
				onClick={toggleOpen}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						toggleOpen();
					}
					if (e.key === 'ArrowDown' && open) {
						focusFirstOption();
					}
				}}
				className={`
					min-h-[40px] border rounded-md p-2 cursor-pointer
					${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
					${open ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'}
					focus:outline-none focus:ring-2 focus:ring-blue-500
				`}
				data-testid={`${testId}-trigger`}
			>
				<div className="flex flex-wrap gap-1">
					{selectedOptions.map(opt => (
						<span
							key={opt.id}
							className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
						>
							{opt.name}
							<button
								type="button"
								aria-label={`Remove ${opt.name}`}
								onClick={(e) => {
									e.stopPropagation();
									handleChipRemove(opt.id);
								}}
								className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
							>
								<X size={12} />
							</button>
						</span>
					))}
					{selectedOptions.length === 0 && (
						<span className="text-gray-500">{placeholder}</span>
					)}
				</div>
				<ChevronDown
					size={16}
					className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-transform ${
						open ? 'rotate-180' : ''
					}`}
				/>
			</div>

			{/* Dropdown */}
			{open && (
				<div
					role="dialog"
					aria-modal="false"
					className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
					onMouseDown={(e) => e.preventDefault()}
				>
					{/* Search */}
					<div className="p-2 border-b">
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search trusts..."
							className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
							data-testid={`${testId}-search`}
							aria-label="Search trusts"
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-2 p-2 border-b">
													<button
								type="button"
								onClick={handleSelectAll}
								className="text-xs text-blue-600 hover:text-blue-800"
								data-testid={`${testId}-select-all`}
							>
								Select all
							</button>
							<button
								type="button"
								onClick={handleClear}
								className="text-xs text-gray-600 hover:text-gray-800"
								data-testid={`${testId}-clear`}
							>
								Clear
							</button>
					</div>

					{/* Options */}
					<ul
						ref={listRef}
						id={listId}
						role="listbox"
						aria-multiselectable="true"
						className="max-h-56 overflow-auto"
						data-testid={`${testId}-list`}
					>
						{filteredOptions.map((opt, index) => (
							<button
								key={opt.id}
								id={`trust-opt-${opt.id}`}
								type="button"
								onClick={() => {
									console.log('Trust option clicked:', opt.id, opt.name);
									handleOptionToggle(opt.id);
								}}
								onKeyDown={(e) => {
									if (e.key === 'ArrowDown') focusOption(index + 1);
									if (e.key === 'ArrowUp') focusOption(index - 1);
									if (e.key === 'Escape') close();
								}}
								className={`
									w-full text-left flex items-center gap-2 px-2 py-1 cursor-pointer select-none
									${selected.has(opt.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}
									${focusedIndex === index ? 'ring-1 ring-blue-500' : ''}
								`}
								data-testid={`${testId}-opt-${opt.id}`}
								style={{ userSelect: 'none' }}
							>
								<input
									type="checkbox"
									readOnly
									checked={selected.has(opt.id)}
									className="pointer-events-none"
								/>
								<span className="truncate">{opt.name}</span>
							</button>
						))}
						{filteredOptions.length === 0 && (
							<li className="px-2 py-1 text-sm text-gray-500">
								No trusts match your search
							</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
