'use client'

import { useState, useRef, useEffect } from 'react'

type Option = string | { label: string; value: string }

interface CustomSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  required?: boolean
  label?: string
}

// Global state to track which dropdown is open
let openDropdownId: string | null = null
const dropdownListeners: Map<string, () => void> = new Map()

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  label
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close this dropdown if another one opens
  useEffect(() => {
    const closeHandler = () => {
      if (openDropdownId !== id && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    dropdownListeners.set(id, closeHandler)
    return () => {
      dropdownListeners.delete(id)
    }
  }, [id, isOpen])

  // Handle opening/closing and notify other dropdowns
  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    
    if (newIsOpen) {
      // Close all other dropdowns
      openDropdownId = id
      dropdownListeners.forEach((closeHandler, dropdownId) => {
        if (dropdownId !== id) {
          closeHandler()
        }
      })
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      if (openDropdownId === id) {
        openDropdownId = null
      }
      setSearchQuery('')
    }
  }

  // Helper functions to get label and value from option
  const getOptionLabel = (option: Option): string => {
    return typeof option === 'string' ? option : option.label
  }

  const getOptionValue = (option: Option): string => {
    return typeof option === 'string' ? option : option.value
  }

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option)
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Get the selected label for display
  const getSelectedLabel = (): string => {
    if (!value) return placeholder
    const selectedOption = options.find(opt => getOptionValue(opt) === value)
    return selectedOption ? getOptionLabel(selectedOption) : value
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        if (openDropdownId === id) {
          openDropdownId = null
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, id])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
        if (openDropdownId === id) {
          openDropdownId = null
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, id])

  const handleSelect = (option: Option) => {
    onChange(getOptionValue(option))
    setIsOpen(false)
    setSearchQuery('')
    if (openDropdownId === id) {
      openDropdownId = null
    }
  }

  const selectedLabel = getSelectedLabel()

  return (
    <div className="custom-select-wrapper" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="custom-select-label">
          {label}
        </label>
      )}
      <div className="custom-select">
        <button
          type="button"
          id={id}
          className={`custom-select-trigger ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''} ${required && !value ? 'required' : ''}`}
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="custom-select-value">{selectedLabel}</span>
          <svg
            className="custom-select-arrow"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9L1 4h10z" />
          </svg>
        </button>

        {isOpen && (
          <div className="custom-select-dropdown">
            <div className="custom-select-search">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="custom-select-search-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="custom-select-options">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const optionValue = getOptionValue(option)
                  const optionLabel = getOptionLabel(option)
                  return (
                    <button
                      key={typeof option === 'string' ? option : `${option.value}-${index}`}
                      type="button"
                      className={`custom-select-option ${value === optionValue ? 'selected' : ''}`}
                      onClick={() => handleSelect(option)}
                    >
                      {optionLabel}
                    </button>
                  )
                })
              ) : (
                <div className="custom-select-no-results">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

