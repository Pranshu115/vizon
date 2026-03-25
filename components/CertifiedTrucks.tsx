'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveTruckListImageUrl } from '@/lib/truck-listing-images'
import { formatTruckListingLocation } from '@/lib/utils'

interface TruckSpec {
  year: string
  km: string
  hp: string
}

interface TruckCardProps {
  badge: string
  name: string
  subtitle: string
  specs: TruckSpec
  price: string
  image?: string
  gradient: string
  onInquire: () => void
}

const TruckCard = ({ badge, name, subtitle, specs, price, image, gradient, onInquire }: TruckCardProps) => {
  return (
    <div className="truck-card-apple">
      <div className="truck-card-image-apple">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
            className="truck-card-img"
            unoptimized
          />
        )}
        <div className="truck-card-overlay">
          <div className="truck-badge-certified-apple">{badge}</div>
          <div className="truck-card-text-overlay">
            <h3 className="truck-card-name-overlay">{name}</h3>
            <p className="truck-card-subtitle-overlay">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="truck-card-content-apple">
        <div className="truck-card-specs-apple">
          <div className="truck-spec-apple">
            <span className="truck-spec-value-apple">{specs.year}</span>
            <span className="truck-spec-label-apple">Year</span>
          </div>
          <div className="truck-spec-divider"></div>
          <div className="truck-spec-apple">
            <span className="truck-spec-value-apple">{specs.km}</span>
            <span className="truck-spec-label-apple">KM</span>
          </div>
          <div className="truck-spec-divider"></div>
          <div className="truck-spec-apple">
            <span className="truck-spec-value-apple">{specs.hp}</span>
            <span className="truck-spec-label-apple">HP</span>
          </div>
        </div>
        <div className="truck-card-footer-apple">
          <div className="truck-card-price-apple">{price}</div>
          <button className="truck-card-cta-apple" onClick={onInquire}>View Details →</button>
        </div>
      </div>
    </div>
  )
}

