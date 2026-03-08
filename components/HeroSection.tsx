'use client'

import Link from 'next/link'

export default function HeroSection() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    
    const target = document.querySelector(targetId)
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <section id="home" className="hero-section">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="hero-video"
      >
        <source src="/herovideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">
          Smarter Way to Buy & Sell Trucks
        </h1>
        <p className="hero-subtitle">
          Get instant valuations, certified inspections, and easy in-house financing — all in one place.
        </p>
        <div className="hero-buttons">
          <a 
            href="#valuation" 
            className="btn btn-primary"
            onClick={(e) => handleNavClick(e, '#valuation')}
          >
            Get Valuation
          </a>
          <Link 
            href="/browse-trucks" 
            className="btn btn-secondary"
          >
            Browse Trucks
          </Link>
        </div>
      </div>
    </section>
  )
}
