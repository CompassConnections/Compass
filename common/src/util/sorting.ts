import {MAX_INT} from "common/constants";

export function getSortedOptions(options: string[], order: string[] | Record<string, string>) {
  let parsedOrder: string[]
  if (Array.isArray(order)) {
    parsedOrder = order
  } else {
    parsedOrder = Object.keys(order)
  }
  return options
    .slice()
    .sort((a, b) => {
      const ia = parsedOrder.indexOf(a as any)
      const ib = parsedOrder.indexOf(b as any)
      const sa = ia === -1 ? MAX_INT : ia
      const sb = ib === -1 ? MAX_INT : ib
      if (sa !== sb) return sa - sb
      return String(a).localeCompare(String(b))
    });
}