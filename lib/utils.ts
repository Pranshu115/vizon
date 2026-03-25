import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build a single location line for browse cards when DB fields are partial or missing. */
export function formatTruckListingLocation(truck: {
  location?: string | null
  city?: string | null
  state?: string | null
  rto?: string | null
}): string {
  const loc = truck.location?.trim()
  if (loc) return loc
  const city = truck.city?.trim()
  const state = truck.state?.trim()
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  const rto = truck.rto?.trim()
  if (rto) return rto
  return 'Unknown'
}


