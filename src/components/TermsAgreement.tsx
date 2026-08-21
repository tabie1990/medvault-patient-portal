import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n';
import * as api from '../lib/api';

interface TermsAgreementProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Fetches the current terms text from the server rather than bundling it
 * into the frontend — the backend's legal.service.ts is the one place
 * TERMS_VERSION and the actual wording live, so this component (and
 * every registration page using it) always shows whatever is actually
 * live server-side, not a copy that can drift out of sync.
 */
export function TermsAgreement({ checked, onChange }: TermsAgreementProps) {
  const { t, lang } = useLang();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTerms(lang === 'fr' ? 'fr' : 'en')
      .then((res) => setText(res.text))
      .finally(() => setLoading(false));
  }, [lang]);

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          maxHeight: 160,
          overflowY: 'auto',
          padding: '10px 12px',
          fontSize: 12,
          lineHeight: 1.6,
          color: 'var(--ink-soft)',
          background: '#FAF9F6',
          border: '1px solid var(--line)',
          borderRadius: 8,
          whiteSpace: 'pre-wrap'
        }}
      >
        {loading ? '…' : text}
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, fontSize: 13, color: 'var(--navy)', cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 2 }} />
        <span>{t('agreeToTerms')}</span>
      </label>
    </div>
  );
}
