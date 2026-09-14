import { useLang } from '../lib/i18n';
import { whatsappLink } from '../lib/whatsapp';

// Floating on every page, bottom-right — a direct line to BEN, the same
// WhatsApp AI assistant that already handles the full booking flow (see
// prompts/whatsapp-agent-system-prompt.md in the backend repo). This is
// just a click-to-chat entry point; the actual conversation logic lives
// entirely in that agent, not here.
export function WhatsAppWidget() {
  const { t } = useLang();
  return (
    <a
      href={whatsappLink(t('benGreeting'))}
      target="_blank"
      rel="noreferrer"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none'
      }}
      aria-label={t('chatWithBen')}
    >
      <span
        style={{
          background: 'var(--white)',
          color: 'var(--navy)',
          borderRadius: 12,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          whiteSpace: 'nowrap'
        }}
      >
        {t('benGreeting')}
      </span>
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
        }}
      >
        🤖
      </span>
    </a>
  );
}
