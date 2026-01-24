# UPS Monitor API Backend

A lightweight Node.js backend API that monitors multiple UPS devices via SNMPv3, stores time-series data in PostgreSQL, and provides REST API endpoints for power consumption graphs and battery event history.

## Features

- **Multi-device UPS monitoring** via SNMPv3
- **Time-series metrics storage** with automatic aggregation (hourly, daily, weekly, monthly)
- **Battery event tracking** for power outage detection
- **RESTful API** for dashboard integration
- **Flexible OID profiles** supporting APC PowerNet MIB and RFC1628 UPS-MIB
- **Configurable data retention** policies
- **Production-ready** with PM2, Docker, and systemd support

## Architecture

```
┌──────────────────┐
│  Web Dashboard   │ (Queries our API)
└────────┬─────────┘
         │ HTTPS/REST
         ▼
┌──────────────────────────────────────┐
│       Express.js API Server          │
│  - Device management endpoints       │
│  - Metrics query endpoints           │
│  - Battery events API                │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│      PostgreSQL Database             │
│  - devices (config & metadata)       │
│  - metrics_raw (1-min samples)       │
│  - metrics_aggregated (1h/1d/1w/1M)  │
│  - battery_events (power outages)    │
└────────┬─────────────────────────────┘
         ▲
         │
┌────────┴─────────────────────────────┐
│   SNMP Collector (node-cron)         │
│  - Polls every 1 minute              │
│  - Concurrent multi-device support   │
└────────┬─────────────────────────────┘
         │ SNMPv3
         ▼
┌──────────────────────────────────────┐
│     UPS Devices (APC + others)       │
└──────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 12
- **UPS device(s)** with SNMPv3 enabled

### Installation

1. **Clone or extract the project**
   ```bash
   cd ups-monitor-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create PostgreSQL database**
   ```bash
   sudo -u postgres psql <<EOF
   CREATE DATABASE ups_monitor;
   CREATE USER ups_admin WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ups_monitor TO ups_admin;
   EOF
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Update database credentials and other settings:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ups_monitor
   DB_USER=ups_admin
   DB_PASSWORD=secure_password
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Add your first UPS device**
   ```bash
   npm run seed
   ```

   Follow the prompts to enter:
   - Device name and network details
   - SNMPv3 credentials (username, auth protocol, auth key, priv protocol, priv key)
   - OID profile (apc-powernet for APC devices, rfc1628 for others)

7. **Start the application**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production (build first)
   npm run build
   npm start
   ```

8. **Verify installation**
   ```bash
   # Check health
   curl http://localhost:3000/api/v1/health

   # List devices
   curl http://localhost:3000/api/v1/devices

   # Test SNMP polling
   npm run manual-poll
   ```

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

#### Device Management

**GET /devices**
List all UPS devices
```bash
curl http://localhost:3000/api/v1/devices
```

**GET /devices/:id**
Get device details with latest metrics
```bash
curl http://localhost:3000/api/v1/devices/1
```

**POST /devices**
Add new UPS device
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office UPS",
    "host": "192.168.1.100",
    "snmpUsername": "monitor",
    "snmpAuthProtocol": "SHA",
    "snmpAuthKey": "authkey123",
    "snmpPrivProtocol": "AES",
    "snmpPrivKey": "privkey123",
    "oidProfile": "apc-powernet"
  }'
```

**PUT /devices/:id**
Update device configuration
```bash
curl -X PUT http://localhost:3000/api/v1/devices/1 \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

**DELETE /devices/:id**
Remove device
```bash
curl -X DELETE http://localhost:3000/api/v1/devices/1
```

#### Metrics

**GET /devices/:id/metrics/power**
Get power metrics (watts, load %)
```bash
# Last 24 hours (auto-selects interval)
curl "http://localhost:3000/api/v1/devices/1/metrics/power"

# Custom time range with hourly aggregation
curl "http://localhost:3000/api/v1/devices/1/metrics/power?start=2026-01-01T00:00:00Z&end=2026-01-07T00:00:00Z&interval=3600"
```

Query parameters:
- `start` (ISO timestamp, default: 24 hours ago)
- `end` (ISO timestamp, default: now)
- `interval` (seconds: 60=1min, 3600=1h, 86400=1d, 604800=1w, 2592000=1M)

