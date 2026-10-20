// The former live-demo harness is retired. Exercise real authentication/RLS in
// the existing strictly loopback, empty PostgreSQL-16 database gate instead.
// It refuses production or nonempty databases and never provisions a demo route.
await import('./api-tenant-postgres-test.mjs');
