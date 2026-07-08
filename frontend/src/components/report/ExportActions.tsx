import React, { useState } from 'react';
import { buildApiUrl } from '../../lib/api';

interface ExportActionsProps {
  reportUrl: string;
}

export default function ExportActions({ reportUrl }: ExportActionsProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // PDF: weasyprint server-side PDF isn't available on Windows (needs GTK).
  // Use the browser's native print-to-PDF instead — reliable and cross-platform.
  function printPdf() {
    window.print();
  }

  // JSON: fetch the audit and download it as a real .json file.
  async function downloadJson() {
    setBusy('json');
    try {
      const res = await fetch(buildApiUrl('/audit', { url: reportUrl }));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `rankai-audit-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      alert('Could not download JSON: ' + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // Copy: shareable report link, with a fallback for non-secure contexts.
  async function copyLink() {
    const shareUrl = `${window.location.origin}/report/audit/?url=${encodeURIComponent(reportUrl)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch {
        /* ignore */
      }
      ta.remove();
    } finally {
      setTimeout(() => setCopied(false), 1800);
    }
  }

  const btnClass =
    'inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg-base text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent-teal/30 hover:bg-bg-subtle/50 transition-colors disabled:opacity-60';

  return (
    <div className="flex flex-col gap-1.5">
      <button onClick={printPdf} className={btnClass}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Save as PDF
      </button>

      <button onClick={downloadJson} disabled={busy === 'json'} className={btnClass}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        {busy === 'json' ? 'Preparing…' : 'Download JSON'}
      </button>

      <button onClick={copyLink} className={btnClass}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
