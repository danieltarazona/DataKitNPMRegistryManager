import { Link } from 'react-router-dom';
import { Box } from 'lucide-react';

interface NavbarProps {
    registryOnline: boolean | null;
}

export function Navbar({ registryOnline }: NavbarProps) {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar__brand">
                <div className="navbar__brand-icon">
                    <Box size={18} />
                </div>
                DataKit Registry
            </Link>
            <div className="navbar__actions">
                <div className="navbar__status">
                    <span
                        className={`navbar__status-dot ${registryOnline === false ? 'navbar__status-dot--offline' : ''}`}
                    />
                    {registryOnline === null
                        ? 'Checking...'
                        : registryOnline
                            ? 'Registry Online'
                            : 'Registry Offline'}
                </div>
            </div>
        </nav>
    );
}
