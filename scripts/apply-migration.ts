/**
 * Apply migration to add first_contact_sent column
 *
 * Usage: npx ts-node scripts/apply-migration.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/services/database.service';

async function applyMigration() {
  console.log('🔄 Applying migration: Add first_contact_sent column...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DatabaseService);

  try {
    // Check if column already exists
    console.log('1️⃣ Checking if column already exists...');
    const result = await db.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'first_contact_sent'
    `;

    if (result.length > 0) {
      console.log('   ⚠️  Column already exists! Skipping migration.\n');
      await app.close();
      return;
    }

    console.log('   ✅ Column does not exist. Proceeding with migration...\n');

    // Apply migration
    console.log('2️⃣ Adding first_contact_sent column...');
    await db.$executeRaw`
      ALTER TABLE users
      ADD COLUMN first_contact_sent BOOLEAN NOT NULL DEFAULT false
    `;
    console.log('   ✅ Column added successfully!\n');

    // Verify column was added
    console.log('3️⃣ Verifying column was added...');
    const verifyResult = await db.$queryRaw<any[]>`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'first_contact_sent'
    `;

    if (verifyResult.length > 0) {
      console.log('   ✅ Column verified:');
      console.log(`      Name: ${verifyResult[0].column_name}`);
      console.log(`      Type: ${verifyResult[0].data_type}`);
      console.log(`      Default: ${verifyResult[0].column_default}\n`);
    } else {
      console.error('   ❌ ERROR: Column was not created!\n');
    }

    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!\n');

  } catch (error: any) {
    console.error('❌ MIGRATION FAILED:', error.message);
    console.error(error);
  } finally {
    await app.close();
  }
}

applyMigration();
