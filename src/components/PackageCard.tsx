import { Package, Tag, Clock, Activity } from 'lucide-react';
import type { PackageSummary } from '../services/api';
import { timeAgo } from '../services/api';

interface PackageCardProps {
    pkg: PackageSummary;
    onClick: () => void;
}

export function PackageCard({ pkg, onClick }: PackageCardProps) {
    const latestVersion = pkg.latest_version || '—';
    const description = pkg.description || 'A DataKit private package';

    // Parse scope and name
    const parts = pkg.name.split('/');
    const scope = parts.length > 1 ? parts[0] + '/' : '';
    const name = parts.length > 1 ? parts[1] : parts[0];

    return (
        <div className="package-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
            <div className="package-card__header">
                <div className="package-card__name">
                    {scope && <span className="package-card__scope">{scope}</span>}
                    {name}
                </div>
                <span className="package-card__badge">v{latestVersion}</span>
            </div>
            <div className="package-card__description">{description}</div>
            <div className="package-card__meta">
                <span className="package-card__meta-item">
                    <Package size={14} />
                    {pkg.version_count} version{pkg.version_count !== 1 ? 's' : ''}
                </span>
                <span className="package-card__meta-item">
                    <Tag size={14} />
                    v{latestVersion}
                </span>
                {pkg.build_count > 0 && (
                    <span className="package-card__meta-item">
                        <Activity size={14} />
                        {pkg.build_count} build{pkg.build_count !== 1 ? 's' : ''}
                    </span>
                )}
                <span className="package-card__meta-item">
                    <Clock size={14} />
                    {timeAgo(pkg.updated_at)}
                </span>
            </div>
        </div>
    );
}
