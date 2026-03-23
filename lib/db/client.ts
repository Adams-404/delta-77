import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// We'll use a placeholder URL if not provided to avoid crash during setup
const connectionString = process.env.DATABASE_URL || 'postgres://placeholder:placeholder@localhost:5432/placeholder';

import * as schema from './schema';

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
