import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

export function Toast({ message, visible }: { message: string; visible: boolean }) {
    return (
        <div className={`toast ${visible ? 'toast--visible' : ''}`}>
            <Check size={16} />
            {message}
        </div>
    );
}

export function useCopyToClipboard() {
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const copy = useCallback(async (text: string, label?: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setToast({ message: label || 'Copied to clipboard!', visible: true });
            setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setToast({ message: label || 'Copied!', visible: true });
            setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
        }
    }, []);

    return { toast, copy };
}

export function CopyButton({ text, label, size = 'normal' }: { text: string; label?: string; size?: 'normal' | 'sm' }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            className={`btn ${size === 'sm' ? 'btn--ghost btn--sm' : 'btn--secondary'}`}
            onClick={handleCopy}
            title={`Copy: ${text}`}
        >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {label && <span>{copied ? 'Copied!' : label}</span>}
        </button>
    );
}
