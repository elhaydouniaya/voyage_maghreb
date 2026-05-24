/** Taux indicatif affichage — les prix en base restent en EUR. */
const EUR_TO_MAD = Number(process.env.NEXT_PUBLIC_EUR_TO_MAD || "11");

export function eurToMad(amountEur: number): number {
  return Math.round(amountEur * EUR_TO_MAD);
}

export function formatPrice(amountEur: number): string {
  const mad = eurToMad(amountEur);
  return `${mad.toLocaleString("fr-FR")} MAD (~${Math.round(amountEur).toLocaleString("fr-FR")} €)`;
}

export function formatPriceShort(amountEur: number): string {
  return `${eurToMad(amountEur).toLocaleString("fr-FR")} MAD`;
}

export function formatDeposit(amountEur: number): string {
  return formatPriceShort(amountEur);
}

/** Budget sliders / labels — MAD primary, EUR hint in parentheses. */
export function formatBudgetMad(amountEur: number): string {
  const mad = eurToMad(amountEur);
  if (amountEur >= 5000) {
    return `${mad.toLocaleString("fr-FR")}+ MAD`;
  }
  return `${mad.toLocaleString("fr-FR")} MAD`;
}
