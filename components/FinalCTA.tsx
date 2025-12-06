'use client'

import React from 'react'
import TextType from './TextType'

export default function FinalCTA() {
  const handleSellTruck = () => {
    // Navigate to sell truck page or open modal
    window.location.href = '#contact'
  }

  const handleSpeakExpert = () => {
    // Navigate to contact or open chat
    window.location.href = 'tel:+919140347733'
  }

  return (
    <section className="final-cta-section">
      <div className="final-cta-container">
        <div className="final-cta-content">
          <h2 className="final-cta-headline">
            <TextType 
              text={[
                "Ready to Experience the Axlerator Difference?",
                "Find Your Perfect Commercial Vehicle Today",
                "Join Hundreds of Satisfied Business Owners"
              ]}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor={true}
              cursorCharacter="|"
            />
          </h2>
          <p className="final-cta-subheadline">
            Join hundreds of satisfied business owners who have found their perfect asset with us.
          </p>
          <div className="final-cta-buttons">
            <button 
              className="final-cta-primary-btn"
              onClick={handleSellTruck}
            >
              Sell Your Truck Today
            </button>
            <button 
              className="final-cta-secondary-btn"
              onClick={handleSpeakExpert}
            >
              Speak to Our Expert
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
