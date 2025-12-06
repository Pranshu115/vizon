'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface BrowseFiltersProps {
  onFilterChange: (filters: any) => void
  totalCars: number
}

export default function BrowseFilters({ onFilterChange, totalCars }: BrowseFiltersProps) {
  const [isPriceRangeOpen, setIsPriceRangeOpen] = useState(true)
  const [isBrandOpen, setIsBrandOpen] = useState(false)
  const [isYearOpen, setIsYearOpen] = useState(false)
  const [isKmDrivenOpen, setIsKmDrivenOpen] = useState(false)
  const [isFuelTypeOpen, setIsFuelTypeOpen] = useState(false)
  const [isColorOpen, setIsColorOpen] = useState(false)
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false)
  const [isOwnerOpen, setIsOwnerOpen] = useState(false)
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false)

  const [priceMin, setPriceMin] = useState(50000)
  const [priceMax, setPriceMax] = useState(7000000)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedKmDriven, setSelectedKmDriven] = useState('')
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [selectedOwner, setSelectedOwner] = useState('')
  const [selectedAvailability, setSelectedAvailability] = useState('')

  // Use ref to track previous filter values to prevent infinite loops
  const prevFiltersRef = useRef<string>('')

  // Auto-apply filters whenever any filter value changes
  useEffect(() => {
    const currentFilters = JSON.stringify({
      priceMin,
      priceMax,
      selectedBrands,
      selectedYear,
      selectedKmDriven,
      selectedFuelTypes,
      selectedColors,
      selectedFeatures,
      selectedOwner,
      selectedAvailability
    })

    // Only call onFilterChange if filters actually changed
    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters
      onFilterChange({
        priceMin,
        priceMax,
        selectedBrands,
        selectedYear,
        selectedKmDriven,
        selectedFuelTypes,
        selectedColors,
        selectedFeatures,
        selectedOwner,
        selectedAvailability
      })
    }
  }, [priceMin, priceMax, selectedBrands, selectedYear, selectedKmDriven, 
      selectedFuelTypes, selectedColors, selectedFeatures, selectedOwner, selectedAvailability, onFilterChange])

  const handleReset = () => {
    setPriceMin(50000)
    setPriceMax(7000000)
    setSelectedBrands([])
    setSelectedYear('')
    setSelectedKmDriven('')
    setSelectedFuelTypes([])
    setSelectedColors([])
    setSelectedFeatures([])
    setSelectedOwner('')
    setSelectedAvailability('')
    onFilterChange({
      priceMin: 0,
      priceMax: 10000000,
      selectedBrands: [],
      selectedYear: '',
      selectedKmDriven: '',
      selectedFuelTypes: [],
      selectedColors: [],
      selectedFeatures: [],
      selectedOwner: '',
      selectedAvailability: ''
    })
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const toggleFuelType = (fuel: string) => {
    setSelectedFuelTypes(prev => 
      prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
    )
  }

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
  }

  return (
    <div className="browse-filters">
      {/* Price Range */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsPriceRangeOpen(!isPriceRangeOpen)}
        >
          <span className="filter-section-title">
            Price Range
          </span>
          <span className={`filter-arrow ${isPriceRangeOpen ? 'open' : ''}`}>
            {isPriceRangeOpen ? '−' : '+'}
          </span>
        </button>
        {isPriceRangeOpen && (
          <div className="filter-section-content">
            <div className="price-inputs">
              <div className="price-input-group">
                <label>Minimum:</label>
                <input 
                  type="text" 
                  value={`₹ ${priceMin.toLocaleString()}`}
                  onChange={(e) => setPriceMin(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                />
              </div>
              <div className="price-input-group">
                <label>Maximum:</label>
                <input 
                  type="text" 
                  value={`₹ ${priceMax.toLocaleString()}`}
                  onChange={(e) => setPriceMax(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                />
              </div>
            </div>
            
            <div className="price-range-slider">
              <input 
                type="range" 
                min="0" 
                max="10000000" 
                value={priceMin}
                onChange={(e) => setPriceMin(parseInt(e.target.value))}
                className="range-input range-min"
              />
              <input 
                type="range" 
                min="0" 
                max="10000000" 
                value={priceMax}
                onChange={(e) => setPriceMax(parseInt(e.target.value))}
                className="range-input range-max"
              />
            </div>
          </div>
        )}
      </div>

      {/* Brand */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsBrandOpen(!isBrandOpen)}
        >
          <span className="filter-section-title">
            Brand
          </span>
          <span className={`filter-arrow ${isBrandOpen ? 'open' : ''}`}>
            {isBrandOpen ? '−' : '+'}
          </span>
        </button>
        {isBrandOpen && (
          <div className="filter-section-content">
            <input type="text" placeholder="Search brands..." className="filter-search-input" />
            <div className="filter-checkboxes">
              {['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Mahindra', 'Toyota', 'Renault', 'Ford'].map(brand => (
                <label key={brand} className="filter-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Year */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsYearOpen(!isYearOpen)}
        >
          <span className="filter-section-title">
            Year
          </span>
          <span className={`filter-arrow ${isYearOpen ? 'open' : ''}`}>
            {isYearOpen ? '−' : '+'}
          </span>
        </button>
        {isYearOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['2023 & above', '2021 & above', '2019 & above', '2017 & above', '2015 & above', '2013 & above', '2011 & above'].map(year => (
                <label key={year} className="filter-checkbox">
                  <input 
                    type="radio" 
                    name="year"
                    checked={selectedYear === year}
                    onChange={() => setSelectedYear(year)}
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KM Driven */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsKmDrivenOpen(!isKmDrivenOpen)}
        >
          <span className="filter-section-title">
            KM Driven
          </span>
          <span className={`filter-arrow ${isKmDrivenOpen ? 'open' : ''}`}>
            {isKmDrivenOpen ? '−' : '+'}
          </span>
        </button>
        {isKmDrivenOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['10,000 kms or less', '30,000 kms or less', '50,000 kms or less', '75,000 kms or less', '1,00,000 kms or less', '1,25,000 kms or less'].map(km => (
                <label key={km} className="filter-checkbox">
                  <input 
                    type="radio" 
                    name="kmDriven"
                    checked={selectedKmDriven === km}
                    onChange={() => setSelectedKmDriven(km)}
                  />
                  <span>{km}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fuel Type */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsFuelTypeOpen(!isFuelTypeOpen)}
        >
          <span className="filter-section-title">
            Fuel Type
          </span>
          <span className={`filter-arrow ${isFuelTypeOpen ? 'open' : ''}`}>
            {isFuelTypeOpen ? '−' : '+'}
          </span>
        </button>
        {isFuelTypeOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map(fuel => (
                <label key={fuel} className="filter-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedFuelTypes.includes(fuel)}
                    onChange={() => toggleFuelType(fuel)}
                  />
                  <span>{fuel}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Color */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsColorOpen(!isColorOpen)}
        >
          <span className="filter-section-title">
            Color
          </span>
          <span className={`filter-arrow ${isColorOpen ? 'open' : ''}`}>
            {isColorOpen ? '−' : '+'}
          </span>
        </button>
        {isColorOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Brown', 'Other'].map(color => (
                <label key={color} className="filter-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedColors.includes(color)}
                    onChange={() => toggleColor(color)}
                  />
                  <span>{color}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
        >
          <span className="filter-section-title">
            Features
          </span>
          <span className={`filter-arrow ${isFeaturesOpen ? 'open' : ''}`}>
            {isFeaturesOpen ? '−' : '+'}
          </span>
        </button>
        {isFeaturesOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['GPS Navigation', 'Air Conditioning', 'Power Steering', 'ABS', 'Airbags', 'Reverse Camera', 'Alloy Wheels', 'Fog Lights', 'Cruise Control', 'Hydraulic Tipper', 'Refrigerated Body', 'Crane Mounted'].map(feature => (
                <label key={feature} className="filter-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                  />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}
        >
          <span className="filter-section-title">
            Availability
          </span>
          <span className={`filter-arrow ${isAvailabilityOpen ? 'open' : ''}`}>
            {isAvailabilityOpen ? '−' : '+'}
          </span>
        </button>
        {isAvailabilityOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['In stock', 'Booked', 'Upcoming'].map(availability => (
                <label key={availability} className="filter-checkbox">
                  <input 
                    type="radio" 
                    name="availability"
                    checked={selectedAvailability === availability}
                    onChange={() => setSelectedAvailability(availability)}
                  />
                  <span>{availability}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Owner */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsOwnerOpen(!isOwnerOpen)}
        >
          <span className="filter-section-title">
            Owner
          </span>
          <span className={`filter-arrow ${isOwnerOpen ? 'open' : ''}`}>
            {isOwnerOpen ? '−' : '+'}
          </span>
        </button>
        {isOwnerOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['1st Owner', '2nd Owner', '3rd Owner', '4th Owner', '5+ Owner'].map(owner => (
                <label key={owner} className="filter-checkbox">
                  <input 
                    type="radio" 
                    name="owner"
                    checked={selectedOwner === owner}
                    onChange={() => setSelectedOwner(owner)}
                  />
                  <span>{owner}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Found Cars Count and Clear All Button */}
      <div className="filter-results">
        <p>Found trucks: <strong>{totalCars.toLocaleString()}</strong></p>
        <button 
          onClick={handleReset}
          className="clear-all-btn"
        >
          Clear All
        </button>
      </div>
    </div>
  )
}
