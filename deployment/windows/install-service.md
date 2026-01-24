# Installing UPS Monitor as Windows Service

## Using NSSM (Non-Sucking Service Manager)

### Prerequisites
- Node.js installed
- UPS Monitor built and configured
- NSSM downloaded from https://nssm.cc/download

### Installation Steps

1. **Build the application**
   ```cmd
   npm install
   npm run build
   ```

2. **Download and extract NSSM**
   - Download from https://nssm.cc/download
   - Extract to `C:\nssm`

3. **Install the service**
   ```cmd
   cd C:\nssm\win64
   nssm install UPSMonitor
   ```

4. **Configure the service in the NSSM GUI:**
   - **Application tab:**
     - Path: `C:\Program Files\nodejs\npm.cmd`
     - Startup directory: `C:\path\to\ups-monitor`
     - Arguments: `start`

   - **Details tab:**
     - Display name: `UPS Monitor API`
     - Description: `UPS monitoring system with SNMP polling`
     - Startup type: `Automatic`

   - **Environment tab:**
     Add environment variables or point to `.env` file:
     ```
     NODE_ENV=production
     ```

   - **I/O tab:**
     - Output (stdout): `C:\path\to\ups-monitor\logs\stdout.log`
     - Error (stderr): `C:\path\to\ups-monitor\logs\stderr.log`

5. **Start the service**
   ```cmd
   nssm start UPSMonitor
   ```

### Service Management

**Check status:**
```cmd
nssm status UPSMonitor
```

**Stop service:**
```cmd
nssm stop UPSMonitor
```

**Restart service:**
```cmd
nssm restart UPSMonitor
```

**Remove service:**
```cmd
nssm remove UPSMonitor confirm
```

### Troubleshooting

1. **Service won't start:**
   - Check logs in `logs/stdout.log` and `logs/stderr.log`
   - Verify Node.js path: `where node` and `where npm`
   - Ensure `.env` file exists with correct database configuration

2. **Database connection issues:**
   - Verify PostgreSQL is running
   - Check firewall rules
   - Test connection manually: `psql -h localhost -U ups_admin -d ups_monitor`

3. **SNMP polling fails:**
   - Verify UPS devices are accessible from Windows host
   - Check firewall allows SNMP traffic (UDP port 161)
   - Test SNMP connectivity using `scripts/manual-poll.ts`

### Alternative: Windows Task Scheduler

If you prefer not to use NSSM, you can use Task Scheduler:

1. Open Task Scheduler
2. Create Basic Task
3. Name: `UPS Monitor API`
4. Trigger: `When the computer starts`
5. Action: `Start a program`
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `dist/index.js`
   - Start in: `C:\path\to\ups-monitor`
6. Enable "Run whether user is logged on or not"
7. Enable "Run with highest privileges"
