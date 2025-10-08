import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatCurrency(amount: number, currency: string = "BDT") {
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function formatNumber(number: number) {
  return new Intl.NumberFormat("bn-BD").format(number)
}