**GET /devices/:id/metrics/battery**
Get battery metrics (capacity, runtime, voltage)
```bash
curl "http://localhost:3000/api/v1/devices/1/metrics/battery?start=2026-01-01T00:00:00Z&end=2026-01-07T00:00:00Z"
```

**GET /devices/:id/status/current**
Get current/latest status
```bash
curl http://localhost:3000/api/v1/devices/1/status/current
```

#### Battery Events

**GET /devices/:id/battery-events**
Get battery events (power outages)
```bash
curl "http://localhost:3000/api/v1/devices/1/battery-events?start=2026-01-01T00:00:00Z&limit=50"
```

#### Multi-Device Aggregation

**GET /metrics/power/total**
Aggregated power across multiple devices
```bash
curl "http://localhost:3000/api/v1/metrics/power/total?deviceIds[]=1&deviceIds[]=2&start=2026-01-01T00:00:00Z"
```

**GET /battery-events**
All battery events across devices
```bash
curl "http://localhost:3000/api/v1/battery-events?deviceIds[]=1&deviceIds[]=2"
```

#### System

**GET /health**
Health check
```bash
curl http://localhost:3000/api/v1/health
```

**GET /stats**
System statistics
```bash
curl http://localhost:3000/api/v1/stats
```

## Configuration

### Environment Variables

See `.env.example` for all available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `HOST` | API server host | localhost |
| `PORT` | API server port | 3000 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | ups_monitor |
| `DB_USER` | Database user | ups_admin |
| `DB_PASSWORD` | Database password | - |
| `SNMP_TIMEOUT` | SNMP request timeout (ms) | 5000 |
| `SNMP_RETRIES` | SNMP retry attempts | 1 |
| `POLL_INTERVAL` | Polling interval (seconds) | 60 |
| `RETENTION_RAW_DAYS` | Raw metrics retention | 30 |
| `RETENTION_HOURLY_DAYS` | Hourly aggregates retention | 365 |
| `RETENTION_DAILY_DAYS` | Daily aggregates retention | 1095 |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info |

### OID Profiles

The system supports multiple UPS brands via OID profiles:

**APC PowerNet MIB** (`apc-powernet`)
- Optimized for APC Smart-UPS devices (e.g., SMTL1000RM2UCNC)
- Base OID: `1.3.6.1.4.1.318.1.1.1`
- Provides detailed power, battery, and status metrics

**RFC1628 UPS-MIB** (`rfc1628`)
- Standard UPS Management Information Base
- Base OID: `1.3.6.1.2.1.33`
- Compatible with most SNMP-enabled UPS devices

Custom OID mappings can be specified per device using the `oidOverrides` field.

## Deployment

### PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start deployment/pm2.config.js

# View logs
pm2 logs ups-monitor

# Monitor
pm2 monit

# Setup startup script
pm2 startup
pm2 save
```

### Docker

```bash
# Build and run with Docker Compose
cd deployment/docker
docker-compose up -d

# View logs
docker-compose logs -f ups-monitor

# Stop
docker-compose down
```

### systemd (Linux Service)

```bash
# Copy service file
sudo cp deployment/systemd/ups-monitor.service /etc/systemd/system/

# Install application to /opt
sudo mkdir -p /opt/ups-monitor
sudo cp -r . /opt/ups-monitor

# Create user
sudo useradd -r -s /bin/false ups-monitor

# Set permissions
sudo chown -R ups-monitor:ups-monitor /opt/ups-monitor

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ups-monitor
sudo systemctl start ups-monitor

# Check status
sudo systemctl status ups-monitor

# View logs
sudo journalctl -u ups-monitor -f
```

### Windows Service

See `deployment/windows/install-service.md` for NSSM installation guide.

## Development

### Project Structure

```
ups-monitor-backend/
├── src/
│   ├── api/                    # API layer (routes, controllers, middleware)
│   ├── collectors/             # SNMP polling and OID profiles
│   ├── config/                 # Configuration (database, logger, env)
│   ├── models/                 # Data models
│   ├── repositories/           # Database access layer
│   ├── services/               # Business logic
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utilities (errors, validators, transformers)
│   ├── server.ts               # Express app setup
│   └── index.ts                # Entry point
├── database/
│   ├── migrations/             # SQL migration files
│   └── seeds/                  # Seed data
├── scripts/                    # Helper scripts
├── deployment/                 # Deployment configurations
└── tests/                      # Test files
```

### NPM Scripts

```bash
npm run dev          # Start development server with auto-reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production server
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code with Prettier
npm run migrate      # Run database migrations
npm run seed         # Add sample device
npm run manual-poll  # Test SNMP polling
```

### Adding Custom OID Profiles

1. Create new profile in `src/collectors/oid-profiles/your-profile.ts`:

```typescript
import { OidProfile } from '../../types/snmp.types';

