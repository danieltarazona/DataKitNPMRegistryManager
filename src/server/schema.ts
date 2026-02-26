import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- packages ---
export const packages = sqliteTable('packages', {
    name: text('name').primaryKey(),
    description: text('description'),
    latest_version: text('latest_version'),
    created_at: text('created_at'),
    updated_at: text('updated_at'),
});

// --- versions ---
export const versions = sqliteTable('versions', {
    package_name: text('package_name')
        .notNull()
        .references(() => packages.name),
    version: text('version').notNull(),
    metadata: text('metadata'), // JSON string
    tarball_path: text('tarball_path'),
    created_at: text('created_at'),
});

// --- dist_tags ---
export const distTags = sqliteTable('dist_tags', {
    package_name: text('package_name')
        .notNull()
        .references(() => packages.name),
    tag: text('tag').notNull(),
    version: text('version').notNull(),
});

// --- stats ---
export const stats = sqliteTable('stats', {
    package_name: text('package_name')
        .primaryKey()
        .references(() => packages.name),
    build_count: integer('build_count').default(0),
});
