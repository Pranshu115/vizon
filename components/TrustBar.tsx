'use client'

import LogoLoop from './LogoLoop'

const partnerLogos = [
  { src: '/logos/EicherMotors.svg', alt: 'Eicher Motors', href: 'https://eicher.in' },
  { src: '/logos/AshokLeyland.svg', alt: 'Ashok Leyland', href: 'https://www.ashokleyland.com' },
  { src: '/logos/TataMotors.svg', alt: 'Tata Motors', href: 'https://www.tatamotors.com' },
  { src: '/logos/Mahindra.svg', alt: 'Mahindra', href: 'https://www.mahindra.com' },
  { src: '/logos/Suzuki.svg', alt: 'Suzuki', href: 'https://www.globalsuzuki.com' },
]

export default function TrustBar() {
  return (
    <section className="trust-bar-section">
      <div className="trust-bar-container">
        <h2 className="trust-bar-heading">Trusted by Industry Leaders</h2>
        <div className="trust-bar-logos">
          <LogoLoop
            logos={partnerLogos}
            speed={30}
            direction="left"
            logoHeight={80}
            gap={60}
            pauseOnHover
            scaleOnHover
            fadeOut
            fadeOutColor="rgba(248, 249, 250, 1)"
            ariaLabel="Our trusted partners"
          />
        </div>
      </div>
    </section>
  )
}
