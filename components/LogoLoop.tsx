'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface Logo {
  src?: string
  alt?: string
  href?: string
  node?: React.ReactNode
  title?: string
}

interface LogoLoopProps {
  logos: Logo[]
  speed?: number
  direction?: 'left' | 'right'
  logoHeight?: number
  gap?: number
  pauseOnHover?: boolean
  scaleOnHover?: boolean
  fadeOut?: boolean
  fadeOutColor?: string
  ariaLabel?: string
}

export default function LogoLoop({
  logos,
  speed = 120,
  direction = 'left',
  logoHeight = 48,
  gap = 40,
  pauseOnHover = true,
  scaleOnHover = true,
  fadeOut = true,
  fadeOutColor = '#ffffff',
  ariaLabel = 'Partner logos',
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Quadruple the logos for extra seamless loop
  const duplicatedLogos = [...logos, ...logos, ...logos, ...logos]

  return (
    <div
      ref={containerRef}
      className="logo-loop-container"
      aria-label={ariaLabel}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: `${logoHeight + 40}px`,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {fadeOut && (
        <>
          <div
            className="logo-loop-fade-left"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '100px',
              background: `linear-gradient(to right, ${fadeOutColor}, transparent)`,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
          <div
            className="logo-loop-fade-right"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '100px',
              background: `linear-gradient(to left, ${fadeOutColor}, transparent)`,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
      
      <div
        className={`logo-loop-track ${isPaused ? 'paused' : ''} ${direction === 'left' ? 'animate-left' : 'animate-right'}`}
        style={{
          display: 'flex',
          gap: `${gap}px`,
          animationDuration: `${speed}s`,
          alignItems: 'center',
        }}
      >
        {duplicatedLogos.map((logo, index) => (
          <div
            key={index}
            className={`logo-loop-item ${scaleOnHover ? 'scale-on-hover' : ''}`}
            style={{
              height: `${logoHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              minWidth: `${logoHeight * 3}px`,
            }}
          >
            {logo.href ? (
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                }}
              >
                {logo.src ? (
                  <Image
                    src={logo.src}
                    alt={logo.alt || 'Logo'}
                    height={logoHeight}
                    width={logoHeight * 3}
                    style={{ 
                      height: `${logoHeight}px`, 
                      width: 'auto', 
                      maxWidth: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{ 
                    fontSize: `${logoHeight * 0.5}px`, 
                    fontWeight: 700,
                    color: '#1e293b',
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}>
                    {logo.node}
                  </div>
                )}
              </a>
            ) : (
              <>
                {logo.src ? (
                  <Image
                    src={logo.src}
                    alt={logo.alt || 'Logo'}
                    height={logoHeight}
                    width={logoHeight * 3}
                    style={{ 
                      height: `${logoHeight}px`, 
                      width: 'auto', 
                      maxWidth: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{ 
                    fontSize: `${logoHeight * 0.5}px`, 
                    fontWeight: 700,
                    color: '#1e293b',
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}>
                    {logo.node}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .logo-loop-track {
          display: flex;
          will-change: transform;
          align-items: center;
        }

        .animate-left {
          animation: scroll-left linear infinite;
        }

        .animate-right {
          animation: scroll-right linear infinite;
        }

        .logo-loop-track.paused {
          animation-play-state: paused;
        }

        .scale-on-hover {
          transition: transform 0.3s ease;
        }

        .scale-on-hover:hover {
          transform: scale(1.15);
        }

        @keyframes scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% / 4));
          }
        }

        @keyframes scroll-right {
          from {
            transform: translateX(calc(-100% / 4));
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
