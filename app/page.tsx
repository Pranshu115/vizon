import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import TrustBar from '@/components/TrustBar'
import CertifiedTrucks from '@/components/CertifiedTrucks'
import AboutUs from '@/components/AboutUs'
import ContactUs from '@/components/ContactUs'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <TrustBar />
      <CertifiedTrucks />
      <AboutUs />
      <ContactUs />
      <FinalCTA />
      <Footer />
    </>
  )
}
