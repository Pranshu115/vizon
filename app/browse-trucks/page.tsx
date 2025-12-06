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
    selectedFeatures: [] as string[],
    selectedOwner: '',
    selectedAvailability: '',
    transmission: '',
    location: ''
  })

  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all certified trucks from database (increase limit to get all trucks)
      const certifiedResponse = await fetch('/api/trucks?limit=100')
      const certifiedResult = await certifiedResponse.json()
      
      // Handle paginated response format
      const certifiedTrucks = certifiedResult.trucks || (Array.isArray(certifiedResult) ? certifiedResult : [])
      
      // Fetch approved truck submissions
      const submissionsResponse = await fetch('/api/truck-submissions?status=approved')
      const submissionsResult = await submissionsResponse.json()
      
      // Handle paginated response format
      const submissions = submissionsResult.submissions || (Array.isArray(submissionsResult) ? submissionsResult : [])
      
      // Transform certified trucks
      const formattedCertified: Truck[] = certifiedTrucks.map((truck: any) => ({
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
        availability: 'In stock'
      }))
      
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
          availability: sub.negotiable ? 'Negotiable' : 'Fixed Price'
        }
      })
      
      // Combine both datasets
      const allTrucks = [...formattedCertified, ...formattedSubmissions]
      
      setTrucks(allTrucks)
      setFilteredTrucks(allTrucks)
    } catch (error) {
      console.error('Error fetching trucks:', error)
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

    // Year filter - new format (2023 & above, 2021 & above, etc.)
    if (filters.selectedYear) {
      const yearThreshold = parseInt(filters.selectedYear.split(' ')[0])
      filtered = filtered.filter(truck => truck.year >= yearThreshold)
      console.log('After year filter:', filtered.length, 'threshold:', yearThreshold)
    }

    // KM Driven filter - new format (10,000 kms or less, etc.)
    if (filters.selectedKmDriven) {
      const kmThreshold = parseInt(filters.selectedKmDriven.replace(/[^0-9]/g, ''))
      console.log('KM Filter active! Threshold:', kmThreshold)
      filtered = filtered.filter(truck => {
        const km = parseInt(truck.mileage.replace(/[^0-9]/g, ''))
        const passes = km <= kmThreshold
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

    console.log('FINAL FILTERED TRUCKS:', filtered.length)
    console.log('======================')
    setFilteredTrucks(filtered)
  }, [filters, trucks])

  useEffect(() => {
    // Read location from URL query parameters
    const locationParam = searchParams.get('location')
    if (locationParam) {
      setFilters(prev => ({ ...prev, location: locationParam }))
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
      selectedFeatures: [],
      selectedOwner: '',
      selectedAvailability: '',
      transmission: '',
      location: ''
    }

    return (
      filters.priceMin !== defaultFilters.priceMin ||
      filters.priceMax !== defaultFilters.priceMax ||
      filters.selectedBrands.length > 0 ||
      filters.selectedYear !== '' ||
      filters.selectedKmDriven !== '' ||
      filters.selectedFuelTypes.length > 0 ||
      filters.selectedColors.length > 0 ||
      filters.selectedFeatures.length > 0 ||
      filters.selectedOwner !== '' ||
      filters.selectedAvailability !== '' ||
      filters.transmission !== '' ||
      filters.location !== ''
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
                  onClick={() => setFilters({
                    priceMin: 50000,
                    priceMax: 7000000,
                    selectedBrands: [],
                    selectedYear: '',
                    selectedKmDriven: '',
                    selectedFuelTypes: [],
                    selectedColors: [],
                    selectedFeatures: [],
                    selectedOwner: '',
                    selectedAvailability: '',
                    transmission: '',
                    location: ''
                  })}
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
                onClick={() => setFilters({
                  priceMin: 50000,
                  priceMax: 7000000,
                  selectedBrands: [],
                  selectedYear: '',
                  selectedKmDriven: '',
                  selectedFuelTypes: [],
                  selectedColors: [],
                  selectedFeatures: [],
                  selectedOwner: '',
                  selectedAvailability: '',
                  transmission: '',
                  location: ''
                })}
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
