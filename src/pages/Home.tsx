import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Layers, Download, Star, Activity, Hash, Tag, Clock } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { PackageCard } from '../components/PackageCard';
import { getAllPackages, getRegistryStats, type PackageSummary, type RegistryStats } from '../services/api';

export function Home() {
    const [packages, setPackages] = useState<PackageSummary[]>([]);
    const [stats, setStats] = useState<RegistryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'updated' | 'builds'>('updated');
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            getAllPackages().catch(() => []),
            getRegistryStats().catch(() => null),
        ]).then(([pkgs, s]) => {
            setPackages(pkgs);
            setStats(s);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return packages;
        const q = search.toLowerCase();
        return packages.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
        );
    }, [packages, search]);

    const sorted = useMemo(() => {
        const list = [...filtered];
        switch (sortBy) {
            case 'name':
                return list.sort((a, b) => a.name.localeCompare(b.name));
            case 'updated':
                return list.sort((a, b) => {
                    const da = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                    const db = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                    return db - da;
                });
            case 'builds':
                return list.sort((a, b) => b.build_count - a.build_count);
            default:
                return list;
        }
    }, [filtered, sortBy]);

    const handleNavigate = (name: string) => {
        navigate(`/package/${encodeURIComponent(name)}`);
    };

    return (
        <div className="main-content">
            {/* Hero */}
            <section className="hero">
                <h1 className="hero__title">DataKit NPM Registry</h1>
                <p className="hero__subtitle">
                    Browse, search, and manage your private DataKit packages.
                    Download tarballs, copy install commands, and track versions — all in one place.
                </p>
                <div className="hero__search">
                    <SearchBar value={search} onChange={setSearch} placeholder="Search packages… (press / to focus)" />
                </div>
            </section>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-card__value">{stats?.totalPackages ?? '—'}</div>
                    <div className="stat-card__label">
                        <Package size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                        Packages
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats?.totalVersions ?? '—'}</div>
                    <div className="stat-card__label">
                        <Tag size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                        Versions
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats?.totalBuilds ?? '—'}</div>
                    <div className="stat-card__label">
                        <Activity size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                        Total Builds
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats?.totalDistTags ?? '—'}</div>
                    <div className="stat-card__label">
                        <Hash size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                        Dist Tags
                    </div>
                </div>
            </div>

            {/* Sort Controls */}
            {!loading && packages.length > 0 && (
                <div className="sort-controls">
                    <span className="sort-controls__label">Sort by:</span>
                    {(['updated', 'name', 'builds'] as const).map((key) => (
                        <button
                            key={key}
                            className={`sort-controls__btn ${sortBy === key ? 'sort-controls__btn--active' : ''}`}
                            onClick={() => setSortBy(key)}
                        >
                            {key === 'updated' && <Clock size={13} />}
                            {key === 'name' && <Layers size={13} />}
                            {key === 'builds' && <Download size={13} />}
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <span>Loading packages from D1 database…</span>
                </div>
            )}

            {/* Empty */}
            {!loading && packages.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">📦</div>
                    <div className="empty-state__title">No packages found</div>
                    <p>The registry database is empty or unreachable. Publish a package to get started.</p>
                </div>
            )}

            {/* Packages */}
            {!loading && sorted.length > 0 && (
                <section className="section">
                    <div className="section__header">
                        <h2 className="section__title">
                            <Star className="section__title-icon" size={20} />
                            Registry Packages
                            <span className="section__count">{sorted.length}</span>
                        </h2>
                    </div>
                    <div className="package-grid">
                        {sorted.map((pkg) => (
                            <PackageCard
                                key={pkg.name}
                                pkg={pkg}
                                onClick={() => handleNavigate(pkg.name)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* No results */}
            {!loading && filtered.length === 0 && packages.length > 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">🔍</div>
                    <div className="empty-state__title">No matching packages</div>
                    <p>Try a different search term.</p>
                </div>
            )}
        </div>
    );
}