export const yourProfile: OidProfile = {
  name: 'your-ups-brand',
  description: 'Your UPS Brand MIB',
  baseOid: '1.3.6.1.4.1.XXXX',
  oids: {
    batteryCapacityPercent: '1.3.6.1.4.1.XXXX.X.X.X',
    outputPower: '1.3.6.1.4.1.XXXX.X.X.X',
    // ... more OIDs
  },
  transforms: {
    // Optional value transformations
  },
};
```

2. Register in `src/collectors/oid-profiles/index.ts`
3. Use with `oidProfile: 'your-ups-brand'` when creating devices

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U ups_admin -d ups_monitor

# Check if database exists
sudo -u postgres psql -l

# Verify migrations ran
psql -h localhost -U ups_admin -d ups_monitor -c "\dt"
```

### SNMP Polling Fails

```bash
# Test SNMP connectivity manually
npm run manual-poll

# Verify UPS SNMP settings
# - SNMPv3 enabled
# - User configured with auth and privacy
# - Correct protocols (SHA, AES recommended)
# - Firewall allows UDP port 161

# Check device credentials
curl http://localhost:3000/api/v1/devices/1

# Test connection via API
curl -X POST http://localhost:3000/api/v1/devices/1/test
```

### No Data Appearing

1. Check if collector is running:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. Verify devices are enabled:
   ```bash
   curl http://localhost:3000/api/v1/devices
   ```

3. Check logs in console output (stdout/stderr)

4. Query raw metrics directly:
   ```sql
   SELECT * FROM metrics_raw ORDER BY timestamp DESC LIMIT 10;
   ```

### High CPU/Memory Usage

- Reduce `POLL_INTERVAL` (increase seconds between polls)
- Decrease number of monitored devices
- Tune `DB_POOL_MAX` for connection pooling
- Enable data retention cleanup (runs daily at 2 AM)

## Security Considerations

### Internal-Only Deployment (Default)

This application is designed for internal network deployment:
- No authentication required by default
- CORS allows all origins in development
- Use firewall rules to restrict access

### Enabling Authentication (Optional)

1. Set `API_KEY` in `.env`:
   ```env
   API_KEY=your_secure_random_key_here
   ```

2. Uncomment authentication middleware in routes:
   ```typescript
   // src/api/routes/devices.routes.ts
   import { adminAuth } from '../middleware/auth.middleware';
   router.post('/', adminAuth, ...); // Uncomment
   ```

3. Include API key in requests:
   ```bash
   curl -H "X-API-Key: your_secure_random_key_here" http://localhost:3000/api/v1/devices
   ```

### Production Best Practices

- Deploy behind reverse proxy (nginx, Caddy) with HTTPS
- Configure CORS whitelist in `src/server.ts`
- Use strong SNMPv3 credentials (SHA-256, AES-256)
- Never commit `.env` or credentials to version control
- Encrypt SNMPv3 keys in database (not implemented in v1.0)
- Enable rate limiting (enabled by default in production)
- Set up firewall rules (allow only dashboard server)
- Regular database backups

## Performance Optimization

### Database Indexes

All critical queries are indexed:
- `metrics_raw(device_id, timestamp DESC)`
- `metrics_aggregated(device_id, bucket_duration_seconds, bucket_start DESC)`
- `battery_events(device_id, event_start DESC)`

### Data Aggregation

- Raw data: 1-minute resolution (default 30 days retention)
- Hourly aggregates: Pre-computed at top of each hour
- Daily aggregates: Pre-computed at midnight
- Weekly aggregates: Pre-computed Sunday midnight
- Queries automatically select appropriate bucket duration

### Optional: TimescaleDB

For large-scale deployments (10+ UPS devices, years of data):

1. Install TimescaleDB extension
2. Uncomment in `database/migrations/002_create_metrics_raw.sql`:
   ```sql
   SELECT create_hypertable('metrics_raw', 'timestamp', if_not_exists => TRUE);
   ```
3. Enable compression for old data

## License

MIT

## Support

For issues, feature requests, or questions, please open an issue on the project repository.
