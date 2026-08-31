import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrderNumber(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `0${num}`;
}
