import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MultiSelectOption {
  id: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  'data-testid'?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  disabled = false,
  error,
  'data-testid': dataTestId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Filter options based on search term and exclude selected items
  const filteredOptions = options.filter(
    (option) =>
      !value.includes(option.id) &&
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected options for display
  const selectedOptions = options.filter((option) => value.includes(option.id));

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  };

  const handleSelect = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleRemove = (optionId: string) => {
    onChange(value.filter((id) => id !== optionId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex].id);
        } else if (isOpen) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Backspace':
        if (searchTerm === '' && value.length > 0) {
          handleRemove(value[value.length - 1]);
        }
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current) {
      const focusedElement = listboxRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return (
    <div className="relative" ref={containerRef} data-testid={dataTestId}>
      {/* Selected items display */}
      <div
        className={`min-h-[40px] p-2 border rounded-lg cursor-text ${
          error
            ? 'border-error-300 focus-within:border-error-500'
            : 'border-neutral-300 focus-within:border-primary-500'
        } ${disabled ? 'bg-neutral-100 cursor-not-allowed' : 'bg-white'}`}
        onClick={handleToggle}
      >
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <motion.span
              key={option.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {option.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(option.id);
                }}
                className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
          
          {/* Search input or placeholder */}
          {isOpen ? (
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 outline-none text-sm bg-transparent"
              disabled={disabled}
            />
          ) : (
            <span className="text-neutral-500 text-sm">
              {selectedOptions.length === 0 ? placeholder : ''}
            </span>
          )}
        </div>
      </div>

      {/* Dropdown arrow */}
      <button
        type="button"
        onClick={handleToggle}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
        disabled={disabled}
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          } ${disabled ? 'text-neutral-400' : 'text-neutral-500'}`}
        />
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}

      {/* Dropdown options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            <ul
              ref={listboxRef}
              role="listbox"
              aria-label="Options"
              className="py-1"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-neutral-500">
                  {searchTerm ? 'No options found' : 'No options available'}
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.id}
                    role="option"
                    aria-selected={focusedIndex === index}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      focusedIndex === index
                        ? 'bg-primary-50 text-primary-900'
                        : 'hover:bg-neutral-50 text-neutral-900'
                    }`}
                    onClick={() => handleSelect(option.id)}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelect;
