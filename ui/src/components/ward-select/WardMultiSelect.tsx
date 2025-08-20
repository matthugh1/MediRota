import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { WardOption } from './useWardOptions.js';

type Props = {
  value: string[]; // selected wardIds
  onChange: (ids: string[]) => void;
  options: WardOption[];
  loading?: boolean;
  error?: string | null;
  groupByHospital?: boolean; // default false
  disabled?: boolean;
  placeholder?: string; // "Search wards…"
  'data-testid'?: string;
};

export const WardMultiSelect: React.FC<Props> = ({
  value,
  onChange,
  options,
  loading = false,
  error = null,
  groupByHospital = false,
  disabled = false,
  placeholder = "Search wards…",
  'data-testid': testId = "ward-multiselect",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  const listId = `${testId}-list`;

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(option => 
      option.name.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // Get selected options
  const selectedOptions = React.useMemo(() => {
    return options.filter(option => value.includes(option.id));
  }, [options, value]);

  // Group filtered options by hospital if needed
  const groupedFilteredOptions = React.useMemo(() => {
    if (!groupByHospital || !filteredOptions.length) return {};
    
    const hospitals = new Set(filteredOptions.map(ward => ward.hospital?.name).filter(Boolean));
    if (hospitals.size <= 1) return {};
    
    const grouped: Record<string, WardOption[]> = {};
    filteredOptions.forEach(ward => {
      const hospitalName = ward.hospital?.name || 'Unknown Hospital';
      if (!grouped[hospitalName]) {
        grouped[hospitalName] = [];
      }
      grouped[hospitalName].push(ward);
    });
    
    return grouped;
  }, [filteredOptions, groupByHospital]);

  // Handle option selection
  const handleOptionToggle = useCallback((optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
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

  // Handle chip removal
  const handleChipRemove = useCallback((optionId: string) => {
    onChange(value.filter(id => id !== optionId));
  }, [value, onChange]);

  // Focus management helpers
  const focusFirstOption = useCallback(() => {
    setFocusedIndex(0);
  }, []);

  const focusOption = useCallback((index: number) => {
    const maxIndex = filteredOptions.length - 1;
    if (index < 0) setFocusedIndex(maxIndex);
    else if (index > maxIndex) setFocusedIndex(0);
    else setFocusedIndex(index);
  }, [filteredOptions.length]);

  // Keyboard navigation for trigger
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }
    if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      focusFirstOption();
    }
  }, [isOpen, focusFirstOption]);

  // Keyboard navigation for options
  const handleOptionKeyDown = useCallback((e: React.KeyboardEvent, optionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionToggle(optionId);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = filteredOptions.findIndex(opt => opt.id === optionId);
      focusOption(currentIndex + 1);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = filteredOptions.findIndex(opt => opt.id === optionId);
      focusOption(currentIndex - 1);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    }
  }, [filteredOptions, handleOptionToggle, focusOption]);

  // Handle backspace in search input
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !searchTerm && selectedOptions.length > 0) {
      e.preventDefault();
      const lastSelected = selectedOptions[selectedOptions.length - 1];
      handleChipRemove(lastSelected.id);
    }
  }, [searchTerm, selectedOptions, handleChipRemove]);

  // Reset focus when opening/closing
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const hasMultipleHospitals = Object.keys(groupedFilteredOptions).length > 0;

  return (
    <div className="relative" data-testid={testId}>
      {/* Trigger div */}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className={`
          w-full min-h-[40px] px-3 py-2 text-left border rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled || loading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
        `}
        data-testid="ward-ms-trigger"
      >
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                <span className="truncate max-w-[120px]">{option.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${option.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChipRemove(option.id);
                  }}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">
              {loading ? 'Loading wards...' : placeholder}
            </span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div role="dialog" aria-modal="false" className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search wards..."
                aria-label="Search wards"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="ward-ms-search"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                data-testid="ward-ms-select-all"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
                data-testid="ward-ms-clear"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-auto"
            data-testid="ward-ms-list"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No wards match your search</li>
            ) : hasMultipleHospitals ? (
              // Grouped by hospital
              Object.entries(groupedFilteredOptions).map(([hospitalName, hospitalWards]) => (
                <div key={hospitalName}>
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                    {hospitalName}
                  </div>
                  {hospitalWards.map((option, index) => {
                    const globalIndex = filteredOptions.findIndex(opt => opt.id === option.id);
                    const isSelected = value.includes(option.id);
                    const isFocused = focusedIndex === globalIndex;
                    
                    return (
                      <li
                        key={option.id}
                        id={`ward-opt-${option.id}`}
                        data-index={globalIndex}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleOptionToggle(option.id)}
                        onKeyDown={(e) => handleOptionKeyDown(e, option.id)}
                        className={`
                          flex items-center gap-2 px-3 py-2 cursor-pointer
                          ${isFocused ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}
                          ${isSelected ? 'bg-gray-50' : ''}
                        `}
                        data-testid={`ward-ms-opt-${option.id}`}
                      >
                        <input 
                          type="checkbox" 
                          readOnly 
                          checked={isSelected} 
                          className="pointer-events-none" 
                        />
                        <span className="truncate">{option.name}</span>
                        {option.hospital?.name && (
                          <span className="ml-auto text-xs text-gray-500">{option.hospital.name}</span>
                        )}
                      </li>
                    );
                  })}
                </div>
              ))
            ) : (
              // Simple list
              filteredOptions.map((option, index) => {
                const isSelected = value.includes(option.id);
                const isFocused = focusedIndex === index;
                
                return (
                  <li
                    key={option.id}
                    id={`ward-opt-${option.id}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleOptionToggle(option.id)}
                    onKeyDown={(e) => handleOptionKeyDown(e, option.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 cursor-pointer
                      ${isFocused ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}
                      ${isSelected ? 'bg-gray-50' : ''}
                    `}
                    data-testid={`ward-ms-opt-${option.id}`}
                  >
                    <input 
                      type="checkbox" 
                      readOnly 
                      checked={isSelected} 
                      className="pointer-events-none" 
                    />
                    <span className="truncate">{option.name}</span>
                    {option.hospital?.name && (
                      <span className="ml-auto text-xs text-gray-500">{option.hospital.name}</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
