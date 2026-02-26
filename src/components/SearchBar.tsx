import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search packages...' }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                inputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, []);

    return (
        <div className="search-bar">
            <Search className="search-bar__icon" size={18} />
            <input
                ref={inputRef}
                id="search-packages"
                type="text"
                className="search-bar__input"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete="off"
            />
            <span className="search-bar__shortcut">/</span>
        </div>
    );
}
