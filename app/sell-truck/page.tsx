'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Stepper, { Step, StepperRef } from '@/components/Stepper'
import CustomSelect from '@/components/CustomSelect'

type SellFormState = {
  brand: string
  model: string
  transmission: string
  fuelType: string
  kilometers: string
  rtoState: string
  ownerCount: string
  nationalPermit: string
  loanStatus: string
  insuranceStatus: string
  rcStatus: string
  sellTimeline: string
  description: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  userState: string
}

type PhotoPreview = {
  file: File
  preview: string
  supabaseUrl?: string // Supabase Storage URL after upload
  uploading?: boolean // Upload status
  uploadError?: string // Upload error message
}

const LEGACY_ESTIMATOR_ENABLED = true
const MAX_TRUCK_PHOTOS = 8
const STEPPER_TOTAL_STEPS = 12

const stepperFieldMappings: Partial<Record<string, keyof SellFormState>> = {
  brand: 'brand',
  model: 'model',
  rtoLocation: 'rtoState',
  owner: 'ownerCount',
  kmDriven: 'kilometers'
}

const createInitialSellFormState = (): SellFormState => ({
  brand: '',
  model: '',
  transmission: '',
  fuelType: '',
  kilometers: '',
  rtoState: '',
  ownerCount: '',
  nationalPermit: '',
  loanStatus: '',
  insuranceStatus: '',
  rcStatus: '',
  sellTimeline: '',
  description: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  userState: '',
})

const createInitialStepperData = () => ({
    brand: '',
    model: '',
    variant: '',
    year: '',
    rtoLocation: '',
    owner: '',
    kmDriven: ''
  })

