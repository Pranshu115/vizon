'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TruckCard from '@/components/TruckCard'
import BrowseFilters from '@/components/BrowseFilters'
import Footer from '@/components/Footer'

interface Truck {
  id: number
  name: string
  year: number
  price: string
  mileage: string
  engine: string
  transmission: string
  location: string
  image: string
  certified: boolean
  availability?: string
  features?: string[]
  color?: string
  owner?: string
}

function BrowseTrucksContent() {
  const searchParams = useSearchParams()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    priceMin: 50000,
    priceMax: 7000000,
    selectedBrands: [] as string[],
    selectedYear: '',
    selectedKmDriven: '',
    selectedFuelTypes: [] as string[],
    selectedColors: [] as string[],
    selectedOwner: '',
    selectedAvailability: '',
    transmission: '',
    location: '',
    selectedRTOLocation: '',
    searchQuery: ''
  })

  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all certified trucks from database (increase limit to get all trucks)
      let certifiedTrucks: any[] = []
      try {
        const certifiedResponse = await fetch('/api/trucks?limit=100')
        if (!certifiedResponse.ok) {
          console.error('Failed to fetch trucks:', certifiedResponse.status, certifiedResponse.statusText)
        } else {
          const certifiedResult = await certifiedResponse.json()
          // Handle paginated response format
          certifiedTrucks = certifiedResult.trucks || (Array.isArray(certifiedResult) ? certifiedResult : [])
        }
      } catch (error) {
        console.error('Error fetching certified trucks:', error)
      }
      
      // Fetch approved truck submissions
      let submissions: any[] = []
      try {
        const submissionsResponse = await fetch('/api/truck-submissions?status=approved')
        if (!submissionsResponse.ok) {
          console.error('Failed to fetch submissions:', submissionsResponse.status, submissionsResponse.statusText)
        } else {
          const submissionsResult = await submissionsResponse.json()
          // Handle paginated response format
          submissions = submissionsResult.submissions || (Array.isArray(submissionsResult) ? submissionsResult : [])
        }
      } catch (error) {
        console.error('Error fetching truck submissions:', error)
      }
      
      // Transform certified trucks
      const formattedCertified: Truck[] = certifiedTrucks.map((truck: any) => {
        // Parse features if available
        let features: string[] = []
        if (truck.features) {
          try {
            features = typeof truck.features === 'string' ? JSON.parse(truck.features) : truck.features
            if (!Array.isArray(features)) features = []
          } catch (e) {
            features = []
          }
        }
        
        return {
        id: truck.id,
        name: `${truck.year} ${truck.manufacturer} ${truck.model}`,
        year: truck.year,
        price: `₹${parseFloat(truck.price.toString()).toLocaleString('en-IN')}`,
        mileage: `${truck.kilometers?.toLocaleString() || '0'} km`,
        engine: 'Diesel', // Default, can be enhanced with fuelType field
        transmission: 'Manual', // Default, can be enhanced with transmission field
        location: truck.location || truck.city || 'Unknown',
        image: truck.imageUrl,
        certified: truck.certified ?? true,
          availability: 'In stock',
          features: features,
          color: truck.color || undefined,
          owner: truck.ownerNumber ? `${truck.ownerNumber}${truck.ownerNumber === 1 ? 'st' : truck.ownerNumber === 2 ? 'nd' : truck.ownerNumber === 3 ? 'rd' : 'th'} Owner` : '1st Owner'
        }
      })
      
      // Transform submissions
      const formattedSubmissions: Truck[] = submissions.map((sub: any) => {
        let imageUrl = '/default-truck.png'
        try {
          if (sub.images) {
            const images = typeof sub.images === 'string' ? JSON.parse(sub.images) : sub.images
            imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : imageUrl
          }
        } catch (e) {
          console.warn('Error parsing images for submission:', sub.id)
        }
        
        // Parse features if available
        let features: string[] = []
        if (sub.features) {
          try {
            features = typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features
            if (!Array.isArray(features)) features = []
          } catch (e) {
            features = []
          }
        }
        
        // Format owner number
        const ownerNumber = sub.ownerNumber || 1
        const ownerText = `${ownerNumber}${ownerNumber === 1 ? 'st' : ownerNumber === 2 ? 'nd' : ownerNumber === 3 ? 'rd' : 'th'} Owner`
        
        return {
          id: sub.id + 10000, // Offset ID to avoid conflicts
          name: `${sub.year} ${sub.manufacturer} ${sub.model}`,
          year: sub.year,
          price: `₹${parseFloat(sub.askingPrice.toString()).toLocaleString('en-IN')}`,
          mileage: `${sub.kilometers?.toLocaleString() || '0'} km`,
          engine: sub.fuelType || 'Diesel',
          transmission: sub.transmission || 'Manual',
          location: `${sub.city || 'Unknown'}, ${sub.state || 'Unknown'}`,
          image: imageUrl,
          certified: sub.certified ?? false,
          availability: sub.negotiable ? 'Negotiable' : 'Fixed Price',
          features: features,
          color: sub.color || undefined,
          owner: ownerText
        }
      })
      
      // Combine both datasets
      const allTrucks = [...formattedCertified, ...formattedSubmissions]
      
      setTrucks(allTrucks)
      setFilteredTrucks(allTrucks)
    } catch (error) {
      console.error('Error in fetchTrucks:', error)
      // Set empty arrays on error instead of dummy data
      setTrucks([])
      setFilteredTrucks([])
    } finally {
      setLoading(false)
    }
  }, [])

  const applyFilters = useCallback(() => {
    let filtered = [...trucks]

    console.log('=== APPLYING FILTERS ===')
    console.log('Total trucks:', trucks.length)
    console.log('Filters:', filters)

    // Search filter - filter by truck name, manufacturer, or model
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim()
      filtered = filtered.filter(truck => {
        const truckName = truck.name.toLowerCase()
        // Also check manufacturer and model if available
        const manufacturer = truck.name.split(' ').slice(1).join(' ').toLowerCase() // Extract manufacturer from name
        return truckName.includes(query) || manufacturer.includes(query)
      })
      console.log('After search filter:', filtered.length)
    }

    // Price filter - convert price string to rupees for comparison
    filtered = filtered.filter(truck => {
      // Remove currency symbol and commas, then parse as rupees
      const priceText = truck.price.replace(/[^0-9]/g, '')
      const priceInRupees = parseInt(priceText) || 0
      const passes = priceInRupees >= filters.priceMin && priceInRupees <= filters.priceMax
      if (!passes) {
        console.log(`Price filter removed: ${truck.name} (₹${priceInRupees})`)
      }
      return passes
    })
    console.log('After price filter:', filtered.length)

    console.log('After price filter:', filtered.length)

    // Brand filter
    if (filters.selectedBrands && filters.selectedBrands.length > 0) {
      filtered = filtered.filter(truck =>
        filters.selectedBrands.some((brand: string) => 
          truck.name.toLowerCase().includes(brand.toLowerCase())
        )
      )
      console.log('After brand filter:', filtered.length)
    }

    // Year filter - range-based format
    if (filters.selectedYear) {
      const yearRange = filters.selectedYear
      let minYear = 0
      let maxYear = new Date().getFullYear()
      
      // Parse the range from the selected option
      if (yearRange === 'Before 2009') {
        minYear = 0
        maxYear = 2008
      } else {
        // Parse range format like "2021 - 2024"
        const rangeMatch = yearRange.match(/(\d{4})\s*-\s*(\d{4})/)
        if (rangeMatch) {
          minYear = parseInt(rangeMatch[1])
          maxYear = parseInt(rangeMatch[2])
        }
      }
      
      console.log('Year Filter active! Range:', minYear, '-', maxYear)
      filtered = filtered.filter(truck => {
        const passes = truck.year >= minYear && truck.year <= maxYear
        return passes
      })
      console.log('After year filter:', filtered.length)
    }

    // KM Driven filter - range-based format
    if (filters.selectedKmDriven) {
      const kmRange = filters.selectedKmDriven
      let minKm = 0
      let maxKm = Infinity
      
      // Parse the range from the selected option
      if (kmRange === 'Less than 10,000 km') {
        minKm = 0
        maxKm = 9999
      } else if (kmRange === 'More than 2,00,000 km') {
        minKm = 200000
        maxKm = Infinity
      } else {
        // Parse range format like "10,000 - 25,000 km"
        const rangeMatch = kmRange.match(/(\d{1,3}(?:,\d{2,3})*)\s*-\s*(\d{1,3}(?:,\d{2,3})*)/)
        if (rangeMatch) {
          minKm = parseInt(rangeMatch[1].replace(/,/g, ''))
          maxKm = parseInt(rangeMatch[2].replace(/,/g, ''))
        }
      }
      
      console.log('KM Filter active! Range:', minKm, '-', maxKm === Infinity ? '∞' : maxKm)
      filtered = filtered.filter(truck => {
        const km = parseInt(truck.mileage.replace(/[^0-9]/g, ''))
        const passes = km >= minKm && km <= maxKm
        console.log(`  ${truck.name}: ${km} km ${passes ? 'PASS' : 'FAIL'}`)
        return passes
      })
      console.log('After KM filter:', filtered.length)
    }

    // Fuel Type filter
    if (filters.selectedFuelTypes && filters.selectedFuelTypes.length > 0) {
      filtered = filtered.filter(truck =>
        filters.selectedFuelTypes.includes(truck.engine)
      )
      console.log('After fuel type filter:', filtered.length)
    }

    // Color filter
    if (filters.selectedColors && filters.selectedColors.length > 0) {
      filtered = filtered.filter(truck => {
        if (!truck.color) return false
        return filters.selectedColors.some(color => 
          truck.color!.toLowerCase().includes(color.toLowerCase()) ||
          color.toLowerCase().includes(truck.color!.toLowerCase())
        )
      })
      console.log('After color filter:', filtered.length)
    }

    // Owner filter
    if (filters.selectedOwner) {
      filtered = filtered.filter(truck => {
        if (!truck.owner) return false
        return truck.owner === filters.selectedOwner
      })
      console.log('After owner filter:', filtered.length)
    }

    // Availability filter
    if (filters.selectedAvailability) {
      filtered = filtered.filter(truck =>
        truck.availability === filters.selectedAvailability
      )
      console.log('After availability filter:', filtered.length)
    }
    
    // Transmission filter (if needed)
    if (filters.transmission) {
      filtered = filtered.filter(truck =>
        truck.transmission.toLowerCase() === filters.transmission.toLowerCase()
      )
      console.log('After transmission filter:', filtered.length)
    }

    // Location filter
    if (filters.location) {
      const locationMap: { [key: string]: string[] } = {
        'mumbai': ['Mumbai', 'mumbai', 'MH-01'],
        'delhi': ['Delhi', 'delhi', 'DL-01', 'New Delhi'],
        'delhi-ncr': ['Delhi', 'NCR', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad', 'DL-01'],
        'gurugram': ['Gurugram', 'Gurgaon', 'gurugram', 'gurgaon'],
        'kanpur': ['Kanpur', 'kanpur', 'UP-78'],
        'lucknow': ['Lucknow', 'lucknow', 'UP-32'],
        'chandigarh': ['Chandigarh', 'chandigarh', 'CH-01'],
        'pune': ['Pune', 'pune', 'MH-12'],
        'kolkata': ['Kolkata', 'kolkata', 'Calcutta', 'WB-01'],
        'ahmedabad': ['Ahmedabad', 'ahmedabad', 'GJ-01']
      }
      
      const locationKeywords = locationMap[filters.location.toLowerCase()] || [filters.location]
      filtered = filtered.filter(truck => {
        const truckLocation = truck.location.toLowerCase()
        return locationKeywords.some(keyword => 
          truckLocation.includes(keyword.toLowerCase())
        )
      })
      console.log('After location filter:', filtered.length)
    }

    // RTO Location filter
    if (filters.selectedRTOLocation) {
      // Extract city name and RTO code from format "City (CODE)"
      const rtoMatch = filters.selectedRTOLocation.match(/^(.+?)\s*\(([^)]+)\)$/)
      if (rtoMatch) {
        const cityName = rtoMatch[1].trim()
        const rtoCode = rtoMatch[2].trim()
        
        filtered = filtered.filter(truck => {
          const truckLocation = truck.location.toLowerCase()
          // Match by city name or RTO code
          return truckLocation.includes(cityName.toLowerCase()) || 
                 truckLocation.includes(rtoCode.toLowerCase())
        })
        console.log('After RTO location filter:', filtered.length)
      }
    }

    console.log('FINAL FILTERED TRUCKS:', filtered.length)
    console.log('======================')
    setFilteredTrucks(filtered)
  }, [filters, trucks])

  useEffect(() => {
    // Read location and search from URL query parameters
    const locationParam = searchParams.get('location')
    const searchParam = searchParams.get('search')
    
    if (locationParam) {
      setFilters(prev => ({ ...prev, location: locationParam }))
    }
    
    // Store search query in state (will be used in filtering)
    if (searchParam !== null) {
      setFilters(prev => ({ ...prev, searchQuery: searchParam }))
    } else {
      setFilters(prev => ({ ...prev, searchQuery: '' }))
    }
    
    fetchTrucks()
  }, [searchParams, fetchTrucks])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const isAnyFilterApplied = () => {
    const defaultFilters = {
      priceMin: 50000,
      priceMax: 7000000,
      selectedBrands: [],
      selectedYear: '',
      selectedKmDriven: '',
      selectedFuelTypes: [],
      selectedColors: [],
      selectedOwner: '',
      selectedAvailability: '',
      transmission: '',
      location: '',
      selectedRTOLocation: ''
    }

    return (
      filters.priceMin !== defaultFilters.priceMin ||
      filters.priceMax !== defaultFilters.priceMax ||
      filters.selectedBrands.length > 0 ||
      filters.selectedYear !== '' ||
      filters.selectedKmDriven !== '' ||
      filters.selectedFuelTypes.length > 0 ||
      filters.selectedColors.length > 0 ||
      filters.selectedOwner !== '' ||
      filters.selectedAvailability !== '' ||
      filters.transmission !== '' ||
      filters.location !== '' ||
      filters.selectedRTOLocation !== '' ||
      filters.searchQuery.trim() !== ''
    )
  }


  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="browse-trucks-page">
      <Navbar />
      
      <div className="browse-trucks-container">
        {/* Left Sidebar - Filters */}
        <aside className="browse-filters-sidebar">
          <BrowseFilters 
            onFilterChange={handleFilterChange}
            totalCars={filteredTrucks.length}
          />
        </aside>

        {/* Right Content - Truck Cards */}
        <main className="browse-trucks-content">
          <div className="browse-trucks-header">
            <h1 className="browse-trucks-title">Browse All Trucks</h1>
            <div className="browse-trucks-count-wrapper">
              <p className="browse-trucks-count">Found {filteredTrucks.length} trucks</p>
              {isAnyFilterApplied() && (
                <button 
                  onClick={() => {
                    setFilters({
                      priceMin: 50000,
                      priceMax: 7000000,
                      selectedBrands: [],
                      selectedYear: '',
                      selectedKmDriven: '',
                      selectedFuelTypes: [],
                      selectedColors: [],
                      selectedOwner: '',
                      selectedAvailability: '',
                      transmission: '',
                      location: '',
                      selectedRTOLocation: '',
                      searchQuery: ''
                    })
                    // Clear search from URL
                    const url = new URL(window.location.href)
                    url.searchParams.delete('search')
                    window.history.replaceState({}, '', url.pathname + url.search)
                  }}
                  className="clear-all-main-btn"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="browse-trucks-loading">
              <div className="loading-spinner"></div>
              <p>Loading trucks...</p>
            </div>
          ) : filteredTrucks.length === 0 ? (
            <div className="browse-trucks-empty">
              <p>No trucks found matching your criteria.</p>
              <button 
                onClick={() => {
                  setFilters({
                    priceMin: 50000,
                    priceMax: 7000000,
                    selectedBrands: [],
                    selectedYear: '',
                    selectedKmDriven: '',
                    selectedFuelTypes: [],
                    selectedColors: [],
                    selectedOwner: '',
                    selectedAvailability: '',
                    transmission: '',
                    location: '',
                    selectedRTOLocation: '',
                    searchQuery: ''
                  })
                  // Clear search from URL
                  const url = new URL(window.location.href)
                  url.searchParams.delete('search')
                  window.history.replaceState({}, '', url.pathname + url.search)
                }}
                className="reset-filters-btn"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="browse-trucks-grid">
              {filteredTrucks.map((truck) => (
                <TruckCard key={truck.id} truck={truck} />
              ))}
            </div>
          )}
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default function BrowseTrucks() {
  return (
    <Suspense fallback={
      <div className="browse-trucks-page">
        <Navbar />
        <div className="browse-trucks-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    }>
      <BrowseTrucksContent />
    </Suspense>
  )
}
