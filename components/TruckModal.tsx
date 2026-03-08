'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface TruckModalProps {
  truck: any
  isOpen: boolean
  onClose: () => void
}

export default function TruckModal({ truck, isOpen, onClose }: TruckModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loanAmount, setLoanAmount] = useState(3000000)
  const [downPayment, setDownPayment] = useState(0)
  const [tenure, setTenure] = useState(60)
  const [emi, setEmi] = useState(0)
  const [totalInterest, setTotalInterest] = useState(0)
  const interestRate = 10.5 // Fixed interest rate

  const calculateEMI = useCallback(() => {
    const principal = loanAmount - downPayment
    const ratePerMonth = interestRate / 12 / 100
    const numberOfMonths = tenure

    if (principal <= 0) {
      setEmi(0)
      setTotalInterest(0)
      return
    }

    if (ratePerMonth === 0) {
      setEmi(principal / numberOfMonths)
      setTotalInterest(0)
    } else {
      const emiValue =
        (principal * ratePerMonth * Math.pow(1 + ratePerMonth, numberOfMonths)) /
        (Math.pow(1 + ratePerMonth, numberOfMonths) - 1)
      setEmi(emiValue)
      setTotalInterest((emiValue * numberOfMonths) - principal)
    }
  }, [loanAmount, downPayment, tenure])

  // Auto-calculate EMI whenever loan amount, down payment, or tenure changes
  useEffect(() => {
    calculateEMI()
  }, [calculateEMI])

  if (!isOpen) return null

  const formatPrice = (price: string | undefined | null) => {
    if (!price) return '₹ 0'
    const num = parseFloat(price)
    if (isNaN(num)) return '₹ 0'
    return `₹ ${num.toLocaleString('en-IN')}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-content">
          {/* Left Side - Image and Tabs */}
          <div className="modal-left">
            <div className="modal-image">
              <Image
                src={truck.imageUrl}
                alt={truck.name}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            </div>

            <div className="modal-tabs">
              <button
                className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`modal-tab ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                Features
              </button>
              <button
                className={`modal-tab ${activeTab === 'emi' ? 'active' : ''}`}
                onClick={() => setActiveTab('emi')}
              >
                EMI Calculator
              </button>
              <button
                className={`modal-tab ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                Reports
              </button>
              <button
                className={`modal-tab ${activeTab === 'addons' ? 'active' : ''}`}
                onClick={() => setActiveTab('addons')}
              >
                Add-ons
              </button>
            </div>

            <div className="modal-tab-content">
              {activeTab === 'overview' && (
                <div className="tab-overview">
                  <h3>Truck Overview</h3>
                  <div className="overview-grid">
                    <div className="overview-item">
                      <span className="overview-label">Manufacturer</span>
                      <span className="overview-value">{truck.manufacturer}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Model</span>
                      <span className="overview-value">{truck.model}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Year</span>
                      <span className="overview-value">{truck.year}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Kilometers</span>
                      <span className="overview-value">{truck.kilometers?.toLocaleString() || '0'} kms</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Horsepower</span>
                      <span className="overview-value">{truck.horsepower} HP</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Transmission</span>
                      <span className="overview-value">Manual</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Fuel Type</span>
                      <span className="overview-value">Diesel</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Ownership</span>
                      <span className="overview-value">1st Owner</span>
                    </div>
                  </div>
                  <p className="overview-description">{truck.subtitle}</p>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="tab-features">
                  <h3>Key Features</h3>
                  <ul className="features-list">
                    <li>✓ Axlerator Certified Quality Check</li>
                    <li>✓ 200-Point Inspection Completed</li>
                    <li>✓ Well Maintained Service History</li>
                    <li>✓ Original Parts & Accessories</li>
                    <li>✓ No Accident History</li>
                    <li>✓ Clear Documentation</li>
                    <li>✓ Power Steering</li>
                    <li>✓ Air Conditioning</li>
                    <li>✓ ABS Brakes</li>
                    <li>✓ Airbags</li>
                  </ul>
                </div>
              )}

              {activeTab === 'emi' && (
                <div className="tab-emi">
                  <h3>EMI Calculator</h3>
                  <div className="emi-calculator-new">
                    {/* Sliders Section */}
                    <div className="emi-right">
                      <div className="emi-slider-group">
                        <div className="slider-header">
                          <label>Loan Amount</label>
                          <span className="slider-value">₹ {loanAmount.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="100000"
                          max="10000000"
                          step="50000"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                          className="emi-slider-purple"
                        />
                        <div className="slider-labels">
                          <span>₹ 1 Lakh</span>
                          <span>₹ 1 Crore</span>
                        </div>
                      </div>

                      <div className="emi-slider-group">
                        <div className="slider-header">
                          <label>Down Payment</label>
                          <span className="slider-value">₹ {downPayment.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={loanAmount * 0.5}
                          step="10000"
                          value={downPayment}
                          onChange={(e) => setDownPayment(parseInt(e.target.value))}
                          className="emi-slider-purple"
                        />
                        <div className="slider-labels">
                          <span>₹ 0</span>
                          <span>₹ {(loanAmount * 0.5).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="emi-slider-group">
                        <div className="slider-header">
                          <label>Loan Duration</label>
                          <span className="slider-value">{tenure} Months</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="84"
                          step="12"
                          value={tenure}
                          onChange={(e) => setTenure(parseInt(e.target.value))}
                          className="emi-slider-purple"
                        />
                        <div className="slider-labels">
                          <span>1 Year</span>
                          <span>7 Years</span>
                        </div>
                      </div>
                    </div>

                    {/* EMI Result Section */}
                    <div className="emi-left">
                      <p className="emi-label">Your Monthly EMI</p>
                      <h2 className="emi-amount">₹{Math.round(emi).toLocaleString()}</h2>
                      <span className="emi-period">per month</span>

                      {/* Donut Chart */}
                      <div className="emi-chart">
                        <svg viewBox="0 0 200 200" className="donut-svg">
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="#d1fae5"
                            strokeWidth="35"
                          />
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="35"
                            strokeDasharray={`${(totalInterest / ((loanAmount - downPayment) + totalInterest)) * 502.4} 502.4`}
                            strokeDashoffset="125.6"
                            transform="rotate(-90 100 100)"
                          />
                        </svg>
                      </div>

                      {/* Breakdown */}
                      <div className="emi-breakdown">
                        <div className="breakdown-item">
                          <span className="breakdown-label">
                            <span className="breakdown-color principal"></span>
                            Principal Amount
                          </span>
                          <span className="breakdown-value">₹{(loanAmount - downPayment).toLocaleString()}</span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">
                            <span className="breakdown-color interest"></span>
                            Total Interest
                          </span>
                          <span className="breakdown-value">₹{Math.round(totalInterest).toLocaleString()}</span>
                        </div>
                        <div className="breakdown-item total">
                          <span className="breakdown-label">
                            <span className="breakdown-icon">💰</span>
                            Total Payable
                          </span>
                          <span className="breakdown-value">₹{Math.round((loanAmount - downPayment) + totalInterest).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA and Disclaimer - moved inside emi-left */}
                    <button className="emi-cta-btn" style={{ marginTop: '1.5rem' }}>
                      <span className="btn-icon">📞</span>
                      Get Loan Quote
                    </button>

                    <p className="emi-disclaimer" style={{ marginTop: '1rem' }}>
                      *Interest rate: {interestRate}% per annum. Processing fee and other charges not included.
                      <br /><br />
                      <strong>Note:</strong> Loan approval and rates depend on credit profile and lender policies.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="tab-reports">
                  <h3>Inspection Reports</h3>
                  <div className="reports-list">
                    <div className="report-item">
                      <span className="report-icon">📄</span>
                      <div className="report-info">
                        <h4>Vehicle Inspection Report</h4>
                        <p>Comprehensive 200-point inspection</p>
                      </div>
                      <button className="report-download">Download</button>
                    </div>
                    <div className="report-item">
                      <span className="report-icon">📊</span>
                      <div className="report-info">
                        <h4>Service History</h4>
                        <p>Complete maintenance records</p>
                      </div>
                      <button className="report-download">Download</button>
                    </div>
                    <div className="report-item">
                      <span className="report-icon">📋</span>
                      <div className="report-info">
                        <h4>Ownership Documents</h4>
                        <p>Verified legal documents</p>
                      </div>
                      <button className="report-download">Download</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'addons' && (
                <div className="tab-addons">
                  <h3>Available Add-ons</h3>
                  <div className="addons-list">
                    <div className="addon-item">
                      <input type="checkbox" id="warranty" />
                      <label htmlFor="warranty">
                        <strong>Extended Warranty</strong>
                        <p>2 years comprehensive coverage - ₹ 25,000</p>
                      </label>
                    </div>
                    <div className="addon-item">
                      <input type="checkbox" id="insurance" />
                      <label htmlFor="insurance">
                        <strong>Insurance Package</strong>
                        <p>Comprehensive insurance - ₹ 35,000/year</p>
                      </label>
                    </div>
                    <div className="addon-item">
                      <input type="checkbox" id="accessories" />
                      <label htmlFor="accessories">
                        <strong>Accessory Package</strong>
                        <p>Floor mats, seat covers, GPS - ₹ 15,000</p>
                      </label>
                    </div>
                    <div className="addon-item">
                      <input type="checkbox" id="maintenance" />
                      <label htmlFor="maintenance">
                        <strong>Maintenance Package</strong>
                        <p>Free services for 1 year - ₹ 20,000</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Truck Info and CTAs */}
          <div className="modal-right">
            <div className="modal-truck-info">
              <h2 className="modal-truck-name">{truck.name}</h2>
              <p className="modal-truck-subtitle">{truck.year} {truck.manufacturer} {truck.model}</p>

              <div className="modal-truck-specs">
                <span>{truck.kilometers?.toLocaleString() || '0'} kms</span>
                <span>•</span>
                <span>Diesel</span>
                <span>•</span>
                <span>Manual</span>
                <span>•</span>
                <span>1st Owner</span>
              </div>

              <div className="modal-price-section">
                <span className="modal-price-label">Price</span>
                <h3 className="modal-price">{formatPrice(truck.price)}</h3>
              </div>

              <div className="modal-cta-buttons">
                <button className="modal-cta-primary">Book Now</button>
                <button className="modal-cta-secondary">View Seller Details</button>
              </div>

              <div className="modal-contact-seller">
                <h4>Contact Seller</h4>
                <div className="contact-input-group">
                  <input type="text" placeholder="Your Name" />
                </div>
                <div className="contact-input-group">
                  <input type="email" placeholder="Your Email" />
                </div>
                <div className="contact-input-group">
                  <input type="tel" placeholder="Your Phone" />
                </div>
                <div className="contact-input-group">
                  <textarea placeholder="Message (optional)" rows={3}></textarea>
                </div>
                <button className="contact-submit-btn">Send Inquiry</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
