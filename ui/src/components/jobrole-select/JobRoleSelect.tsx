import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { jobRolesApi } from '../../lib/api/jobRoles.js';

export type Option = { id: string; name: string; code: string };

type Props = {
	value?: string | null; // jobRoleId
	onChange: (id: string | null) => void;
	disabled?: boolean;
	'data-testid'?: string;
};

export function JobRoleSelect({
	value,
	onChange,
	disabled = false,
	'data-testid': testId = 'jobrole-select',
}: Props) {
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const triggerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const listId = `${testId}-list`;

	// Fetch job roles
	const { data: jobRoles = [], isLoading, error } = useQuery({
		queryKey: ['job-roles'],
		queryFn: async () => {
			const response = await jobRolesApi.list();
			return response.data || [];
		},
	});

	// Filter options based on search term
	const filteredOptions = jobRoles.filter(opt =>
		opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		opt.code.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Find selected option
	const selectedOption = jobRoles.find(opt => opt.id === value);

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
						onChange(filteredOptions[focusedIndex].id);
						close();
					}
					break;
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [open, focusedIndex, filteredOptions, onChange]);

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			
			// Check if click is inside the trigger OR inside the dropdown
			const isInsideTrigger = triggerRef.current && triggerRef.current.contains(target);
			const isInsideDropdown = listRef.current && listRef.current.contains(target);
			
			if (!isInsideTrigger && !isInsideDropdown) {
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

	if (isLoading) {
		return (
			<div className="border border-gray-300 rounded-md p-3 bg-gray-50">
				<div className="text-sm text-gray-500">Loading job roles...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="border border-red-300 rounded-md p-3 bg-red-50">
				<div className="text-sm text-red-600">Error loading job roles</div>
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
				<div className="flex items-center justify-between">
					<span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
						{selectedOption ? `${selectedOption.name} (${selectedOption.code})` : 'Select job role...'}
					</span>
					<ChevronDown
						size={16}
						className={`transform transition-transform ${open ? 'rotate-180' : ''}`}
					/>
				</div>
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
							placeholder="Search job roles..."
							className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
							data-testid={`${testId}-search`}
							aria-label="Search job roles"
						/>
					</div>

					{/* Options */}
					<ul
						ref={listRef}
						id={listId}
						role="listbox"
						className="max-h-56 overflow-auto"
						data-testid={`${testId}-list`}
					>
						{filteredOptions.map((opt, index) => {
							const isSelected = value === opt.id;
							const isFocused = focusedIndex === index;
							
							return (
								<li
									key={opt.id}
									id={`jobrole-opt-${opt.id}`}
									role="option"
									aria-selected={isSelected}
									tabIndex={-1}
									onMouseDown={(e) => e.preventDefault()} // keep focus
									onClick={() => {
										onChange(opt.id);
										close();
									}}
									onKeyDown={(e) => {
										if (e.key === 'ArrowDown') focusOption(index + 1);
										if (e.key === 'ArrowUp') focusOption(index - 1);
										if (e.key === 'Escape') close();
									}}
									className={`
										flex items-center gap-2 px-3 py-2 cursor-pointer
										${isFocused ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}
										${isSelected ? 'bg-gray-50' : ''}
									`}
									data-testid={`${testId}-opt-${opt.id}`}
								>
									{isSelected && (
										<Check size={16} className="text-blue-600" />
									)}
									<div className="flex-1">
										<div className="font-medium">{opt.name}</div>
										<div className="text-sm text-gray-500">{opt.code}</div>
									</div>
								</li>
							);
						})}
						{filteredOptions.length === 0 && (
							<li className="px-3 py-2 text-sm text-gray-500">
								No job roles match your search
							</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
