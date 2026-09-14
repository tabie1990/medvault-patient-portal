// The real WhatsApp booking number, as already publicized on the
// Back-to-School Plus marketing graphic ("Book on WhatsApp 677 296 397").
// Staging deliberately has no WhatsApp credentials configured (so testing
// there can never reach a real patient — see CLAUDE.md), so this couldn't
// be confirmed by querying Meta's API against this environment; flag to
// the team if the AI agent's actual number ever differs from this one.
export const WHATSAPP_NUMBER = '237677296397';

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
