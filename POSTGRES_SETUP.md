# PostgreSQL Setup

Dev saat ini pakai SQLite (`file:./dev.db`). Untuk pindah ke PostgreSQL:

## 1. Jalankan PostgreSQL (opsi)

**Docker:**
```bash
docker compose up -d
```

Atau pakai managed (Supabase / Neon / Railway) dan ambil `DATABASE_URL`-nya.

## 2. Ganti provider di schema

File `prisma/schema.prisma`, baris datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 3. Set env

`.env`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/ai_trading?schema=public"
```
Pastikan var sqlite `DATABASE_URL` ditimpa (bukan `file:`).

## 4. Migrasi

```bash
npm run db:migrate        # db push untuk dev/staging
npm run db:migrate:prod   # migrate deploy untuk production
```

## Catatan

- Semua model kompatibel Postgres (UUID, DateTime, Float, index).
- SQLite tetap default untuk dev lokal tanpa Docker.
- `docker-compose.yml` menyediakan Postgres 15 lokal jika Docker tersedia.
