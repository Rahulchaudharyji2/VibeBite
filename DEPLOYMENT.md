# Deployment Guide

## Database Configuration

This project uses `@prisma/adapter-pg` to connect to the database. This setup is compatible with standard PostgreSQL connection strings and is optimized for serverless environments like Vercel.

### Environment Variables

Ensure your production environment variables are set correctly:

- `DATABASE_URL`: Must be a standard PostgreSQL connection string starting with `postgres://` or `postgresql://`.
  - Example: `postgres://user:password@host:port/database`
  - **Important**: Do not use `prisma://` (Prisma Data Proxy) URLs with this adapter configuration unless specifically supported.

### Build Command

The build command remains standard:

```bash
npm run build
```

This will automatically generate the Prisma Client with the correct adapter support.
