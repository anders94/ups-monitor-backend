import dotenv from 'dotenv';
dotenv.config();

import db from '../src/config/database';
import aggregationService from '../src/services/aggregation.service';
import logger from '../src/config/logger';

interface BackfillOptions {
  startDate?: Date;
  endDate?: Date;
  hourly?: boolean;
  daily?: boolean;
  weekly?: boolean;
  monthly?: boolean;
}

async function backfillAggregations(options: BackfillOptions = {}) {
  try {
    console.log('===========================================');
    console.log('UPS Monitor - Backfill Aggregations');
    console.log('===========================================\n');

    // Test database connection
    const connected = await db.testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please check your .env configuration.');
      process.exit(1);
    }

    // Get time range from raw metrics if not specified
    let startDate = options.startDate;
    let endDate = options.endDate;

    if (!startDate || !endDate) {
      console.log('Finding time range of raw metrics...');
      const result = await db.query(`
        SELECT
          MIN(timestamp) as oldest,
          MAX(timestamp) as newest,
          COUNT(*) as total_count
        FROM metrics_raw
      `);

      const stats = result.rows[0];

      if (!stats.oldest || !stats.newest) {
        console.log('No raw metrics found in database. Nothing to backfill.');
        process.exit(0);
      }

      console.log(`Found ${stats.total_count} raw metrics`);
      console.log(`Time range: ${stats.oldest} to ${stats.newest}\n`);

      startDate = startDate || new Date(stats.oldest);
      endDate = endDate || new Date(stats.newest);
    }

    // Round start down to the hour and end up to the hour
    const start = new Date(startDate);
    start.setMinutes(0, 0, 0);

    const end = new Date(endDate);
    end.setMinutes(0, 0, 0);
    end.setHours(end.getHours() + 1);

    console.log('Backfill configuration:');
    console.log(`  Start: ${start.toISOString()}`);
    console.log(`  End: ${end.toISOString()}`);
    console.log(`  Hourly: ${options.hourly !== false ? 'YES' : 'NO'}`);
    console.log(`  Daily: ${options.daily === true ? 'YES' : 'NO'}`);
    console.log(`  Weekly: ${options.weekly === true ? 'YES' : 'NO'}`);
    console.log(`  Monthly: ${options.monthly === true ? 'YES' : 'NO'}`);
    console.log('');

    let totalBucketsCreated = 0;

    // Backfill hourly aggregations
    if (options.hourly !== false) {
      console.log('-------------------------------------------');
      console.log('Backfilling hourly aggregations...');
      console.log('-------------------------------------------');

      const currentHour = new Date(start);
      let hourCount = 0;

      while (currentHour < end) {
        const nextHour = new Date(currentHour);
        nextHour.setHours(nextHour.getHours() + 1);

        // Skip the current incomplete hour
        if (nextHour > new Date()) {
          console.log(`Skipping incomplete hour: ${currentHour.toISOString()}`);
          break;
        }

        console.log(`Processing: ${currentHour.toISOString()} - ${nextHour.toISOString()}`);

        try {
          await (aggregationService as any).aggregateForPeriod(
            currentHour,
            nextHour,
            3600,
            'hourly-backfill'
          );
          hourCount++;
        } catch (error) {
          console.error(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        currentHour.setHours(currentHour.getHours() + 1);
      }

      console.log(`✓ Completed ${hourCount} hourly aggregations\n`);
      totalBucketsCreated += hourCount;
    }

    // Backfill daily aggregations
    if (options.daily === true) {
      console.log('-------------------------------------------');
      console.log('Backfilling daily aggregations...');
      console.log('-------------------------------------------');

      const currentDay = new Date(start);
      currentDay.setHours(0, 0, 0, 0);
      let dayCount = 0;

      while (currentDay < end) {
        const nextDay = new Date(currentDay);
        nextDay.setDate(nextDay.getDate() + 1);

        // Skip today (incomplete)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (currentDay >= today) {
          console.log(`Skipping incomplete day: ${currentDay.toISOString()}`);
          break;
        }

        console.log(`Processing: ${currentDay.toISOString()} - ${nextDay.toISOString()}`);

        try {
          await (aggregationService as any).aggregateForPeriod(
            currentDay,
            nextDay,
            86400,
            'daily-backfill'
          );
          dayCount++;
        } catch (error) {
          console.error(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        currentDay.setDate(currentDay.getDate() + 1);
      }

      console.log(`✓ Completed ${dayCount} daily aggregations\n`);
      totalBucketsCreated += dayCount;
    }

    // Backfill weekly aggregations
    if (options.weekly === true) {
      console.log('-------------------------------------------');
      console.log('Backfilling weekly aggregations...');
      console.log('-------------------------------------------');

      const currentWeek = new Date(start);
      currentWeek.setHours(0, 0, 0, 0);
      // Go back to last Sunday
      const dayOfWeek = currentWeek.getDay();
      currentWeek.setDate(currentWeek.getDate() - dayOfWeek);
      let weekCount = 0;

      while (currentWeek < end) {
        const nextWeek = new Date(currentWeek);
        nextWeek.setDate(nextWeek.getDate() + 7);

        console.log(`Processing: ${currentWeek.toISOString()} - ${nextWeek.toISOString()}`);

        try {
          await (aggregationService as any).aggregateForPeriod(
            currentWeek,
            nextWeek,
            604800,
            'weekly-backfill'
          );
          weekCount++;
        } catch (error) {
          console.error(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        currentWeek.setDate(currentWeek.getDate() + 7);
      }

      console.log(`✓ Completed ${weekCount} weekly aggregations\n`);
      totalBucketsCreated += weekCount;
    }

    // Backfill monthly aggregations
    if (options.monthly === true) {
      console.log('-------------------------------------------');
      console.log('Backfilling monthly aggregations...');
      console.log('-------------------------------------------');

      const currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      let monthCount = 0;

      while (currentMonth < end) {
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

        console.log(`Processing: ${currentMonth.toISOString()} - ${nextMonth.toISOString()}`);

        try {
          await (aggregationService as any).aggregateForPeriod(
            currentMonth,
            nextMonth,
            2592000,
            'monthly-backfill'
          );
          monthCount++;
        } catch (error) {
          console.error(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      console.log(`✓ Completed ${monthCount} monthly aggregations\n`);
      totalBucketsCreated += monthCount;
    }

    // Show final statistics
    console.log('===========================================');
    console.log('Backfill Summary');
    console.log('===========================================');

    const finalStats = await db.query(`
      SELECT COUNT(*) as aggregated_count
      FROM metrics_aggregated
    `);

    console.log(`Total aggregated buckets in database: ${finalStats.rows[0].aggregated_count}`);
    console.log(`Buckets created in this run: ${totalBucketsCreated}`);
    console.log('\n✓ Backfill complete!\n');

  } catch (error) {
    console.error('\n✗ Error:', error);
    logger.error('Backfill failed', { error });
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: BackfillOptions = {
  hourly: true,  // Default to hourly
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--daily') {
    options.daily = true;
  } else if (arg === '--weekly') {
    options.weekly = true;
  } else if (arg === '--monthly') {
    options.monthly = true;
  } else if (arg === '--all') {
    options.hourly = true;
    options.daily = true;
    options.weekly = true;
    options.monthly = true;
  } else if (arg === '--start' && args[i + 1]) {
    options.startDate = new Date(args[i + 1]);
    i++;
  } else if (arg === '--end' && args[i + 1]) {
    options.endDate = new Date(args[i + 1]);
    i++;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
UPS Monitor - Backfill Aggregations Script

Usage:
  npm run backfill                  # Backfill hourly aggregations for all raw data
  npm run backfill -- --daily       # Include daily aggregations
  npm run backfill -- --all         # Backfill all aggregation types
  npm run backfill -- --start 2026-01-24 --end 2026-01-25

Options:
  --daily                Include daily aggregations
  --weekly               Include weekly aggregations
  --monthly              Include monthly aggregations
  --all                  Include all aggregation types
  --start <date>         Start date (default: oldest raw metric)
  --end <date>           End date (default: newest raw metric)
  --help, -h             Show this help message

Examples:
  npm run backfill
  npm run backfill -- --daily --weekly
  npm run backfill -- --all
  npm run backfill -- --start 2026-01-01 --end 2026-01-31
`);
    process.exit(0);
  }
}

backfillAggregations(options);
