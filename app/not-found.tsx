'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem'
        }}>404</h1>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '1rem'
        }}>Page Not Found</h2>
        <p style={{
          fontSize: '1.125rem',
          color: '#6b7280',
          marginBottom: '2rem',
          maxWidth: '500px'
        }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link 
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
        >
          Go Back Home
        </Link>
      </div>
      <Footer />
    </>
  )
}

