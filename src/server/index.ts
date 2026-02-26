import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, count } from 'drizzle-orm';
import * as schema from './schema';

type Bindings = {
    DATAKITNPMREGISTRYR2: R2Bucket;
    DATAKITNPMREGISTRYD1: D1Database;
    ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- Self-healing DB setup (creates tables if they don't exist) ---
async function ensureTables(d1: D1Database) {
    await d1.batch([
        d1.prepare(`CREATE TABLE IF NOT EXISTS packages (
            name TEXT PRIMARY KEY,
            description TEXT,
            latest_version TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`),
        d1.prepare(`CREATE TABLE IF NOT EXISTS versions (
            package_name TEXT,
            version TEXT,
            metadata JSON,
            tarball_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (package_name, version),
            FOREIGN KEY (package_name) REFERENCES packages(name)
        )`),
        d1.prepare(`CREATE TABLE IF NOT EXISTS dist_tags (
            package_name TEXT,
            tag TEXT,
            version TEXT,
            PRIMARY KEY (package_name, tag),
            FOREIGN KEY (package_name) REFERENCES packages(name)
        )`),
        d1.prepare(`CREATE TABLE IF NOT EXISTS stats (
            package_name TEXT PRIMARY KEY,
            build_count INTEGER DEFAULT 0,
            FOREIGN KEY (package_name) REFERENCES packages(name)
        )`),
    ]);
}

// Ensure tables exist before any API call
app.use('/api/*', async (c, next) => {
    await ensureTables(c.env.DATAKITNPMREGISTRYD1);
    await next();
});


// Health check
app.get('/api/status', async (c) => {
    try {
        const db = drizzle(c.env.DATAKITNPMREGISTRYD1, { schema });
        const pkgs = await db.select({ count: count() }).from(schema.packages);
        return c.json({
            status: 'ONLINE',
            database: 'READY',
            packages: pkgs[0]?.count ?? 0,
        });
    } catch (e: any) {
        return c.json({ status: 'ONLINE', database: 'ERROR', message: e.message }, 500);
    }
});

// Aggregate stats
app.get('/api/stats', async (c) => {
    const db = drizzle(c.env.DATAKITNPMREGISTRYD1, { schema });

    const [pkgCount] = await db.select({ count: count() }).from(schema.packages);
    const [verCount] = await db.select({ count: count() }).from(schema.versions);
    const [tagCount] = await db.select({ count: count() }).from(schema.distTags);
    const [buildSum] = await db.select({
        total: sql<number>`COALESCE(SUM(${schema.stats.build_count}), 0)`,
    }).from(schema.stats);

    return c.json({
        totalPackages: pkgCount?.count ?? 0,
        totalVersions: verCount?.count ?? 0,
        totalDistTags: tagCount?.count ?? 0,
        totalBuilds: buildSum?.total ?? 0,
    });
});

// List all packages with enriched data
app.get('/api/packages', async (c) => {
    const db = drizzle(c.env.DATAKITNPMREGISTRYD1, { schema });

    const allPackages = await db.select().from(schema.packages);
    const allStats = await db.select().from(schema.stats);
    const allVersions = await db.select({
        package_name: schema.versions.package_name,
        count: count(),
    }).from(schema.versions).groupBy(schema.versions.package_name);
    const allTags = await db.select().from(schema.distTags);

    const statsMap = new Map(allStats.map((s) => [s.package_name, s.build_count ?? 0]));
    const versionCountMap = new Map(allVersions.map((v) => [v.package_name, v.count]));
    const tagsMap = new Map<string, Record<string, string>>();
    for (const t of allTags) {
        if (!tagsMap.has(t.package_name)) tagsMap.set(t.package_name, {});
        tagsMap.get(t.package_name)![t.tag] = t.version;
    }

    const enriched = allPackages.map((pkg) => ({
        name: pkg.name,
        description: pkg.description,
        latest_version: pkg.latest_version,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
        build_count: statsMap.get(pkg.name) ?? 0,
        version_count: versionCountMap.get(pkg.name) ?? 0,
        dist_tags: tagsMap.get(pkg.name) ?? {},
    }));

    return c.json(enriched);
});

// Package detail (supports scoped names like @scope/name)
app.get('/api/packages/:name{.+}', async (c) => {
    const name = decodeURIComponent(c.req.param('name'));
    const db = drizzle(c.env.DATAKITNPMREGISTRYD1, { schema });

    const [pkg] = await db.select().from(schema.packages).where(eq(schema.packages.name, name));
    if (!pkg) return c.json({ error: 'Package not found' }, 404);

    const pkgVersions = await db
        .select()
        .from(schema.versions)
        .where(eq(schema.versions.package_name, name));

    const pkgTags = await db
        .select()
        .from(schema.distTags)
        .where(eq(schema.distTags.package_name, name));

    const [pkgStats] = await db
        .select()
        .from(schema.stats)
        .where(eq(schema.stats.package_name, name));

    // Build versions map with parsed metadata
    const versionsData = pkgVersions.map((v) => {
        let meta: any = {};
        try {
            meta = v.metadata ? JSON.parse(v.metadata) : {};
        } catch { /* ignore parse errors */ }
        return {
            version: v.version,
            metadata: meta,
            tarball_path: v.tarball_path,
            created_at: v.created_at,
        };
    });

    const tagsData: Record<string, string> = {};
    for (const t of pkgTags) {
        tagsData[t.tag] = t.version;
    }

    return c.json({
        name: pkg.name,
        description: pkg.description,
        latest_version: pkg.latest_version,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
        build_count: pkgStats?.build_count ?? 0,
        dist_tags: tagsData,
        versions: versionsData,
    });
});

// ---------- SPA Fallback ----------
app.all('*', async (c) => {
    try {
        return await c.env.ASSETS.fetch(c.req.raw);
    } catch {
        return c.notFound();
    }
});

export default app;