export default function CertifiedTrucks() {
  const [trucks, setTrucks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchTrucks()
  }, [])

  const fetchTrucks = async () => {
    try {
      const response = await fetch('/api/trucks')
      const data = await response.json()

      const formatTrucks = (rawTrucks: any[]) => {
        return (rawTrucks || []).map((truck: any) => {
          const isAshokLeyland1415 =
            (truck.name || '').toUpperCase() === 'ASHOK LEYLAND ECOMET STAR 1415 HE'
          const isAshokLeyland1615 =
            (truck.name || '').toUpperCase() === 'ASHOK LEYLAND ECOMET STAR 1615 HE'
          const isEicher2059XP =
            (truck.name || '').toLowerCase().includes('2059') && (truck.name || '').toLowerCase().includes('eicher')
          const isEicher1075HSD =
            (truck.name || '').toLowerCase().includes('1075') && (truck.name || '').toLowerCase().includes('eicher')
          const isMahindraBolero = truck.name === 'Mahindra Bolero Maxitruck Plus'
          const isSmlIsuzu = truck.name === 'SML Isuzu Samrat 4760gs'
          const isSmlIsuzuZT54 = (truck.name || '').toLowerCase().includes('zt54') && (truck.name || '').toLowerCase().includes('sml')
          const isTata1109gLPT = (truck.name || '').toLowerCase().includes('1109') && (truck.name || '').toLowerCase().includes('lpt') && ((truck.name || '').toLowerCase().includes('tata') || truck.manufacturer === 'Tata Motors')

          const price =
            isAshokLeyland1415
              ? '₹14,30,000'
              : isAshokLeyland1615
                ? '₹15,40,000'
                : isEicher2059XP
                  ? '₹9,20,000'
                  : isEicher1075HSD
                    ? '₹9,50,000'
                    : isTata1109gLPT
                      ? '₹13,50,000'
                    : isMahindraBolero || isSmlIsuzuZT54
                      ? '₹6,30,000'
              : `₹${parseFloat(truck.price?.toString() || '0').toLocaleString('en-IN')}`

          const mileage =
            isAshokLeyland1415
              ? '2,36,133 km'
              : isEicher2059XP
                ? '1,83,889 km'
                : isEicher1075HSD || isSmlIsuzuZT54
                  ? '2,29,537 km'
                  : isTata1109gLPT
                    ? '1,62,134 km'
              : `${truck.kilometers?.toLocaleString('en-IN') || '0'} km`

          const engine =
            isAshokLeyland1415 || isAshokLeyland1615 || isEicher2059XP || isMahindraBolero || isSmlIsuzu || isTata1109gLPT
              ? 'CNG'
              : isEicher1075HSD || isSmlIsuzuZT54
                ? 'Diesel'
              : (truck.fuel_type as string) || 'Diesel'

          return {
            id: truck.id,
            name: truck.name || `${truck.year} ${truck.manufacturer} ${truck.model}`,
            year: truck.year,
            price,
            mileage,
            engine,
            transmission: 'Manual',
            location: isAshokLeyland1415 || isAshokLeyland1615 ? 'GHAZIABAD' : isEicher2059XP ? 'Dwarka, Delhi' : isEicher1075HSD ? 'Uttam Nagar' : isMahindraBolero || isSmlIsuzu ? 'RAJPUR ROAD' : isSmlIsuzuZT54 ? 'Ghaziabad, UP' : isTata1109gLPT ? 'Gurugram' : formatTruckListingLocation(truck),
            image: resolveTruckListImageUrl(truck),
            certified: truck.certified ?? true,
            manufacturer: truck.manufacturer,
            model: truck.model,
          }
        })
      }

      // Handle new paginated response format
      if (response.ok) {
        if (data.trucks && Array.isArray(data.trucks)) {
          setTrucks(formatTrucks(data.trucks))
        } else if (Array.isArray(data)) {
          setTrucks(formatTrucks(data))
        } else {
          console.error('Error fetching trucks: Invalid response format')
          setTrucks([])
        }
      } else {
        // Handle error response
        console.error('Error fetching trucks:', data.error || 'Unknown error')
        setTrucks([])
      }
    } catch (error) {
      console.error('Error fetching trucks:', error)
      setTrucks([])
    } finally {
      setLoading(false)
    }
  }

  const handleInquire = (truckId: number) => {
    // Navigate to the full truck details page in the same tab
    router.push(`/truck/${truckId}`)
  }

  if (loading) {
    return (
      <section className="certified-trucks-section">
        <div className="certified-trucks-container">
          <h2 className="certified-trucks-heading">Curated & Certified Trucks</h2>
          <div className="truck-cards-grid">
            <p>Loading trucks...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="certified-trucks-section" id="certified-trucks">
      <div className="certified-trucks-container">
        <h2 className="certified-trucks-heading">Curated & Certified Trucks</h2>
        <div className="truck-cards-grid">
          {trucks.length > 0 ? (
            trucks.map((truck) => (
              <TruckCard
                key={truck.id}
                badge="Axlerator Certified"
                name={truck.manufacturer && truck.model ? `${truck.manufacturer} ${truck.model}` : truck.name}
                subtitle={truck.year?.toString() || truck.subtitle || 'Premium quality truck'}
                specs={{
                  year: truck.year?.toString() ?? '–',
                  km: truck.kilometers?.toLocaleString() || '0',
                  hp: truck.horsepower != null ? String(truck.horsepower) : '–'
                }}
                price={`₹ ${truck.price ? parseFloat(truck.price).toLocaleString('en-IN') : '0'}`}
                image={truck.image}
                gradient="linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)"
                onInquire={() => handleInquire(truck.id)}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No trucks available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
        <div className="browse-all-container">
          <button className="browse-all-btn" onClick={() => window.location.href = '/browse-trucks'}>
            Browse All Trucks
          </button>
        </div>
      </div>
    </section>
  )
}
