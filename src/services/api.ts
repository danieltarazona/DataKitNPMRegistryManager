// DataKit NPM Registry Manager — API Service
// Communicates with the local Hono API (same worker, D1 backend)

export interface PackageSummary {
    name: string;
    description: string | null;
    latest_version: string | null;
    created_at: string | null;
    updated_at: string | null;
    build_count: number;
    version_count: number;
    dist_tags: Record<string, string>;
}

export interface VersionDetail {
    version: string;
    metadata: VersionMetadata;
    tarball_path: string | null;
    created_at: string | null;
}

export interface VersionMetadata {
    name?: string;
    version?: string;
    description?: string;
    main?: string;
    types?: string;
    module?: string;
    exports?: Record<string, any>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    keywords?: string[];
    license?: string;
    author?: string | { name?: string; email?: string };
    repository?: string | { type?: string; url?: string };
    homepage?: string;
    bugs?: string | { url?: string };
    engines?: Record<string, string>;
    files?: string[];
    dist?: {
        tarball: string;
        shasum?: string;
        integrity?: string;
    };
    [key: string]: unknown;
}

export interface PackageDetail {
    name: string;
    description: string | null;
    latest_version: string | null;
    created_at: string | null;
    updated_at: string | null;
    build_count: number;
    dist_tags: Record<string, string>;
    versions: VersionDetail[];
}

export interface RegistryStatus {
    status: string;
    database: string;
    packages: number;
    message?: string;
}

export interface RegistryStats {
    totalPackages: number;
    totalVersions: number;
    totalDistTags: number;
    totalBuilds: number;
}

// ---------- API Calls ----------

export async function getRegistryStatus(): Promise<RegistryStatus> {
    const res = await fetch('/api/status');
    return res.json();
}

export async function getRegistryStats(): Promise<RegistryStats> {
    const res = await fetch('/api/stats');
    return res.json();
}

export async function getAllPackages(): Promise<PackageSummary[]> {
    const res = await fetch('/api/packages');
    return res.json();
}

export async function getPackageDetail(name: string): Promise<PackageDetail> {
    const res = await fetch(`/api/packages/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`Package "${name}" not found`);
    return res.json();
}

// ---------- Utility ----------

export function getTarballUrl(name: string, version: string): string {
    // Uses the DataKitNPMRegistry worker for tarball downloads
    const registryUrl = import.meta.env.VITE_REGISTRY_URL || 'https://datakitnpmregistry.datakit.workers.dev';
    return `${registryUrl}/${name}/tarball/${version}`;
}

export function getLatestTarballUrl(name: string): string {
    return getTarballUrl(name, 'latest');
}

export function timeAgo(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) return `${diffYear}y ago`;
    if (diffMonth > 0) return `${diffMonth}mo ago`;
    if (diffWeek > 0) return `${diffWeek}w ago`;
    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
}

export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
