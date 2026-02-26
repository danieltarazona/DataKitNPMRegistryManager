import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Download, Package, Tag, Clock, FileCode2,
    Activity, Hash, Calendar, ChevronDown, ChevronRight,
    Terminal, Copy, Check, Layers, Info, Code2, Box
} from 'lucide-react';
import {
    getPackageDetail, getTarballUrl, getLatestTarballUrl,
    type PackageDetail, type VersionDetail, type VersionMetadata,
    timeAgo, formatDate
} from '../services/api';
import { CopyButton } from '../components/Toast';

type Tab = 'overview' | 'versions' | 'dependencies' | 'metadata';

export function PackageView() {
    const { name } = useParams<{ name: string }>();
    const decodedName = decodeURIComponent(name || '');
    const navigate = useNavigate();

    const [pkg, setPkg] = useState<PackageDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [installManager, setInstallManager] = useState<'pnpm' | 'npm' | 'yarn'>('pnpm');

    useEffect(() => {
        if (!decodedName) return;
        setLoading(true);
        setError(null);
        getPackageDetail(decodedName)
            .then(setPkg)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [decodedName]);

    if (loading) {
        return (
            <div className="main-content">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <span>Loading package details…</span>
                </div>
            </div>
        );
    }

    if (error || !pkg) {
        return (
            <div className="main-content">
                <div className="empty-state">
                    <div className="empty-state__icon">⚠️</div>
                    <div className="empty-state__title">Package not found</div>
                    <p>{error || `"${decodedName}" could not be loaded.`}</p>
                    <button className="btn btn--secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const latestVersion = pkg.latest_version || (pkg.versions.length > 0 ? pkg.versions[0].version : '');
    const latestVersionData = pkg.versions.find((v) => v.version === latestVersion);
    const latestMeta = latestVersionData?.metadata || {};
    const versions = [...pkg.versions].sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true })
    );

    const distTags = pkg.dist_tags || {};

    // Parse scope
    const parts = decodedName.split('/');
    const scope = parts.length > 1 ? parts[0] + '/' : '';
    const shortName = parts.length > 1 ? parts[1] : parts[0];

    // Install commands
    const installCommands = {
        pnpm: `pnpm add ${decodedName}`,
        npm: `npm install ${decodedName}`,
        yarn: `yarn add ${decodedName}`,
    };
    const pkgJsonDep = `"${decodedName}": "${latestVersion}"`;

    return (
        <div className="main-content">
            <div className="package-detail">
                {/* Back */}
                <button className="package-detail__back" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} /> Back to packages
                </button>

                {/* Header */}
                <div className="package-detail__header">
                    <div>
                        <h1 className="package-detail__title">
                            {scope && <span className="package-detail__scope">{scope}</span>}
                            {shortName}
                        </h1>
                        <div className="package-detail__version-badge">
                            Latest: v{latestVersion}
                        </div>
                        {pkg.description && (
                            <p style={{ color: 'var(--dk-text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                                {pkg.description}
                            </p>
                        )}
                    </div>
                    <div className="package-detail__actions">
                        <CopyButton text={pkgJsonDep} label="Copy for package.json" />
                        <a
                            className="btn btn--primary"
                            href={getLatestTarballUrl(decodedName)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Download size={16} /> Download Latest .tgz
                        </a>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="info-grid">
                    <div className="info-card">
                        <div className="info-card__label">
                            <Layers size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                            Versions Published
                        </div>
                        <div className="info-card__value">{versions.length}</div>
                    </div>
                    <div className="info-card">
                        <div className="info-card__label">
                            <Activity size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                            Build Count
                        </div>
                        <div className="info-card__value">{pkg.build_count}</div>
                    </div>
                    <div className="info-card">
                        <div className="info-card__label">
                            <Tag size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                            Dist Tags
                        </div>
                        <div className="info-card__value">
                            {Object.entries(distTags).map(([tag, v]) => (
                                <span key={tag} className="detail-tag">
                                    <span className="detail-tag__name">{tag}</span>
                                    <span className="detail-tag__version">{v}</span>
                                </span>
                            ))}
                            {Object.keys(distTags).length === 0 && '—'}
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-card__label">
                            <Calendar size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                            Created
                        </div>
                        <div className="info-card__value" style={{ fontSize: '0.9rem' }}>
                            {formatDate(pkg.created_at)}
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-card__label">
                            <Clock size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                            Last Updated
                        </div>
                        <div className="info-card__value" style={{ fontSize: '0.9rem' }}>
                            {formatDate(pkg.updated_at)}
                            <span style={{ color: 'var(--dk-text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                                ({timeAgo(pkg.updated_at)})
                            </span>
                        </div>
                    </div>
                    {latestMeta.main && (
                        <div className="info-card">
                            <div className="info-card__label">
                                <FileCode2 size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                                Entry Point
                            </div>
                            <div className="info-card__value" style={{ fontFamily: 'var(--dk-font-mono)', fontSize: '0.85rem' }}>
                                {latestMeta.main}
                            </div>
                        </div>
                    )}
                    {latestMeta.types && (
                        <div className="info-card">
                            <div className="info-card__label">Types</div>
                            <div className="info-card__value" style={{ fontFamily: 'var(--dk-font-mono)', fontSize: '0.85rem' }}>
                                {latestMeta.types}
                            </div>
                        </div>
                    )}
                    {latestMeta.license && (
                        <div className="info-card">
                            <div className="info-card__label">License</div>
                            <div className="info-card__value">{latestMeta.license}</div>
                        </div>
                    )}
                </div>

                {/* Install Box with Package Manager Tabs */}
                <div className="install-box">
                    <div className="install-box__tabs">
                        {(['pnpm', 'npm', 'yarn'] as const).map((pm) => (
                            <button
                                key={pm}
                                className={`install-box__tab ${installManager === pm ? 'install-box__tab--active' : ''}`}
                                onClick={() => setInstallManager(pm)}
                            >
                                <Terminal size={13} />
                                {pm}
                            </button>
                        ))}
                    </div>
                    <div className="install-box__row">
                        <div className="install-box__command">{installCommands[installManager]}</div>
                        <CopyButton text={installCommands[installManager]} label="Copy" />
                    </div>
                </div>

                {/* package.json snippet */}
                <div className="install-box" style={{ marginBottom: '2rem' }}>
                    <div className="install-box__label">package.json dependency</div>
                    <div className="install-box__row">
                        <div className="install-box__command">{pkgJsonDep}</div>
                        <CopyButton text={pkgJsonDep} label="Copy" />
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tab-nav">
                    {([
                        { key: 'overview', icon: Info, label: 'Overview' },
                        { key: 'versions', icon: Tag, label: `Versions (${versions.length})` },
                        { key: 'dependencies', icon: Box, label: 'Dependencies' },
                        { key: 'metadata', icon: Code2, label: 'Metadata' },
                    ] as const).map(({ key, icon: Icon, label }) => (
                        <button
                            key={key}
                            className={`tab-nav__item ${activeTab === key ? 'tab-nav__item--active' : ''}`}
                            onClick={() => setActiveTab(key)}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <OverviewTab pkg={pkg} latestMeta={latestMeta} latestVersion={latestVersion} decodedName={decodedName} />
                    )}
                    {activeTab === 'versions' && (
                        <VersionsTab versions={versions} distTags={distTags} decodedName={decodedName} />
                    )}
                    {activeTab === 'dependencies' && (
                        <DependenciesTab metadata={latestMeta} />
                    )}
                    {activeTab === 'metadata' && (
                        <MetadataTab versions={versions} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------- Tab: Overview ----------
function OverviewTab({ pkg, latestMeta, latestVersion, decodedName }: {
    pkg: PackageDetail;
    latestMeta: VersionMetadata;
    latestVersion: string;
    decodedName: string;
}) {
    return (
        <div>
            {/* Keywords */}
            {latestMeta.keywords && latestMeta.keywords.length > 0 && (
                <section className="section">
                    <div className="section__header">
                        <h3 className="section__title">
                            <Hash className="section__title-icon" size={16} />
                            Keywords
                        </h3>
                    </div>
                    <div className="keywords-list">
                        {latestMeta.keywords.map((kw) => (
                            <span key={kw} className="keyword-tag">{kw}</span>
                        ))}
                    </div>
                </section>
            )}

            {/* Links */}
            {(latestMeta.homepage || latestMeta.repository || latestMeta.bugs) && (
                <section className="section">
                    <div className="section__header">
                        <h3 className="section__title">Links</h3>
                    </div>
                    <div className="links-list">
                        {latestMeta.homepage && (
                            <a href={latestMeta.homepage as string} target="_blank" rel="noreferrer" className="link-item">
                                Homepage
                            </a>
                        )}
                        {latestMeta.repository && (
                            <a
                                href={typeof latestMeta.repository === 'string' ? latestMeta.repository : (latestMeta.repository as any)?.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="link-item"
                            >
                                Repository
                            </a>
                        )}
                        {latestMeta.bugs && (
                            <a
                                href={typeof latestMeta.bugs === 'string' ? latestMeta.bugs : (latestMeta.bugs as any)?.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="link-item"
                            >
                                Bug Tracker
                            </a>
                        )}
                    </div>
                </section>
            )}

            {/* Exports */}
            {latestMeta.exports && Object.keys(latestMeta.exports).length > 0 && (
                <section className="section">
                    <div className="section__header">
                        <h3 className="section__title">
                            <FileCode2 className="section__title-icon" size={16} />
                            Exports
                        </h3>
                    </div>
                    <div className="info-card">
                        <pre className="metadata-json">{JSON.stringify(latestMeta.exports, null, 2)}</pre>
                    </div>
                </section>
            )}

            {/* Engines */}
            {latestMeta.engines && Object.keys(latestMeta.engines).length > 0 && (
                <section className="section">
                    <div className="section__header">
                        <h3 className="section__title">Engines</h3>
                    </div>
                    <div className="info-card">
                        <ul className="deps-list">
                            {Object.entries(latestMeta.engines).map(([eng, ver]) => (
                                <li key={eng} className="deps-list__item">
                                    <span className="deps-list__name">{eng}</span>
                                    <span className="deps-list__version">{ver}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* Files */}
            {latestMeta.files && latestMeta.files.length > 0 && (
                <section className="section">
                    <div className="section__header">
                        <h3 className="section__title">
                            <FileCode2 className="section__title-icon" size={16} />
                            Published Files
                        </h3>
                    </div>
                    <div className="info-card">
                        <ul className="files-list">
                            {latestMeta.files.map((f) => (
                                <li key={f} className="files-list__item">
                                    <FileCode2 size={13} />
                                    <code>{f}</code>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* Quick Dependencies Preview */}
            {latestMeta.dependencies && Object.keys(latestMeta.dependencies).length > 0 && (
                <section className="section">
                    <div className="section__header">
                        <h3 className="section__title">
                            <Package className="section__title-icon" size={16} />
                            Dependencies ({Object.keys(latestMeta.dependencies).length})
                        </h3>
                    </div>
                    <div className="info-card">
                        <ul className="deps-list">
                            {Object.entries(latestMeta.dependencies).slice(0, 10).map(([dep, ver]) => (
                                <li key={dep} className="deps-list__item">
                                    <span className="deps-list__name">{dep}</span>
                                    <span className="deps-list__version">{ver}</span>
                                </li>
                            ))}
                        </ul>
                        {Object.keys(latestMeta.dependencies).length > 10 && (
                            <p style={{ color: 'var(--dk-text-muted)', fontSize: '0.8rem', padding: '0.5rem 0 0' }}>
                                … and {Object.keys(latestMeta.dependencies).length - 10} more
                            </p>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

// ---------- Tab: Versions ----------
function VersionsTab({ versions, distTags, decodedName }: {
    versions: VersionDetail[];
    distTags: Record<string, string>;
    decodedName: string;
}) {
    return (
        <section className="section versions-section">
            <table className="versions-table">
                <thead>
                    <tr>
                        <th>Version</th>
                        <th>Tags</th>
                        <th>Published</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {versions.map((v) => {
                        const tags = Object.entries(distTags)
                            .filter(([, ver]) => ver === v.version)
                            .map(([t]) => t);

                        return (
                            <tr key={v.version}>
                                <td>
                                    <span className="versions-table__version">{v.version}</span>
                                </td>
                                <td>
                                    {tags.map((t) => (
                                        <span key={t} className="versions-table__tag">{t}</span>
                                    ))}
                                </td>
                                <td>
                                    <span style={{ color: 'var(--dk-text-muted)', fontSize: '0.82rem' }}>
                                        {formatDate(v.created_at)}
                                    </span>
                                </td>
                                <td>
                                    <div className="versions-table__actions">
                                        <CopyButton
                                            text={`"${decodedName}": "${v.version}"`}
                                            size="sm"
                                            label="Copy"
                                        />
                                        <a
                                            className="btn btn--ghost btn--sm"
                                            href={getTarballUrl(decodedName, v.version)}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Download size={14} /> .tgz
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {versions.length === 0 && (
                <div className="empty-state" style={{ padding: '2rem' }}>
                    <p>No versions published yet.</p>
                </div>
            )}
        </section>
    );
}

// ---------- Tab: Dependencies ----------
function DependenciesTab({ metadata }: { metadata: VersionMetadata }) {
    const deps = metadata.dependencies || {};
    const devDeps = metadata.devDependencies || {};
    const peerDeps = metadata.peerDependencies || {};

    const hasDeps = Object.keys(deps).length > 0;
    const hasDevDeps = Object.keys(devDeps).length > 0;
    const hasPeerDeps = Object.keys(peerDeps).length > 0;
    const hasAny = hasDeps || hasDevDeps || hasPeerDeps;

    if (!hasAny) {
        return (
            <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state__icon">📦</div>
                <div className="empty-state__title">No dependencies</div>
                <p>This package has no declared dependencies.</p>
            </div>
        );
    }

    return (
        <div>
            {hasDeps && (
                <DepsSection title="Dependencies" deps={deps} icon={<Package size={16} />} />
            )}
            {hasDevDeps && (
                <DepsSection title="Dev Dependencies" deps={devDeps} icon={<Code2 size={16} />} />
            )}
            {hasPeerDeps && (
                <DepsSection title="Peer Dependencies" deps={peerDeps} icon={<Layers size={16} />} />
            )}
        </div>
    );
}

function DepsSection({ title, deps, icon }: { title: string; deps: Record<string, string>; icon: React.ReactNode }) {
    return (
        <section className="section">
            <div className="section__header">
                <h3 className="section__title">
                    <span className="section__title-icon">{icon}</span>
                    {title} ({Object.keys(deps).length})
                </h3>
            </div>
            <div className="info-card">
                <ul className="deps-list">
                    {Object.entries(deps).map(([dep, ver]) => (
                        <li key={dep} className="deps-list__item">
                            <span className="deps-list__name">{dep}</span>
                            <span className="deps-list__version">{ver}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

// ---------- Tab: Metadata ----------
function MetadataTab({ versions }: { versions: VersionDetail[] }) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggle = (version: string) => {
        setExpanded((prev) => ({ ...prev, [version]: !prev[version] }));
    };

    return (
        <div>
            {versions.map((v) => (
                <div key={v.version} className="metadata-accordion">
                    <button
                        className="metadata-accordion__header"
                        onClick={() => toggle(v.version)}
                    >
                        <span className="metadata-accordion__version">
                            {expanded[v.version] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            v{v.version}
                        </span>
                        <span className="metadata-accordion__date">
                            {formatDate(v.created_at)}
                        </span>
                    </button>
                    {expanded[v.version] && (
                        <div className="metadata-accordion__body">
                            <pre className="metadata-json">
                                {JSON.stringify(v.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            ))}
            {versions.length === 0 && (
                <div className="empty-state" style={{ padding: '2rem' }}>
                    <p>No version metadata available.</p>
                </div>
            )}
        </div>
    );
}