export default function SellTruckPage() {
  const router = useRouter()
  const stepperRef = useRef<StepperRef>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(createInitialStepperData())
  const [sellForm, setSellForm] = useState<SellFormState>(createInitialSellFormState())
  const [sellFormError, setSellFormError] = useState('')
  const [sellFormStatus, setSellFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([])
  const [stepperInstanceKey, setStepperInstanceKey] = useState(0)
  const [phoneError, setPhoneError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Variant → default fuel & transmission mapping (primarily for TATA Motors)
  const variantAttributes: Record<string, { fuel: string; transmission: string }> = {
    // Generic variants
    'Diesel': { fuel: 'Diesel', transmission: 'manual' },
    'Petrol': { fuel: 'Petrol', transmission: 'manual' },
    'CNG': { fuel: 'CNG', transmission: 'manual' },
    'CNG Plus': { fuel: 'CNG', transmission: 'manual' },
    'Electric': { fuel: 'Electric', transmission: 'manual' },
    // Tata‑specific variant labels
    'EV 1000': { fuel: 'Electric', transmission: 'manual' },
    'V10 Diesel': { fuel: 'Diesel', transmission: 'manual' },
    'V20 Gold': { fuel: 'Diesel', transmission: 'manual' },
    'V30 Smart': { fuel: 'Diesel', transmission: 'manual' },
    'V50 Smart': { fuel: 'Diesel', transmission: 'manual' },
    'V70 Hydro': { fuel: 'Diesel', transmission: 'manual' },
    'T.6 Diesel': { fuel: 'Diesel', transmission: 'manual' },
    'T.7 Diesel': { fuel: 'Diesel', transmission: 'manual' },
    'T.7 Electric': { fuel: 'Electric', transmission: 'manual' },
    'T.9 Diesel': { fuel: 'Diesel', transmission: 'manual' },
    'T.12 Diesel': { fuel: 'Diesel', transmission: 'manual' },
    'T.16 Sleeper': { fuel: 'Diesel', transmission: 'manual' },
    'T.19': { fuel: 'Diesel', transmission: 'manual' },
    'Diesel/CNG': { fuel: 'Diesel', transmission: 'manual' },
    'Diesel/LNG': { fuel: 'Diesel', transmission: 'manual' },
    'Diesel/CNG/Electric': { fuel: 'Diesel', transmission: 'manual' },
    'Diesel/CNG/LNG': { fuel: 'Diesel', transmission: 'manual' },
    'Hydrogen ICE': { fuel: 'Diesel', transmission: 'manual' }, // closest available option
    // Eicher-specific variant labels
    'King': { fuel: 'Diesel', transmission: 'manual' },
    'Extra Power': { fuel: 'Diesel', transmission: 'manual' },
    'Plus': { fuel: 'Diesel', transmission: 'manual' },
    '7-Speed': { fuel: 'Diesel', transmission: 'manual' },
    'Mileage King': { fuel: 'Diesel', transmission: 'manual' },
    'High Power': { fuel: 'Diesel', transmission: 'manual' },
    '4x2': { fuel: 'Diesel', transmission: 'manual' },
    '6x2': { fuel: 'Diesel', transmission: 'manual' },
    'Tipper': { fuel: 'Diesel', transmission: 'manual' },
    'Transit Mixer': { fuel: 'Diesel', transmission: 'manual' },
    '8x2': { fuel: 'Diesel', transmission: 'manual' },
    '4x2 Tractor': { fuel: 'Diesel', transmission: 'manual' }, // Eicher default, Volvo overrides to automatic
    '10x2': { fuel: 'Diesel', transmission: 'manual' },
    'Haulage': { fuel: 'Diesel', transmission: 'manual' },
    '16-Wheeler': { fuel: 'Diesel', transmission: 'manual' },
    '16-Wheeler XP': { fuel: 'Diesel', transmission: 'manual' },
    '6x4 Tractor': { fuel: 'Diesel', transmission: 'manual' }, // Eicher default, Volvo overrides to automatic
    '6x4 Tractor XP': { fuel: 'Diesel', transmission: 'manual' },
    'LNG': { fuel: 'Diesel', transmission: 'manual' }, // closest available option
    'Mining Tipper': { fuel: 'Diesel', transmission: 'manual' },
    'Construction Tipper': { fuel: 'Diesel', transmission: 'manual' },
    'Mining AMT': { fuel: 'Diesel', transmission: 'amt' },
    'Tractor': { fuel: 'Diesel', transmission: 'manual' },
    // Bharat Benz-specific variant labels
    'Cabin Chassis': { fuel: 'Diesel', transmission: 'manual' },
    'Rigid': { fuel: 'Diesel', transmission: 'manual' },
    'Re-engineered': { fuel: 'Diesel', transmission: 'manual' },
    'Construction': { fuel: 'Diesel', transmission: 'manual' },
    '8x2 High Power': { fuel: 'Diesel', transmission: 'manual' },
    'Tanker': { fuel: 'Diesel', transmission: 'manual' },
    '6x4 High Power': { fuel: 'Diesel', transmission: 'manual' },
    'Mining': { fuel: 'Diesel', transmission: 'manual' },
    'Premium Mining Manual': { fuel: 'Diesel', transmission: 'manual' },
    'Premium Mining AMT': { fuel: 'Diesel', transmission: 'amt' },
    'Tip Trailer': { fuel: 'Diesel', transmission: 'manual' },
    // SML Isuzu-specific variant labels
    '2515/Low Side Deck': { fuel: 'Diesel', transmission: 'manual' },
    '2815/Cab Chassis': { fuel: 'CNG', transmission: 'manual' },
    '3335/Fixed Deck': { fuel: 'Diesel', transmission: 'manual' },
    '3335/LSD': { fuel: 'CNG', transmission: 'manual' },
    '3335/High Deck': { fuel: 'Diesel', transmission: 'manual' },
    '4240/High Deck': { fuel: 'Diesel', transmission: 'manual' },
    '4760/High Deck': { fuel: 'Diesel', transmission: 'manual' },
    '2815/Fixed Deck': { fuel: 'Diesel', transmission: 'manual' },
    '4760/HSD/CNG': { fuel: 'CNG', transmission: 'manual' },
    '2815/Low Side Deck': { fuel: 'Diesel', transmission: 'manual' },
    '2815/High Side Deck': { fuel: 'Diesel', transmission: 'manual' },
    '4760/SMHD/CNG': { fuel: 'Diesel', transmission: 'manual' },
    'Cab Chassis': { fuel: 'CNG', transmission: 'manual' },
    // Force Motors-specific variant labels
    'Hi-Deck': { fuel: 'Diesel', transmission: 'manual' },
    'CNG Version': { fuel: 'CNG', transmission: 'manual' },
    'Deck 2990': { fuel: 'Diesel', transmission: 'manual' },
    'Chassis 3100': { fuel: 'Diesel', transmission: 'manual' },
    '2770/HSD': { fuel: 'Diesel', transmission: 'manual' },
    '2770/FSD': { fuel: 'Diesel', transmission: 'manual' },
    'Diesel Deck': { fuel: 'Diesel', transmission: 'manual' },
    'Diesel Chassis': { fuel: 'Diesel', transmission: 'manual' },
    'Short WB': { fuel: 'Diesel', transmission: 'manual' },
    'Medium WB': { fuel: 'Diesel', transmission: 'manual' },
    'Long WB': { fuel: 'Diesel', transmission: 'manual' },
    'Super Long': { fuel: 'Diesel', transmission: 'manual' },
    '9-Seater': { fuel: 'Diesel', transmission: 'manual' },
    '2-Seater': { fuel: 'Diesel', transmission: 'manual' },
    '5-Seater': { fuel: 'Diesel', transmission: 'manual' },
    'Custom': { fuel: 'Diesel', transmission: 'manual' },
    'Premium': { fuel: 'Diesel', transmission: 'manual' },
    // Volvo Trucks-specific variant labels (note: 4x2 Tractor and 6x4 Tractor are shared with Eicher, handled in code)
    '8x4 Tipper': { fuel: 'Diesel', transmission: 'automatic' },
    '8x4 23 Cu.m': { fuel: 'Diesel', transmission: 'automatic' },
    '4x2 LNG Tractor': { fuel: 'Diesel', transmission: 'automatic' }, // LNG mapped to Diesel as closest option
    '6x4 Puller': { fuel: 'Diesel', transmission: 'automatic' },
    'Rock Body 19.5': { fuel: 'Diesel', transmission: 'automatic' },
    'Box Body 20.3': { fuel: 'Diesel', transmission: 'automatic' },
    'Coal Body 33': { fuel: 'Diesel', transmission: 'automatic' },
    '8x4 Dump': { fuel: 'Diesel', transmission: 'automatic' },
    'Off-Road Dump': { fuel: 'Diesel', transmission: 'automatic' },
    '8x4 Heavy Duty': { fuel: 'Diesel', transmission: 'automatic' },
    '6x4 ODC Puller': { fuel: 'Diesel', transmission: 'manual' },
    'Import Model': { fuel: 'Diesel', transmission: 'manual' },
    // Maruti Suzuki-specific variant labels (fuel type determined by model name in code)
    'Deck': { fuel: 'Petrol', transmission: 'manual' }, // Fuel overridden based on model (Petrol/CNG)
    'Std': { fuel: 'Petrol', transmission: 'manual' }, // Fuel overridden based on model (Petrol/CNG)
    'AC': { fuel: 'Petrol', transmission: 'manual' }, // Fuel overridden based on model (Petrol/CNG)
    // Note: 'Cab Chassis' already defined for SML Isuzu, fuel type handled in code for Maruti
    // Toyota Kirloskar-specific variant labels
    '4x4 Manual': { fuel: 'Diesel', transmission: 'manual' },
    '4x4 Automatic': { fuel: 'Diesel', transmission: 'automatic' },
    'Standard 4x2': { fuel: 'Diesel', transmission: 'manual' }
  }

  // Model-specific variant mapping for brands that need it (e.g., Maruti Suzuki)
  const modelVariantMap: { [key: string]: string[] } = {
    // Maruti Suzuki model-specific variants
    'Super Carry Petrol': ['Deck', 'Cab Chassis'],
    'Super Carry CNG': ['Deck', 'Cab Chassis'],
    'Eeco Cargo Petrol': ['Std', 'AC'],
    'Eeco Cargo S-CNG': ['Std', 'AC']
  }

  // Brand options with their models – updated to requested OEM list
  const truckData: { [key: string]: { models: string[]; variants: string[] } } = {
    'TATA Motors': {
      // Models from the Tata table
      models: [
        'Ace Gold',
        'Ace Gold CNG',
        'Ace Gold CNG Plus',
        'Ace HT+',
        'Ace EV',
        'Intra V10',
        'Intra V20',
        'Intra V30',
        'Intra V50',
        'Intra V70',
        'Yodha 1200',
        'Yodha 1500',
        'Yodha 1700',
        'Yodha 4x4',
        'Yodha Crew Cab',
        '407 Gold SFC',
        'Ultra T.6',
        'Ultra T.7',
        'Ultra T.9',
        'Ultra T.12',
        'Ultra T.16',
        'Ultra T.19',
        'LPT 709',
        'LPT 710',
        'LPT 712',
        'Signa 1918.T',
        'Signa 1923.K',
        'Signa 2818.T',
        'Signa 2821.T',
        'Signa 2823.K',
        'Signa 3518.T',
        'Signa 3525.K',
        'Signa 4018.S',
        'Signa 4225.T',
        'Signa 4825.T',
        'Signa 4825.TK',
        'Signa 5525.S',
        'Signa 5530.S',
        'Prima 2830.K',
        'Prima 3530.K',
        'Prima 5530.S',
        'Prima H.55S'
      ],
      // Variants / trims (combined from the table)
      variants: [
        'Diesel',
        'Petrol',
        'CNG',
        'CNG Plus',
        'EV 1000',
        'V10 Diesel',
        'V20 Gold',
        'V30 Smart',
        'V50 Smart',
        'V70 Hydro',
        '1200',
        '1500',
        '1700',
        '4x4',
        'Crew Cab',
        '29 WB',
        '33 WB',
        'T.6 Diesel',
        'T.7 Diesel',
        'T.7 Electric',
        'T.9 Diesel',
        'T.12 Diesel',
        'T.16 Sleeper',
        'T.19',
        '709g',
        '710',
        '712',
        '1918.T Cab',
        '1923.K Tipper',
        '2818.T',
        '2821.T',
        '2823.K Tipper',
        '3518.T',
        '3525.K Tipper',
        '4018.S Tractor',
        '4225.T',
        '4825.T',
        '4825.TK Tipper',
        '5525.S 4x2',
        '5530.S 6x4',
        '2830.K',
        '3530.K',
        '5530.S',
        'H.55S'
      ]
    },
    'Mahindra Trucks': {
      // From the Mahindra table (Model column)
      models: [
        'Jeeto Strong',
        'Jeeto Plus',
        'Jeeto Plus CNG',
        'Supro Profit Mini',
        'Supro Profit Maxi',
        'Supro Excel',
        'Bolero ExtraLong',
        'Bolero ExtraStrong',
        'Bolero Camper',
        'MaXX City',
        'MaXX HD',
        'Veero',
        'Jayo',
        'Loadking Optimo',
        'Furio 7',
        'Furio 11',
        'Furio 12',
        'Furio 14',
        'Furio 16',
        'Furio 17',
        'Blazo X Haulage',
        'Blazo X Tipper',
        'Blazo X Tractor'
      ],
      // Mahindra variants (Variant column)
      variants: [
        'Diesel',
        'CNG',
        'Petrol',
        'CNG 400',
        'Mini LX',
        'Mini VX',
        'Mini CNG Duo',
        'Maxi LX',
        'Maxi VX/ZX',
        'Excel Diesel',
        'Excel CNG Duo',
        '1.25T',
        '1.7T',
        '1.3T',
        '1.5T',
        '4x4',
        'Camper Gold',
        'Camper ZX',
        'Camper 4WD',
        'City 1.3',
        'City 1.4/1.5',
        'HD 1.3',
        'HD 1.7',
        'HD 2.0L',
        'V2/V4/V6',
        'BS6',
        'Optimo Tipper',
        'Optimo Cargo',
        'Furio 7 Cargo',
        'Furio 7 Tipper',
        '11T GVW',
        '12T GVW',
        '14T GVW',
        '16T GVW',
        '17T GVW',
        'Blazo X 28',
        'Blazo X 35',
        'Blazo X 42',
        'Blazo X 49',
        'Blazo X 28 Tipper',
        'Blazo X 35 Tipper',
        'Blazo X 40',
        'Blazo X 46',
        'Blazo X 55'
      ]
    },
    'Ashok Leyland': {
      // From the Ashok Leyland table (Model column)
      models: [
        'Dost LiTE',
        'Dost Strong',
        'Dost+',
        'Dost CNG',
        'Bada Dost i1',
        'Bada Dost i2',
        'Bada Dost i3',
        'Bada Dost i3+',
        'Bada Dost i4',
        'Bada Dost i5',
        'Partner 4 Tyre',
        'Partner 6 Tyre',
        'Partner Super',
        'IeV Series',
        'Ecomet Star 1015',
        'Ecomet Star 1115',
        'Ecomet Star 1215',
        'Ecomet Star 1415',
        'Ecomet Star 1615',
        'Ecomet Star 1815',
        'Ecomet Star 1815+',
        'Ecomet Star 1915',
        'Boss 1115',
        'Boss 1215',
        'Boss 1315',
        'Boss 1415',
        'Boss 1615',
        'Boss 1920',
        'Boss EV',
        'AVTR 1920',
        'AVTR 1922',
        'AVTR 2620',
        'AVTR 2622',
        'AVTR 2820',
        'AVTR 2825',
        'AVTR 3120',
        'AVTR 3125',
        'AVTR 3520',
        'AVTR 3525',
        'AVTR 3532',
        'AVTR 4020',
        'AVTR 4120',
        'AVTR 4220',
        'AVTR 4225',
        'AVTR 4420',
        'AVTR 4825',
        'AVTR 5525',
        'Captain 2832',
        'Captain 3532'
      ],
      // Ashok Leyland variants (Variant column)
      variants: [
        'LiTE',
        'Strong',
        'LE',
        'LS',
        'LX',
        'CNG',
        'i1 LS/LX',
        'i2 LS/LX',
        'i3',
        'i3+ Plus',
        'i4 LS/LX',
        'i5',
        '14ft HSD',
        '14ft FSD',
        '10ft Deck',
        '14ft Deck',
        '17ft Deck',
        '914',
        '1014',
        '1114',
        'IeV3',
        'IeV4',
        '1015 HE',
        '1115 HE',
        '1215 HE',
        '1415 HE',
        '1615 HE',
        '1815 HE',
        '1815+',
        '1915 HE',
        '1115 HB',
        '1215 HB',
        '1315 HB',
        '1415 HB',
        '1615 HB',
        '1920',
        'Boss 1218 HB EV',
        '1920 Haulage',
        '1922 Haulage',
        '2620 Lift Axle',
        '2622 Lift Axle',
        '2820 Tipper',
        '2825 Tipper',
        '2820 RMC',
        '2825 RMC',
        '3120 DTLA',
        '3125 DTLA',
        '3520 Twin Steer',
        '3525 Twin Steer',
        '3532 Tipper',
        '3520 RMC',
        '3525 RMC',
        '4020 Tractor',
        '4120 Haulage',
        '4220 Haulage',
        '4225 Haulage',
        '4420 Tractor',
        '4825 Haulage',
        '4825 Tipper',
        '5525 Tractor',
        '2832 Tipper',
        '3532 Tipper'
      ]
    },
    'Eicher Motors': {
      models: [
        'Pro 2049',
        'Pro 2049 CNG',
        'Pro 2050',
        'Pro 2055',
        'Pro 2055K',
        'Pro 2055 EV',
        'Pro 2059',
        'Pro 2059 CNG',
        'Pro 2059XP',
        'Pro 2075',
        'Pro 2075 CNG',
        'Pro 2080XP',
        'Pro 2080XPT',
        'Pro 2095XP',
        'Pro 2095XP Plus',
        'Pro 2110',
        'Pro 2110XP',
        'Pro 2110 7S',
        'Pro 2114XP',
        'Pro 3012',
        'Pro 3014',
        'Pro 3015',
        'Pro 3015 CNG',
        'Pro 3015XP',
        'Pro 3018',
        'Pro 3018 Plus',
        'Pro 3019',
        'Pro 6019',
        'Pro 6028',
        'Pro 6028T',
        'Pro 6028TM',
        'Pro 6035',
        'Pro 6035T',
        'Pro 6040',
        'Pro 6041',
        'Pro 6042',
        'Pro 6048',
        'Pro 6048XP',
        'Pro 6055',
        'Pro 6055XP',
        'Pro 6055 FL',
        'Pro 8028XM',
        'Pro 8028XC',
        'Pro 8035XM',
        'Pro 8035XM AMT',
        'Pro 8055',
        'Pro X'
      ],
      variants: [
        'Diesel',
        'CNG',
        'King',
        'Electric',
        'Extra Power',
        'Tipper',
        'Plus',
        '7-Speed',
        'Mileage King',
        'High Power',
        '4x2',
        '6x2',
        'Transit Mixer',
        '8x2',
        '4x2 Tractor',
        '10x2',
        'Haulage',
        '16-Wheeler',
        '16-Wheeler XP',
        '6x4 Tractor',
        '6x4 Tractor XP',
        'LNG',
        'Mining Tipper',
        'Construction Tipper',
        'Mining AMT',
        'Tractor'
      ]
    },
    'Bharat Benz': {
      models: [
        '1015R',
        '1015R+',
        '1215R',
        '1215RE',
        '1415R',
        '1415RE',
        '1617R',
        '1917R',
        '1217C',
        '2823R',
        '3523R',
        '3528R',
        '4228R',
        '4228R Tanker',
        '4828R',
        '1923C',
        '2823C',
        '3528C',
        '4023T',
        '5028T',
        '3528CM',
        '3532CM',
        '3532CM AMT',
        '5528T',
        '5528TT',
        '5532T'
      ],
      variants: [
        'Cabin Chassis',
        'Plus',
        'Rigid',
        'Re-engineered',
        'Construction',
        '6x2',
        '8x2',
        '8x2 High Power',
        '10x2',
        '12x2',
        'Tanker',
        '4x2',
        '6x4',
        '8x4',
        '6x4 High Power',
        'Mining',
        'Premium Mining Manual',
        'Premium Mining AMT',
        'Tip Trailer'
      ]
    },
    'SML Isuzu': {
      models: [
        'Sartaj GS 5252',
        'Sartaj GS 5252 CNG',
        'Sartaj GS 59',
        'Sartaj GS 59 XM',
        'Sartaj GS HG 72',
        'Sartaj GS HG 75',
        'Sartaj GS HG 75 MS',
        'Prestige GS Diesel',
        'Prestige GS CNG',
        'Samrat GS Diesel',
        'Samrat GS 11.1T',
        'Samrat GS Tipper',
        'Samrat GS 10.7T',
        'Samrat 1312 XT',
        'Samrat XT HS',
        'Supreme GS Diesel',
        'Supreme GS CNG',
        'Super GS Diesel',
        'Super GS Cargo',
        'Metro CNG'
      ],
      variants: [
        '2515/Low Side Deck',
        '2815/Cab Chassis',
        '3335/Fixed Deck',
        '3335/LSD',
        '3335/High Deck',
        '4240/High Deck',
        '4760/High Deck',
        '2815/Fixed Deck',
        '4760/HSD/CNG',
        '2815/Low Side Deck',
        '2815/High Side Deck',
        '4760/SMHD/CNG',
        'Cab Chassis'
      ]
    },
    'Force Motors': {
      models: [
        'Trump 40',
        'Trump 40 CNG',
        'Kargo King Grand',
        'Kargo King Chassis',
        'Shaktiman 200',
        'Shaktiman 400',
        'Traveller 3050',
        'Traveller 3350',
        'Traveller 3700',
        'Traveller 4020',
        'Traveller Wider',
        'Trax DV 3050',
        'Trax DCPU',
        'Urbania Cargo',
        'Urbania Traveller'
      ],
      variants: [
        'Hi-Deck',
        'CNG Version',
        'Deck 2990',
        'Chassis 3100',
        '2770/HSD',
        '2770/FSD',
        'Diesel Deck',
        'Diesel Chassis',
        'Short WB',
        'Medium WB',
        'Long WB',
        'Super Long',
        '9-Seater',
        '2-Seater',
        '5-Seater',
        'Custom',
        'Premium'
      ]
    },
    'Volvo Trucks': {
      models: [
        'FM 380',
        'FM 420',
        'FM 420 LNG',
        'FM 460',
        'FM 500',
        'FM Electric',
        'FMX 460',
        'FMX 440',
        'FMX 500',
        'FMX 540',
        'FMX Electric',
        'FH 520',
        'FH 540',
        'FH 16 750'
      ],
      variants: [
        '8x4 Tipper',
        '6x4 Tractor',
        '4x2 Tractor',
        '8x4 23 Cu.m',
        '4x2 LNG Tractor',
        '6x4 Puller',
        'Rock Body 19.5',
        'Box Body 20.3',
        'Coal Body 33',
        '8x4 Dump',
        'Off-Road Dump',
        '8x4 Heavy Duty',
        '6x4 ODC Puller',
        'Import Model'
      ]
    },
    'Maruti Suzuki': {
      models: [
        'Super Carry Petrol',
        'Super Carry CNG',
        'Eeco Cargo Petrol',
        'Eeco Cargo S-CNG'
      ],
      variants: [
        'Deck',
        'Cab Chassis',
        'Std',
        'AC'
      ]
    },
    'Toyota Kirloskar': {
      models: [
        'Hilux Stand',
        'Hilux High',
        'Hilux Cond',
        'Hilux 4x2'
      ],
      variants: [
        '4x4 Manual',
        '4x4 Automatic',
        'Standard 4x2'
      ]
    }
  }
  const brandOptions = Object.keys(truckData)

  const years = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - i).toString())

  const rtoLocations = [
    // Maharashtra
    'Mumbai (MH-01)', 'Mumbai (MH-02)', 'Mumbai (MH-03)', 'Mumbai (MH-43)', 'Mumbai (MH-47)',
    'Pune (MH-12)', 'Pune (MH-14)', 'Nagpur (MH-31)', 'Nashik (MH-15)', 'Aurangabad (MH-20)',
    'Thane (MH-04)', 'Solapur (MH-13)', 'Kolhapur (MH-09)', 'Sangli (MH-10)', 'Satara (MH-11)',
    'Jalgaon (MH-19)', 'Akola (MH-30)', 'Amravati (MH-27)', 'Latur (MH-24)', 'Nanded (MH-26)',
    'Ratnagiri (MH-08)', 'Dhule (MH-18)', 'Chandrapur (MH-34)', 'Beed (MH-23)', 'Parbhani (MH-22)',
    // Delhi
    'Delhi (DL-01)', 'Delhi (DL-02)', 'Delhi (DL-03)', 'Delhi (DL-04)', 'Delhi (DL-05)',
    'Delhi (DL-06)', 'Delhi (DL-07)', 'Delhi (DL-08)', 'Delhi (DL-09)', 'Delhi (DL-10)',
    'Delhi (DL-11)', 'Delhi (DL-12)', 'Delhi (DL-13)', 'Delhi (DL-14)', 'Delhi (DL-15)',
    // Karnataka
    'Bangalore (KA-01)', 'Bangalore (KA-02)', 'Bangalore (KA-03)', 'Bangalore (KA-04)', 'Bangalore (KA-05)',
    'Bangalore (KA-50)', 'Bangalore (KA-51)', 'Bangalore (KA-52)', 'Bangalore (KA-53)', 'Mysore (KA-09)',
    'Mangalore (KA-19)', 'Hubli (KA-25)', 'Belgaum (KA-22)', 'Gulbarga (KA-29)', 'Davangere (KA-17)',
    'Shimoga (KA-14)', 'Tumkur (KA-06)', 'Raichur (KA-36)', 'Bijapur (KA-28)', 'Bellary (KA-34)',
    // Telangana
    'Hyderabad (TS-09)', 'Hyderabad (TS-07)', 'Hyderabad (TS-08)', 'Hyderabad (TS-10)', 'Hyderabad (TS-11)',
    'Hyderabad (TS-12)', 'Hyderabad (TS-13)', 'Hyderabad (TS-14)', 'Hyderabad (TS-15)', 'Warangal (TS-03)',
    'Nizamabad (TS-16)', 'Karimnagar (TS-02)', 'Khammam (TS-04)', 'Mahbubnagar (TS-06)', 'Nalgonda (TS-05)',
    // Tamil Nadu
    'Chennai (TN-01)', 'Chennai (TN-02)', 'Chennai (TN-03)', 'Chennai (TN-04)', 'Chennai (TN-05)',
    'Chennai (TN-07)', 'Chennai (TN-09)', 'Chennai (TN-10)', 'Chennai (TN-11)', 'Chennai (TN-12)',
    'Coimbatore (TN-37)', 'Madurai (TN-58)', 'Salem (TN-30)', 'Tirunelveli (TN-72)', 'Tiruchirappalli (TN-45)',
    'Erode (TN-33)', 'Vellore (TN-23)', 'Dindigul (TN-57)', 'Thanjavur (TN-49)', 'Tiruppur (TN-39)',
    // West Bengal
    'Kolkata (WB-01)', 'Kolkata (WB-02)', 'Kolkata (WB-03)', 'Kolkata (WB-04)', 'Kolkata (WB-05)',
    'Kolkata (WB-06)', 'Kolkata (WB-07)', 'Kolkata (WB-08)', 'Kolkata (WB-09)', 'Kolkata (WB-10)',
    'Howrah (WB-11)', 'Hooghly (WB-15)', 'Burdwan (WB-37)', 'Asansol (WB-38)', 'Siliguri (WB-73)',
    'Durgapur (WB-39)', 'Kharagpur (WB-33)', 'Barasat (WB-26)', 'Barrackpore (WB-24)', 'Krishnanagar (WB-53)',
    // Gujarat
    'Ahmedabad (GJ-01)', 'Ahmedabad (GJ-27)', 'Surat (GJ-05)', 'Surat (GJ-19)', 'Vadodara (GJ-06)',
    'Rajkot (GJ-03)', 'Bhavnagar (GJ-04)', 'Jamnagar (GJ-10)', 'Gandhinagar (GJ-18)', 'Anand (GJ-23)',
    'Bharuch (GJ-16)', 'Mehsana (GJ-02)', 'Palanpur (GJ-08)', 'Junagadh (GJ-11)', 'Bhuj (GJ-12)',
    // Rajasthan
    'Jaipur (RJ-14)', 'Jaipur (RJ-13)', 'Jaipur (RJ-02)', 'Jodhpur (RJ-19)', 'Kota (RJ-20)',
    'Udaipur (RJ-27)', 'Bikaner (RJ-04)', 'Ajmer (RJ-01)', 'Bharatpur (RJ-05)', 'Alwar (RJ-02)',
    'Sikar (RJ-23)', 'Pali (RJ-22)', 'Sri Ganganagar (RJ-13)', 'Bhilwara (RJ-06)', 'Chittorgarh (RJ-08)',
    // Uttar Pradesh
    'Lucknow (UP-32)', 'Kanpur (UP-78)', 'Agra (UP-80)', 'Varanasi (UP-65)', 'Allahabad (UP-70)',
    'Meerut (UP-15)', 'Ghaziabad (UP-14)', 'Noida (UP-16)', 'Bareilly (UP-25)', 'Aligarh (UP-81)',
    'Moradabad (UP-21)', 'Saharanpur (UP-11)', 'Gorakhpur (UP-53)', 'Faizabad (UP-42)', 'Jhansi (UP-93)',
    'Mathura (UP-85)', 'Muzaffarnagar (UP-12)', 'Rampur (UP-22)', 'Shahjahanpur (UP-26)', 'Firozabad (UP-83)',
    // Madhya Pradesh
    'Indore (MP-09)', 'Bhopal (MP-04)', 'Gwalior (MP-07)', 'Jabalpur (MP-20)',
    'Ujjain (MP-10)', 'Sagar (MP-15)', 'Rewa (MP-17)', 'Satna (MP-19)', 'Ratlam (MP-43)',
    'Dewas (MP-13)', 'Burhanpur (MP-48)', 'Khandwa (MP-12)', 'Chhindwara (MP-28)', 'Dhar (MP-11)',
    // Punjab
    'Chandigarh (CH-01)', 'Chandigarh (CH-02)', 'Chandigarh (CH-03)', 'Chandigarh (CH-04)',
    'Amritsar (PB-02)', 'Ludhiana (PB-10)', 'Jalandhar (PB-08)', 'Patiala (PB-11)', 'Bathinda (PB-03)',
    'Mohali (PB-12)', 'Hoshiarpur (PB-07)', 'Pathankot (PB-13)', 'Ferozepur (PB-05)', 'Sangrur (PB-13)',
    // Haryana
    'Gurgaon (HR-26)', 'Gurgaon (HR-55)', 'Faridabad (HR-51)', 'Panipat (HR-06)', 'Karnal (HR-05)',
    'Ambala (HR-01)', 'Yamunanagar (HR-02)', 'Rohtak (HR-13)', 'Hisar (HR-20)', 'Sonipat (HR-14)',
    'Rewari (HR-36)', 'Bhiwani (HR-19)', 'Sirsa (HR-31)', 'Jind (HR-15)', 'Kaithal (HR-08)',
    // Kerala
    'Thiruvananthapuram (KL-01)', 'Kochi (KL-07)', 'Kozhikode (KL-11)', 'Thrissur (KL-08)', 'Kannur (KL-13)',
    'Kollam (KL-02)', 'Alappuzha (KL-04)', 'Palakkad (KL-09)', 'Malappuram (KL-10)', 'Kottayam (KL-05)',
    // Odisha
    'Bhubaneswar (OD-02)', 'Cuttack (OD-05)', 'Rourkela (OD-14)', 'Berhampur (OD-07)', 'Sambalpur (OD-15)',
    'Puri (OD-13)', 'Balasore (OD-01)', 'Jharsuguda (OD-20)', 'Angul (OD-19)', 'Bhadrak (OD-03)',
    // Bihar
    'Patna (BR-01)', 'Gaya (BR-02)', 'Muzaffarpur (BR-06)', 'Bhagalpur (BR-10)', 'Darbhanga (BR-04)',
    'Purnia (BR-13)', 'Ara (BR-03)', 'Katihar (BR-09)', 'Chapra (BR-05)', 'Motihari (BR-15)',
    // Jharkhand
    'Ranchi (JH-01)', 'Jamshedpur (JH-05)', 'Dhanbad (JH-10)', 'Bokaro (JH-09)', 'Hazaribagh (JH-02)',
    'Deoghar (JH-15)', 'Giridih (JH-11)', 'Dumka (JH-04)', 'Chaibasa (JH-20)', 'Ramgarh (JH-24)',
    // Assam
    'Guwahati (AS-01)', 'Silchar (AS-11)', 'Dibrugarh (AS-06)', 'Jorhat (AS-03)', 'Nagaon (AS-02)',
    'Tinsukia (AS-23)', 'Tezpur (AS-12)', 'Barpeta (AS-15)', 'Goalpara (AS-18)', 'Karimganj (AS-19)',
    // Chhattisgarh
    'Raipur (CG-04)', 'Bhilai (CG-07)', 'Bilaspur (CG-10)', 'Durg (CG-08)', 'Korba (CG-12)',
    'Raigarh (CG-13)', 'Jagdalpur (CG-14)', 'Ambikapur (CG-15)', 'Rajnandgaon (CG-11)', 'Dhamtari (CG-16)',
    // Uttarakhand
    'Dehradun (UK-07)', 'Haridwar (UK-08)', 'Nainital (UK-04)', 'Udham Singh Nagar (UK-06)', 'Almora (UK-01)',
    'Pithoragarh (UK-05)', 'Chamoli (UK-03)', 'Pauri (UK-12)', 'Tehri (UK-09)', 'Rudraprayag (UK-13)',
    // Himachal Pradesh
    'Shimla (HP-01)', 'Solan (HP-14)', 'Kangra (HP-38)', 'Mandi (HP-26)', 'Hamirpur (HP-22)',
    'Una (HP-73)', 'Bilaspur (HP-24)', 'Chamba (HP-33)', 'Kullu (HP-34)', 'Sirmaur (HP-17)',
    // Andhra Pradesh
    'Visakhapatnam (AP-31)', 'Vijayawada (AP-16)', 'Guntur (AP-07)', 'Nellore (AP-26)', 'Tirupati (AP-03)',
    'Kurnool (AP-21)', 'Rajahmundry (AP-05)', 'Kakinada (AP-04)', 'Anantapur (AP-02)', 'Kadapa (AP-04)',
    // Goa
    'Panaji (GA-01)', 'Margao (GA-02)', 'Mapusa (GA-03)', 'Vasco (GA-06)', 'Ponda (GA-12)',
    // Manipur
    'Imphal (MN-01)', 'Thoubal (MN-02)', 'Bishnupur (MN-03)', 'Churachandpur (MN-04)',
    // Meghalaya
    'Shillong (ML-05)', 'Tura (ML-08)', 'Jowai (ML-10)', 'Nongpoh (ML-11)',
    // Mizoram
    'Aizawl (MZ-01)', 'Lunglei (MZ-02)', 'Champhai (MZ-03)', 'Serchhip (MZ-04)',
    // Nagaland
    'Kohima (NL-01)', 'Dimapur (NL-07)', 'Mokokchung (NL-02)', 'Tuensang (NL-03)',
    // Tripura
    'Agartala (TR-01)', 'Udaipur (TR-02)', 'Kailasahar (TR-03)', 'Dharmanagar (TR-04)',
    // Sikkim
    'Gangtok (SK-01)', 'Namchi (SK-02)', 'Mangan (SK-03)', 'Gyalshing (SK-04)',
    // Arunachal Pradesh
    'Itanagar (AR-01)', 'Naharlagun (AR-12)', 'Pasighat (AR-11)', 'Tezu (AR-10)',
    // Puducherry
    'Puducherry (PY-01)', 'Karaikal (PY-02)', 'Mahe (PY-03)', 'Yanam (PY-04)',
    // Jammu & Kashmir
    'Srinagar (JK-01)', 'Jammu (JK-02)', 'Anantnag (JK-03)', 'Baramulla (JK-04)', 'Udhampur (JK-14)',
    // Ladakh
    'Leh (LA-01)', 'Kargil (LA-02)',
    // Andaman & Nicobar
    'Port Blair (AN-01)', 'Car Nicobar (AN-02)',
    // Dadra & Nagar Haveli and Daman & Diu
    'Daman (DD-01)', 'Diu (DD-02)', 'Silvassa (DD-03)'
  ]

  const ownerOptions = ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner', '5+ Owner']

  const kmDrivenOptions = [
    'Less than 10,000 km',
    '10,000 - 25,000 km',
    '25,000 - 50,000 km',
    '50,000 - 75,000 km',
    '75,000 - 1,00,000 km',
    '1,00,000 - 1,50,000 km',
    '1,50,000 - 2,00,000 km',
    'More than 2,00,000 km'
  ]

  const transmissionOptions = [
    { label: 'Manual', value: 'manual' },
    { label: 'Automatic', value: 'automatic' },
    { label: 'Automated Manual (AMT)', value: 'amt' }
  ]

  const fuelTypeOptions = ['Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid']

  const nationalPermitOptions = [
    { label: 'Yes - Active National Permit', value: 'yes' },
    { label: 'No - State Permit Only', value: 'no' },
    { label: 'Applying / In Process', value: 'processing' }
  ]

  const loanStatusOptions = [
    { label: 'No loan on vehicle', value: 'no-loan' },
    { label: 'Active loan - Bank/NBFC', value: 'active-loan' },
    { label: 'Loan closed but NOC pending', value: 'noc-pending' }
  ]

  const insuranceOptions = [
    { label: 'Yes - Comprehensive', value: 'comprehensive' },
    { label: 'Yes - Third Party', value: 'third-party' },
    { label: 'No active insurance', value: 'no-insurance' }
  ]

  const rcStatusOptions = [
    { label: 'Original RC', value: 'original' },
    { label: 'Duplicate RC', value: 'duplicate' }
  ]

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ]

  const sellTimelineOptions = [
    { label: 'Sell immediately', value: 'immediate' },
    { label: 'Within 3 months', value: 'three-months' },
    { label: 'Within 6 months', value: 'six-months' },
    { label: 'Not sure yet', value: 'not-sure' }
  ]

  const availableSellModels = sellForm.brand ? truckData[sellForm.brand]?.models ?? [] : []
  const selectedTimelineLabel = sellTimelineOptions.find(option => option.value === sellForm.sellTimeline)?.label ?? '—'

  // Auto-advance stepper when certain fields are filled
  // Moved to useEffect to avoid state updates during render
  useEffect(() => {
    const stepper = stepperRef.current
    if (!stepper) return

    const currentStep = stepper.currentStep
    let timer: NodeJS.Timeout | null = null

    // Steps 7-10: advance once the key fields on that step are filled
    // Note: Step numbers adjusted after removing variant step
    if (currentStep === 7 && sellForm.transmission) {
      // Use setTimeout to ensure this runs after render
      timer = setTimeout(() => {
      stepper.goToNext()
      }, 100)
    } else if (currentStep === 8 && sellForm.fuelType) {
      timer = setTimeout(() => {
      stepper.goToNext()
      }, 100)
    } else if (
      currentStep === 9 &&
      sellForm.nationalPermit &&
      sellForm.loanStatus &&
      sellForm.insuranceStatus &&
      sellForm.rcStatus
    ) {
      timer = setTimeout(() => {
      stepper.goToNext()
      }, 100)
    } else if (currentStep === 10 && sellForm.sellTimeline) {
      timer = setTimeout(() => {
      stepper.goToNext()
      }, 100)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [sellForm.transmission, sellForm.fuelType, sellForm.nationalPermit, sellForm.loanStatus, sellForm.insuranceStatus, sellForm.rcStatus, sellForm.sellTimeline])

  const handleSellFormChange = (field: keyof SellFormState, value: string) => {
    setSellFormError('')
    
    // Handle phone number validation
    if (field === 'ownerPhone') {
      // Only allow digits and limit to 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      
      // Validate: must be exactly 10 digits
      if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
        setPhoneError('Phone number must be exactly 10 digits')
      } else {
        setPhoneError('')
      }
      
      setSellForm(prev => ({
        ...prev,
        [field]: digitsOnly
      }))
      return
    }
    
    setSellForm(prev => {
      const updated: SellFormState = {
      ...prev,
      [field]: value,
      ...(field === 'brand' ? { model: '' } : {})
      }
      return updated
    })
  }

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Failed to upload image')
    }

    const data = await response.json()
    return data.url
  }

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    if (!files.length) return

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const validFiles: File[] = []

    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file. Please upload JPG or PNG files only.`)
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`)
        return
      }

      validFiles.push(file)
    })

    if (!validFiles.length) {
      if (event.target) {
        event.target.value = ''
      }
      return
    }

    // Process each file: create preview and upload to Supabase
    validFiles.forEach(async (file) => {
      // Check if we've reached the limit
      setPhotoPreviews(prev => {
        if (prev.length >= MAX_TRUCK_PHOTOS) {
          alert(`You can only upload up to ${MAX_TRUCK_PHOTOS} photos.`)
          return prev
        }
        
        // Check if this file is already in the previews
        const exists = prev.some(p => p.file.name === file.name && p.file.size === file.size)
        if (exists) {
          return prev
        }
        
        // Create preview first
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          if (dataUrl) {
            setPhotoPreviews(prevPreviews => {
              const newPreview: PhotoPreview = {
                file,
                preview: dataUrl,
                uploading: true,
                uploadError: undefined
              }
              return [...prevPreviews, newPreview]
            })

            // Upload to Supabase
            uploadImageToSupabase(file)
              .then(supabaseUrl => {
                setPhotoPreviews(prevPreviews => {
                  return prevPreviews.map(p => 
                    p.file === file 
                      ? { ...p, supabaseUrl, uploading: false, uploadError: undefined }
                      : p
                  )
                })
              })
              .catch(error => {
                console.error('Upload error:', error)
                setPhotoPreviews(prevPreviews => {
                  return prevPreviews.map(p => 
                    p.file === file 
                      ? { ...p, uploading: false, uploadError: error.message }
                      : p
                  )
                })
                alert(`Failed to upload ${file.name}: ${error.message}`)
              })
          }
        }
        
        reader.onerror = () => {
          console.error('Failed to read file:', file.name)
          alert(`Failed to load ${file.name}. Please try again.`)
        }
        
        reader.readAsDataURL(file)
        return prev
      })
    })

    if (event.target) {
      event.target.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoPreviews(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const resetSellFormState = () => {
    setSellForm(createInitialSellFormState())
    setSellFormError('')
    setSellFormStatus('idle')
    setPhotoPreviews([])
  }

  const normalizeTransmission = (value: string) => {
    if (value === 'automatic') return 'Automatic'
    if (value === 'amt') return 'AMT'
    return 'Manual'
  }

  const normalizeFuelType = (value: string) => {
    if (value === 'Hybrid') return 'Hybrid'
    if (value === 'Petrol') return 'Petrol'
    if (value === 'CNG') return 'CNG'
    if (value === 'Electric') return 'Electric'
    return 'Diesel'
  }

  const parseOwnerNumber = (value: string) => {
    const match = value.match(/\d+/)
    const parsed = match ? parseInt(match[0], 10) : 1
    if (Number.isNaN(parsed)) return 1
    return Math.min(Math.max(parsed, 1), 10)
  }

  const parseKilometersValue = (value: string) => {
    if (!value) return 0
    const numericParts = value.replace(/,/g, '').match(/\d+/g)
    if (!numericParts?.length) return 0
    const last = numericParts[numericParts.length - 1]
    const parsed = parseInt(last, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const buildSubmissionPayload = () => {
    const yearFromStepper = formData.year ? parseInt(String(formData.year), 10) : NaN
    const kilometers = parseKilometersValue(sellForm.kilometers || formData.kmDriven)
    // Use Supabase URLs if available, otherwise fall back to preview (for backwards compatibility)
    const images = photoPreviews
      .map(photo => photo.supabaseUrl || photo.preview)
      .filter(Boolean)
    const cityFromRto = sellForm.rtoState ? sellForm.rtoState.split(' (')[0] : null

    return {
      sellerName: sellForm.ownerName || 'Unknown Seller',
      sellerEmail: sellForm.ownerEmail?.trim() || 'lead@no-email.invalid',
      sellerPhone: sellForm.ownerPhone || '0000000000',
      manufacturer: sellForm.brand || formData.brand || 'Unknown',
      model: sellForm.model || formData.model || 'Unknown',
      year: Number.isFinite(yearFromStepper) ? yearFromStepper : new Date().getFullYear(),
      registrationNumber: sellForm.rtoState || null,
      kilometers,
      fuelType: normalizeFuelType(sellForm.fuelType),
      transmission: normalizeTransmission(sellForm.transmission),
      horsepower: null,
      engineCapacity: null,
      condition: 'Good',
      ownerNumber: parseOwnerNumber(sellForm.ownerCount),
      askingPrice: 0,
      negotiable: true,
      location: sellForm.rtoState || sellForm.userState || 'Unknown',
      state: sellForm.userState || 'Unknown',
      city: cityFromRto || 'Unknown',
      features: null,
      description: sellForm.description || null,
      images: JSON.stringify(images.length ? images : [])
    }
  }

  const submitSellForm = async () => {
    if (isSubmitting) return false
    setSellFormError('')
    
    // Validate phone number before submission
    if (!sellForm.ownerPhone || sellForm.ownerPhone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits')
      setSellFormError('Please enter a valid 10-digit phone number')
      setSellFormStatus('idle')
      return false
    }
    
    setSellFormStatus('submitting')
    setIsSubmitting(true)

    const payload = buildSubmissionPayload()

    try {
      const response = await fetch('/api/truck-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const rawText = await response.text().catch(() => '')
        let message = 'Failed to submit truck details. Please try again.'

        try {
          const parsed = rawText ? JSON.parse(rawText) : null
          message = parsed?.message || parsed?.error || message
          if (parsed?.details) {
            message = `${message} (${JSON.stringify(parsed.details)})`
          }
        } catch {
          if (rawText) {
            message = rawText
          }
        }

        console.error('Sell truck submission failed:', {
          status: response.status,
          statusText: response.statusText,
          message,
          body: rawText
        })

        setSellFormStatus('idle')
        setSellFormError(message)
        return false
      }

      setSellFormStatus('success')
      return true
    } catch (error) {
      console.error('Sell truck submission failed:', error)
      setSellFormStatus('idle')
      setSellFormError(error instanceof Error ? error.message : 'Unable to submit right now. Please try again.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSellFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSellFormError('')

    const requiredFields: (keyof SellFormState)[] = [
      'brand',
      'model',
      'transmission',
      'fuelType',
      'kilometers',
      'rtoState',
      'ownerCount',
      'nationalPermit',
      'loanStatus',
      'insuranceStatus',
      'rcStatus',
      'sellTimeline',
      'ownerName',
      'ownerPhone',
      'userState',
    ]

    const hasMissingField = requiredFields.some(field => !sellForm[field])
    if (hasMissingField) {
      setSellFormError('Please complete all required fields before submitting the form.')
      return
    }

    await submitSellForm()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset dependent fields
      ...(field === 'brand' && { model: '', variant: '' }),
      ...(field === 'model' && { variant: '' })
    }))
    
    const mappedField = stepperFieldMappings[field]
    if (mappedField) {
      handleSellFormChange(mappedField, value)
    }

    // When a variant is selected, auto-set default fuel & transmission (mainly for TATA Motors)
    if (field === 'variant') {
      const attrs = variantAttributes[value]
      if (attrs) {
        // Special handling for Volvo Trucks, Maruti Suzuki, and Eicher Motors
        const currentBrand = formData.brand || sellForm.brand
        const currentModel = formData.model || sellForm.model
        const isVolvo = currentBrand === 'Volvo Trucks'
        const isMaruti = currentBrand === 'Maruti Suzuki'
        const isEicher = currentBrand === 'Eicher Motors'
        const isElectricModel = currentModel && (
          currentModel.includes('Electric') || 
          currentModel === 'FM Electric' || 
          currentModel === 'FMX Electric'
        )
        
        // Volvo-specific overrides for shared variants
        let fuel = attrs.fuel
        let transmission = attrs.transmission
        
        if (isVolvo) {
          // Volvo uses automatic transmission for most variants
          if (value === '4x2 Tractor' || value === '6x4 Tractor') {
            transmission = 'automatic'
          }
          // Electric model variants
          if (isElectricModel && (value === '4x2 Tractor' || value === '8x4 Tipper')) {
            fuel = 'Electric'
            transmission = 'automatic'
          }
        }
        
        // Maruti Suzuki-specific handling: fuel type based on model name
        if (isMaruti && currentModel) {
          if (currentModel.includes('CNG') || currentModel.includes('S-CNG')) {
            fuel = 'CNG'
          } else if (currentModel.includes('Petrol')) {
            fuel = 'Petrol'
          }
        }
        
        // Eicher Motors-specific handling: fuel type based on model name and variant
        if (isEicher && currentModel) {
          // CNG models
          if (currentModel.includes('CNG')) {
            fuel = 'CNG'
          }
          // Electric models
          else if (currentModel.includes('EV') || currentModel.includes('Electric')) {
            fuel = 'Electric'
          }
          // Pro X model - check variant for Electric
          else if (currentModel === 'Pro X' && value === 'Electric') {
            fuel = 'Electric'
          }
          // Pro 6055 FL - LNG fuel
          else if (currentModel === 'Pro 6055 FL') {
            fuel = 'Diesel' // LNG mapped to Diesel as closest option
          }
          // Variants that indicate Diesel/CNG capability - default to Diesel
          else if (value === 'Extra Power' && (
            currentModel === 'Pro 2059XP' || 
            currentModel === 'Pro 2095XP' || 
            currentModel === 'Pro 2110' || 
            currentModel === 'Pro 2114XP'
          )) {
            fuel = 'Diesel' // Diesel/CNG mapped to Diesel as default
          }
        }
        
        setSellForm(prev => ({
          ...prev,
          fuelType: fuel,
          transmission: transmission
        }))
      }
    }
    
    // Auto-advance to next step after a short delay (for quick, single-choice steps)
    setTimeout(() => {
      // Auto-advance for steps 1–7 (up to Kilometers Driven)
      if (stepperRef.current && stepperRef.current.currentStep < 8) {
        stepperRef.current.goToNext()
      }
    }, 300) // Small delay for better UX
  }

  const handleStepperSubmit = async () => {
    const requiredFields: (keyof SellFormState)[] = [
      'brand',
      'model',
      'transmission',
      'fuelType',
      'kilometers',
      'rtoState',
      'ownerCount',
      'nationalPermit',
      'loanStatus',
      'insuranceStatus',
      'rcStatus',
      'sellTimeline',
      'ownerName',
      'ownerPhone',
      'userState'
    ]

    const missingField = requiredFields.find(field => !sellForm[field])

    if (missingField) {
      setSellFormError('Please complete all required fields before submitting the form.')
      return
    }

    await submitSellForm()
  }

  const resetStepperProcess = () => {
    setFormData(createInitialStepperData())
    setSellForm(createInitialSellFormState())
    setSellFormStatus('idle')
    setSellFormError('')
    setPhotoPreviews([])
      setIsSubmitting(false)
    setStepperInstanceKey(prev => prev + 1)
  }

  return (
    <div className="sell-truck-page">
      <Navbar />

      {LEGACY_ESTIMATOR_ENABLED ? (
        <>
      <div className="sell-truck-hero">
        <div className="sell-truck-hero-content">
          <h1 className="sell-truck-hero-title">Get Your Truck&apos;s Instant Price</h1>
          <p className="sell-truck-hero-subtitle">
            Find out what your truck is worth in just {STEPPER_TOTAL_STEPS} guided steps. Share complete vehicle details, documents, and photos for the fastest valuation.
          </p>
          <div className="sell-truck-stats">
            <div className="stat-item">
              <span className="stat-number">{STEPPER_TOTAL_STEPS}</span>
              <span className="stat-label">Easy Steps</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">2 Min</span>
              <span className="stat-label">Quick Process</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">Instant</span>
              <span className="stat-label">Price Estimate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sell-truck-container">
        <div className="stepper-wrapper">
          {sellFormStatus === 'success' ? (
            <div className="success-message stepper-success-card">
              <div className="success-icon">✓</div>
              <h2>Form Submitted</h2>
              <p>Thank you for sharing your truck details. Our team will reach out within 24 hours.</p>
              <ul className="success-summary-list">
                <li><strong>Truck:</strong> {sellForm.brand || '—'} {sellForm.model || ''}</li>
                <li><strong>Ownership:</strong> {sellForm.ownerCount || '—'}</li>
                <li><strong>Timeline:</strong> {selectedTimelineLabel}</li>
                <li><strong>Contact:</strong> {sellForm.ownerPhone || '—'}</li>
              </ul>
              <div className="success-actions">
                <button type="button" className="submit-btn" onClick={resetStepperProcess}>
                  Submit another truck
                </button>
                <button type="button" className="btn-secondary" onClick={() => router.push('/')}>
                  Back to home
                </button>
              </div>
            </div>
          ) : (
            <>
          <Stepper
            key={stepperInstanceKey}
            ref={stepperRef}
            initialStep={1}
            onStepChange={(step) => console.log('Current step:', step)}
            onFinalStepCompleted={handleStepperSubmit}
            backButtonText="← Previous"
            nextButtonText="Next →"
            finalButtonText="Submit"
            autoAdvance={true}
          >
            {/* Step 1: Select Brand */}
            <Step>
              <div className="step-content">
                <h2>Select Your Truck Brand</h2>
                <p>Choose the manufacturer of your truck</p>
                <div className="options-grid">
                      {brandOptions.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      className={`option-card ${formData.brand === brand ? 'selected' : ''}`}
                      onClick={() => handleInputChange('brand', brand)}
                    >
                      <span className="option-text">{brand}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 2: Select Model */}
            <Step>
              <div className="step-content">
                <h2>Select Truck Model</h2>
                <p>Choose the model: {formData.brand || 'Please select a brand first'}</p>
                <div className="options-grid">
                  {formData.brand && truckData[formData.brand]?.models.map((model) => (
                    <button
                      key={model}
                      type="button"
                      className={`option-card ${formData.model === model ? 'selected' : ''}`}
                      onClick={() => handleInputChange('model', model)}
                    >
                      <span className="option-text">{model}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 3: Select Year */}
            <Step>
              <div className="step-content">
                <h2>Manufacturing Year</h2>
                <p>When was your truck manufactured?</p>
                <div className="options-grid year-grid">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={`option-card ${formData.year === year ? 'selected' : ''}`}
                      onClick={() => handleInputChange('year', year)}
                    >
                      <span className="option-text">{year}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 5: Select RTO Location */}
            <Step>
              <div className="step-content">
                <h2>RTO Location</h2>
                <p>Select where your truck is registered</p>
                <div className="options-grid">
                  {rtoLocations.map((rto, index) => (
                    <button
                      key={`${rto}-${index}`}
                      type="button"
                      className={`option-card ${formData.rtoLocation === rto ? 'selected' : ''}`}
                      onClick={() => handleInputChange('rtoLocation', rto)}
                    >
                      <span className="option-text">{rto}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 6: Select Owner */}
            <Step>
              <div className="step-content">
                <h2>Ownership</h2>
                <p>Which owner are you?</p>
                <div className="options-grid owner-grid">
                  {ownerOptions.map((owner) => (
                    <button
                      key={owner}
                      type="button"
                      className={`option-card ${formData.owner === owner ? 'selected' : ''}`}
                      onClick={() => handleInputChange('owner', owner)}
                    >
                      <span className="option-text">{owner}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 7: Select KM Driven */}
            <Step>
              <div className="step-content">
                <h2>Kilometers Driven</h2>
                <p>How many kilometers has your truck covered?</p>
                <div className="options-grid">
                  {kmDrivenOptions.map((km) => (
                    <button
                      key={km}
                      type="button"
                      className={`option-card ${formData.kmDriven === km ? 'selected' : ''}`}
                      onClick={() => handleInputChange('kmDriven', km)}
                    >
                      <span className="option-text">{km}</span>
                    </button>
                  ))}
                </div>
                  </div>
            </Step>

            {/* Step 8: Transmission */}
            <Step>
              <div className="step-content">
                <h2>Transmission</h2>
                <p>Select your truck&apos;s transmission type</p>
                <div className="options-grid owner-grid">
                  {transmissionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`option-card ${sellForm.transmission === option.value ? 'selected' : ''}`}
                      onClick={() => handleSellFormChange('transmission', option.value)}
                    >
                      <span className="option-text">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 9: Fuel Type */}
            <Step>
              <div className="step-content">
                <h2>Fuel Type</h2>
                <p>Tell us about the drivetrain configuration</p>
                <div className="options-grid owner-grid fuel-grid">
                  {fuelTypeOptions.map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      className={`option-card ${sellForm.fuelType === fuel ? 'selected' : ''}`}
                      onClick={() => handleSellFormChange('fuelType', fuel)}
                    >
                      <span className="option-text">{fuel}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 10: Permits & Paperwork */}
            <Step>
              <div className="step-content">
                <h2>Permits & Paperwork</h2>
                <p>Share the current compliance status of your truck</p>
                <div className="step-form-grid">
                  <CustomSelect
                    id="step-national-permit"
                    label="National Permit *"
                    value={sellForm.nationalPermit}
                    onChange={(value) => handleSellFormChange('nationalPermit', value)}
                    options={nationalPermitOptions}
                    placeholder="Select permit status"
                    required
                  />
                  <CustomSelect
                    id="step-loan-status"
                    label="Loan on Truck *"
                    value={sellForm.loanStatus}
                    onChange={(value) => handleSellFormChange('loanStatus', value)}
                    options={loanStatusOptions}
                    placeholder="Select loan status"
                    required
                  />
                  <CustomSelect
                    id="step-insurance-status"
                    label="Insurance Status *"
                    value={sellForm.insuranceStatus}
                    onChange={(value) => handleSellFormChange('insuranceStatus', value)}
                    options={insuranceOptions}
                    placeholder="Select insurance"
                    required
                  />
                  <CustomSelect
                    id="step-rc-status"
                    label="RC Status *"
                    value={sellForm.rcStatus}
                    onChange={(value) => handleSellFormChange('rcStatus', value)}
                    options={rcStatusOptions}
                    placeholder="Select RC status"
                    required
                  />
                </div>
              </div>
            </Step>

            {/* Step 11: Selling Intent */}
            <Step>
              <div className="step-content">
                <h2>Selling Intent</h2>
                <p>Help us plan the right timeline and inspection slots</p>
                <div className="step-form-fields">
                  <CustomSelect
                    id="step-sell-timeline"
                    label="When do you plan to sell? *"
                    value={sellForm.sellTimeline}
                    onChange={(value) => handleSellFormChange('sellTimeline', value)}
                    options={sellTimelineOptions}
                    placeholder="Select timeline"
                    required
                  />
                  <label className="step-textarea-label" htmlFor="step-extra-details">Anything else we should know? (Optional)</label>
                  <textarea
                    id="step-extra-details"
                    placeholder="Share tyre condition, fitness certificate expiry, accessories, etc."
                    value={sellForm.description}
                    onChange={(e) => handleSellFormChange('description', e.target.value)}
                    className="step-textarea"
                  />
                </div>
              </div>
            </Step>

            {/* Step 12: Owner & Contact Details */}
            <Step>
              <div className="step-content">
                <h2>Your Location & Contact</h2>
                <p>Our advisory team will reach out within 24 hours</p>
                <div className="step-form-grid">
                  <CustomSelect
                    id="step-user-state"
                    label="Your State *"
                    value={sellForm.userState}
                    onChange={(value) => handleSellFormChange('userState', value)}
                    options={indianStates}
                    placeholder="Select your state"
                    required
                  />
                  <div className="step-form-group">
                    <label htmlFor="step-owner-name">Full Name *</label>
                    <input
                      id="step-owner-name"
                      type="text"
                      placeholder="Your full name"
                      value={sellForm.ownerName}
                      onChange={(e) => handleSellFormChange('ownerName', e.target.value)}
                    />
                  </div>
                  <div className="step-form-group">
                    <label htmlFor="step-owner-phone">Phone Number *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ 
                        position: 'absolute', 
                        left: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: '#666',
                        fontWeight: '500',
                        pointerEvents: 'none'
                      }}>+91</span>
                    <input
                      id="step-owner-phone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={sellForm.ownerPhone}
                      onChange={(e) => handleSellFormChange('ownerPhone', e.target.value)}
                        style={{ paddingLeft: '50px' }}
                        maxLength={10}
                      />
                    </div>
                    {phoneError && (
                      <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                        {phoneError}
                      </span>
                    )}
                  </div>
                  <div className="step-form-group">
                    <label htmlFor="step-owner-email">Email (Optional)</label>
                    <input
                      id="step-owner-email"
                      type="email"
                      placeholder="you@example.com"
                      value={sellForm.ownerEmail}
                      onChange={(e) => handleSellFormChange('ownerEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Step>

          </Stepper>
          {sellFormError && (
            <div className="error-message stepper-error-message">
              {sellFormError}
        </div>
          )}

          {isSubmitting && (
            <div className="stepper-submitting">
              <div className="spinner" />
              <p>Submitting your truck details...</p>
            </div>
          )}
          </>
          )}
        </div>
      </div>
        </>
      ) : sellFormStatus === 'success' ? (
        <div className="success-message-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Details received</h2>
            <p>Thank you for sharing your truck details. Our advisory team will reach out within 24 hours.</p>
            <p><strong>Truck:</strong> {sellForm.brand || '—'} {sellForm.model || ''}</p>
            <p><strong>Selling timeline:</strong> {selectedTimelineLabel}</p>
            <p><strong>Photos uploaded:</strong> {photoPreviews.length}</p>
            <button type="button" className="submit-btn" onClick={resetSellFormState}>
              Submit another truck
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="sell-truck-hero">
            <div className="sell-truck-hero-content">
              <h1 className="sell-truck-hero-title">Sell Your Truck Confidently</h1>
              <p className="sell-truck-hero-subtitle">
                Share complete vehicle details, documents, and clear photos. Our expert evaluators will call with a firm offer within 24 hours.
              </p>
              <div className="sell-truck-stats">
                <div className="stat-item">
                  <span className="stat-number">24h</span>
                  <span className="stat-label">Response</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">{MAX_TRUCK_PHOTOS}</span>
                  <span className="stat-label">Photo Uploads</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">Pan-India</span>
                  <span className="stat-label">RTO Support</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sell-truck-container">
            <form className="sell-truck-form" onSubmit={handleSellFormSubmit}>
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7h18M5 7l1.5 9h11L19 7"/>
                      <path d="M9 11h6M10 15h4"/>
                    </svg>
                  </div>
                  <h3 className="section-title">Vehicle Basics</h3>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <CustomSelect
                      id="sell-brand"
                      label="Brand *"
                      value={sellForm.brand}
                      onChange={(value) => handleSellFormChange('brand', value)}
                      options={brandOptions}
                      placeholder="Select brand"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sell-model">Model *</label>
                    <input
                      id="sell-model"
                      type="text"
                      list="sell-model-options"
                      placeholder="Eg. Prima 2518"
                      value={sellForm.model}
                      onChange={(e) => handleSellFormChange('model', e.target.value)}
                      required
                    />
                    <datalist id="sell-model-options">
                      {availableSellModels.map((model) => (
                        <option key={model} value={model} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <CustomSelect
                      id="sell-transmission"
                      label="Transmission *"
                      value={sellForm.transmission}
                      onChange={(value) => handleSellFormChange('transmission', value)}
                      options={transmissionOptions}
                      placeholder="Select transmission"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <CustomSelect
                      id="sell-fuel"
                      label="Fuel Type *"
                      value={sellForm.fuelType}
                      onChange={(value) => handleSellFormChange('fuelType', value)}
                      options={fuelTypeOptions}
                      placeholder="Select fuel type"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sell-kilometers">KM Driven *</label>
                    <input
                      id="sell-kilometers"
                      type="number"
                      min="0"
                      step="500"
                      placeholder="Total kilometers"
                      value={sellForm.kilometers}
                      onChange={(e) => handleSellFormChange('kilometers', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <CustomSelect
                      id="sell-owner-count"
                      label="Ownership *"
                      value={sellForm.ownerCount}
                      onChange={(value) => handleSellFormChange('ownerCount', value)}
                      options={ownerOptions}
                      placeholder="Select owner count"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                  </div>
                  <h3 className="section-title">Registration & Compliance</h3>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <CustomSelect
                      id="sell-rto"
                      label="Registered State / RTO *"
                      value={sellForm.rtoState}
                      onChange={(value) => handleSellFormChange('rtoState', value)}
                      options={rtoLocations}
                      placeholder="Select RTO"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <CustomSelect
                      id="sell-national-permit"
                      label="National Permit *"
                      value={sellForm.nationalPermit}
                      onChange={(value) => handleSellFormChange('nationalPermit', value)}
                      options={nationalPermitOptions}
                      placeholder="Select permit status"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <CustomSelect
                      id="sell-loan-status"
                      label="Loan on Truck *"
                      value={sellForm.loanStatus}
                      onChange={(value) => handleSellFormChange('loanStatus', value)}
                      options={loanStatusOptions}
                      placeholder="Select loan status"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <CustomSelect
                      id="sell-insurance"
                      label="Insurance Status *"
                      value={sellForm.insuranceStatus}
                      onChange={(value) => handleSellFormChange('insuranceStatus', value)}
                      options={insuranceOptions}
                      placeholder="Select insurance"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <CustomSelect
                      id="sell-rc-status"
                      label="RC Status *"
                      value={sellForm.rcStatus}
                      onChange={(value) => handleSellFormChange('rcStatus', value)}
                      options={rcStatusOptions}
                      placeholder="Select RC status"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12h20" />
                      <path d="M12 2v20" />
                    </svg>
                  </div>
                  <h3 className="section-title">Selling Intent</h3>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <CustomSelect
                      id="sell-timeline"
                      label="When do you plan to sell? *"
                      value={sellForm.sellTimeline}
                      onChange={(value) => handleSellFormChange('sellTimeline', value)}
                      options={sellTimelineOptions}
                      placeholder="Select timeline"
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="sell-extra-details">Anything else we should know? (Optional)</label>
                    <textarea
                      id="sell-extra-details"
                      placeholder="Optional: share fitness certificate expiry, tyre condition, accessories, etc."
                      value={sellForm.description}
                      onChange={(e) => handleSellFormChange('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z" />
                      <path d="M5 20v-1c0-2.21 1.79-4 4-4h6c2.21 0 4 1.79 4 4v1" />
                    </svg>
                  </div>
                  <h3 className="section-title">Your Contact Details</h3>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sell-owner-name">Full Name *</label>
                    <input
                      id="sell-owner-name"
                      type="text"
                      placeholder="Your full name"
                      value={sellForm.ownerName}
                      onChange={(e) => handleSellFormChange('ownerName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sell-owner-phone">Phone Number *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ 
                        position: 'absolute', 
                        left: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: '#666',
                        fontWeight: '500',
                        pointerEvents: 'none'
                      }}>+91</span>
                    <input
                      id="sell-owner-phone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={sellForm.ownerPhone}
                      onChange={(e) => handleSellFormChange('ownerPhone', e.target.value)}
                        style={{ paddingLeft: '50px' }}
                        maxLength={10}
                      required
                    />
                    </div>
                    {phoneError && (
                      <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                        {phoneError}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="sell-owner-email">Email (Optional)</label>
                    <input
                      id="sell-owner-email"
                      type="email"
                      placeholder="you@example.com"
                      value={sellForm.ownerEmail}
                      onChange={(e) => handleSellFormChange('ownerEmail', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <CustomSelect
                      id="sell-user-state"
                      label="Your State *"
                      value={sellForm.userState}
                      onChange={(value) => handleSellFormChange('userState', value)}
                      options={indianStates}
                      placeholder="Select your state"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7h16l-2 10H6z" />
                      <path d="M12 5l2-2h-4l2 2z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </div>
                  <h3 className="section-title">Upload Photos (Optional)</h3>
                </div>
                <div className="image-upload-section">
                  <p className="upload-hint">
                    Add up to {MAX_TRUCK_PHOTOS} clear exterior/interior photos (JPG or PNG, max 10MB per file).
                  </p>
                  <input
                    ref={photoInputRef}
                    id="sell-photos"
                    className="file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    className="upload-button"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <svg className="upload-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Upload Photos
                  </button>

                  {photoPreviews.length > 0 && (
                    <div className="image-preview-container">
                      <p className="image-preview-count">
                        {photoPreviews.length} of {MAX_TRUCK_PHOTOS} photos uploaded
                      </p>
                      <div className="image-preview-grid">
                        {photoPreviews.map((photo, index) => (
                          <div className="image-preview-card" key={`photo-${index}-${photo.file.name}-${photo.preview}`}>
                            <div className="image-preview-item">
                              <Image 
                                src={photo.supabaseUrl || photo.preview} 
                                alt={`Truck photo ${index + 1}`}
                                className="preview-image"
                                width={200}
                                height={200}
                                unoptimized
                              />
                              <div className="image-number-badge">{index + 1}</div>
                              {photo.uploading && (
                                <div className="upload-status-overlay">
                                  <div className="upload-spinner"></div>
                                  <span>Uploading...</span>
                                </div>
                              )}
                              {photo.uploadError && (
                                <div className="upload-error-overlay">
                                  <span>⚠️ Upload failed</span>
                                </div>
                              )}
                              <button
                                type="button"
                                className="remove-image-btn"
                                aria-label={`Remove photo ${index + 1}`}
                                onClick={() => handleRemovePhoto(index)}
                                title="Remove this photo"
                                disabled={photo.uploading}
                              >
                                ×
                              </button>
                            </div>
                            <div className="image-file-info">
                              <p className="image-file-name" title={photo.file.name}>
                                {photo.file.name.length > 20 
                                  ? photo.file.name.substring(0, 20) + '...' 
                                  : photo.file.name}
                              </p>
                              <p className="image-file-size">
                                {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                                {photo.supabaseUrl && ' ✓ Uploaded'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={sellFormStatus === 'submitting'}>
                  {sellFormStatus === 'submitting' ? 'Submitting...' : 'Submit Truck Details'}
                </button>
                {sellFormError && <p className="error-message">{sellFormError}</p>}
              </div>
            </form>
          </div>
        </>
      )}

      <Footer />
    </div>
  )
}
