type SpecOverride = {
  /** Numeric rupee price (no formatting). */
  price?: number
  /** Model year (e.g. 2022). */
  year?: number
  /** Total kms run. */
  kms?: number
  /** Horsepower (or power display number used on specs). */
  hp?: number
  /** Optional string like '11/2021' if year is derived. */
  yearMonth?: string
}

function parseYearFromYearMonth(yearMonth: string | undefined): number | undefined {
  if (!yearMonth) return undefined
  const m = yearMonth.match(/(\d{4})/)
  if (!m) return undefined
  const y = Number(m[1])
  return Number.isFinite(y) ? y : undefined
}

function nl(s: unknown): string {
  return (s ?? '').toString().toLowerCase()
}

/**
 * Keep homepage/browse card specs aligned with the truck detail page,
 * which has special-case display overrides for some trucks.
 */
export function getTruckSpecOverrideForCards(truck: {
  name?: string | null
  manufacturer?: string | null
  model?: string | null
}): SpecOverride | null {
  const name = nl(truck.name)
  const manufacturer = nl(truck.manufacturer)
  const model = nl(truck.model)

  const isTata709gLPT =
    name.includes('709') &&
    (name.includes('709g') || name.includes('709 g')) &&
    name.includes('lpt') &&
    (name.includes('tata') || manufacturer.includes('tata'))

  if (isTata709gLPT) {
    const o: SpecOverride = { price: 1025000, yearMonth: '11/2021', kms: 129420, hp: 83.08 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isTata1109gLPT =
    name.includes('1109') &&
    name.includes('lpt') &&
    (name.includes('tata') || manufacturer.includes('tata'))

  if (isTata1109gLPT) {
    const o: SpecOverride = { price: 1350000, yearMonth: '03/2023', kms: 162134, hp: 85 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isTata1512GLPT =
    (name.includes('1512') && name.includes('lpt') && name.includes('tata')) ||
    name === 'tata 1512g lpt' ||
    name === 'tata 1512 lpt' ||
    name === 'tata motors 1512 lpt'

  if (isTata1512GLPT) {
    const o: SpecOverride = { price: 1530000, yearMonth: '10/2021', kms: 209311, hp: 123.28 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isTata1212LPT = name.includes('1212') && name.includes('lpt') && name.includes('tata')
  if (isTata1212LPT) {
    const o: SpecOverride = { price: 1420000, yearMonth: '11/2022', kms: 152804, hp: 123.28 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isTata609G =
    name.includes('609') &&
    (name.includes('609g') || name.includes('609 g')) &&
    (name.includes('tata') || manufacturer.includes('tata'))

  if (isTata609G) {
    const o: SpecOverride = { price: 1000000, yearMonth: '07/2022', kms: 78699, hp: 83.08 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isAshokLeyland1415 = (truck.name || '') === 'ASHOK LEYLAND ECOMET STAR 1415 HE'
  if (isAshokLeyland1415) {
    const o: SpecOverride = { price: 1430000, yearMonth: '03/2022', kms: 236133, hp: 142.71 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isEicher2059XP =
    name.includes('2059') && (name.includes('eicher') || manufacturer.includes('eicher') || model.includes('2059'))
  if (isEicher2059XP) {
    const o: SpecOverride = { price: 920000, yearMonth: '09/2020', kms: 183889, hp: 85 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isEicher1075HSD =
    name.includes('1075') && (name.includes('eicher') || manufacturer.includes('eicher') || model.includes('1075'))
  if (isEicher1075HSD) {
    const o: SpecOverride = { price: 950000, yearMonth: '11/2018', kms: 229537, hp: 110 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  // Keep cards aligned with detail page for these too (price/KMs/HP).
  const isEicherPro2110L = name.includes('2110') && (name.includes('2110l') || model.includes('2110l'))
  if (isEicherPro2110L) {
    const o: SpecOverride = { price: 1475000, yearMonth: '11/2022', kms: 240551, hp: 160 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isBajajMaximaCNG = name.includes('bajaj') && name.includes('maxima') && name.includes('cng')
  if (isBajajMaximaCNG) {
    return { price: 260000, kms: 7136, hp: 10 }
  }

  const isSmlIsuzuZT54 = name.includes('zt54') && name.includes('sml')
  if (isSmlIsuzuZT54) {
    const o: SpecOverride = { price: 630000, yearMonth: '04/2017', kms: 229537 }
    o.year = parseYearFromYearMonth(o.yearMonth)
    return o
  }

  const isMahindraBolero = (truck.name || '') === 'Mahindra Bolero Maxitruck Plus'
  if (isMahindraBolero) {
    return { price: 630000 }
  }

  // Tata Ace Gold (7908) (detail page uses this override)
  const isTataAceGold7908 =
    (truck.name || '') === 'Tata Ace Gold (7908)' ||
    (name.includes('tata ace gold') && name.includes('7908'))
  if (isTataAceGold7908) {
    return { price: 250000, year: 2019, kms: 116509, hp: 15.54 }
  }

  return null
}

