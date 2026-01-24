# UPS Monitor - Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites Check

```bash
# Node.js (>= 18)
node --version

# PostgreSQL (>= 12)
psql --version

# Git (optional)
git --version
```

## Step 1: Install Dependencies

```bash
cd ups-monitor
npm install
```

## Step 2: Setup Database

```bash
# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE ups_monitor;
CREATE USER ups_admin WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ups_monitor TO ups_admin;
\q
EOF

# Or connect and run manually:
sudo -u postgres psql
CREATE DATABASE ups_monitor;
CREATE USER ups_admin WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ups_monitor TO ups_admin;
\q
```

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and update database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ups_monitor
DB_USER=ups_admin
DB_PASSWORD=secure_password
```

## Step 4: Run Migrations

```bash
npm run migrate
```

Expected output:
```
✓ Database connection successful
→ Running 001_create_devices.sql...
→ Running 002_create_metrics_raw.sql...
→ Running 003_create_metrics_aggregated.sql...
→ Running 004_create_battery_events.sql...
→ Running 005_create_retention_policies.sql...
✓ Database setup completed successfully!
```

## Step 5: Add Your UPS Device

```bash
npm run seed
```

Follow the prompts to enter:
- Device name (e.g., "Main Office UPS")
- Host/IP address (e.g., "192.168.1.100")
- SNMP port (default: 161)
- SNMPv3 credentials:
  - Username
  - Auth protocol (SHA recommended)
  - Auth key (min 8 characters)
  - Privacy protocol (AES recommended)
  - Privacy key (min 8 characters)
- OID profile:
  - `apc-powernet` for APC devices
  - `rfc1628` for other brands

## Step 6: Start the Application

```bash
# Development mode (auto-reload)
npm run dev

# Or build and run production mode
npm run build
npm start
```

Expected output:
```
[2026-01-24 10:00:00] [info]: Starting UPS Monitor API
[2026-01-24 10:00:00] [info]: Database connection successful
[2026-01-24 10:00:00] [info]: Server listening on port 3000
[2026-01-24 10:00:00] [info]: Starting scheduler
[2026-01-24 10:00:01] [info]: Running initial SNMP poll
[2026-01-24 10:00:02] [info]: Polling 1 devices
[2026-01-24 10:00:03] [info]: SNMP poll completed { total: 1, successes: 1, failures: 0 }
```

## Step 7: Verify Installation

### Test API Health
```bash
curl http://localhost:3000/api/v1/health
```

### List Devices
```bash
curl http://localhost:3000/api/v1/devices
```

### Get Current Status
```bash
curl http://localhost:3000/api/v1/devices/1/status/current
```

### Manual SNMP Test
```bash
npm run manual-poll
```

Expected output:
```
Device: Main Office UPS (ID: 1)
-------------------------------------------
✓ Poll successful (245ms)

Metrics:
  Power Output: 450.5 W
  Load: 45%
  Battery Capacity: 100%
  Battery Voltage: 27.2 V
  On Battery: NO
  On Line: YES
```

## Step 8: View Metrics

After a few minutes of polling, query metrics:

```bash
# Last 24 hours of power metrics
curl "http://localhost:3000/api/v1/devices/1/metrics/power"

# Last hour with 1-minute resolution
curl "http://localhost:3000/api/v1/devices/1/metrics/power?interval=60"

# Battery metrics
curl "http://localhost:3000/api/v1/devices/1/metrics/battery"

# Battery events (power outages)
curl "http://localhost:3000/api/v1/devices/1/battery-events"
```

## Next Steps

### Add More Devices
```bash
npm run seed
# Or use API:
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Secondary UPS",
    "host": "192.168.1.101",
    "snmpUsername": "monitor",
    "snmpAuthProtocol": "SHA",
    "snmpAuthKey": "authkey123",
    "snmpPrivProtocol": "AES",
    "snmpPrivKey": "privkey123",
    "oidProfile": "apc-powernet"
  }'
```

### Setup Dashboard Integration
Point your dashboard to the API:
- Base URL: `http://localhost:3000/api/v1`
- Endpoints: See README.md API Documentation section
- No authentication required (internal network)

### Production Deployment
Choose your deployment method:
- **PM2**: `pm2 start deployment/pm2.config.js`
- **Docker**: `cd deployment/docker && docker-compose up -d`
- **systemd**: See `deployment/systemd/ups-monitor.service`
- **Windows**: See `deployment/windows/install-service.md`

## Troubleshooting

### Migration Fails
```bash
# Check database connectivity
psql -h localhost -U ups_admin -d ups_monitor

# If connection refused, verify PostgreSQL is running:
sudo systemctl status postgresql

# Start if needed:
sudo systemctl start postgresql
```

### SNMP Poll Fails
```bash
# Test connectivity
npm run manual-poll

# Common issues:
# - Wrong IP address or port
# - Incorrect SNMP credentials
# - Firewall blocking UDP port 161
# - SNMPv3 not enabled on UPS
# - Wrong auth/priv protocols

# Verify UPS settings:
# - Enable SNMPv3
# - Create user with authPriv security level
# - Use SHA + AES (not MD5 + DES)
```

### No Metrics After Polling
```bash
# Check database for raw metrics
psql -h localhost -U ups_admin -d ups_monitor -c "SELECT COUNT(*) FROM metrics_raw;"

# Check logs
tail -f logs/combined.log
tail -f logs/error.log

# Verify device is enabled
curl http://localhost:3000/api/v1/devices
```

### Port 3000 Already in Use
Edit `.env` and change `PORT`:
```env
PORT=3001
```

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run migrate

# Add device interactively
npm run seed

# Test SNMP polling
npm run manual-poll

# Run tests
npm test

# View logs
tail -f logs/combined.log
tail -f logs/error.log

# Check API health
curl http://localhost:3000/api/v1/health

# View system stats
curl http://localhost:3000/api/v1/stats
```

## Getting Help

- **Full documentation**: See `README.md`
- **API reference**: `README.md` → API Documentation section
- **Deployment guides**: `deployment/` directory
- **Configuration**: `.env.example` with all options
- **Logs**: `logs/combined.log` and `logs/error.log`

## Success Criteria

✅ Database migrations completed successfully
✅ At least one device added
✅ Application starts without errors
✅ Health check returns `200 OK`
✅ Manual poll retrieves metrics from UPS
✅ Raw metrics appear in database
✅ API returns data for metrics endpoints

You're all set! The system will:
- Poll UPS devices every minute
- Store raw metrics
- Aggregate data hourly/daily/weekly
- Track battery events
- Clean up old data per retention policies
- Provide API endpoints for your dashboard
