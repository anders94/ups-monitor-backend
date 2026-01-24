-- Raw Metrics Table
-- Stores minute-by-minute samples from UPS devices

CREATE TABLE IF NOT EXISTS metrics_raw (
    id BIGSERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Power Metrics
    output_power_watts NUMERIC(10, 2), -- Actual power draw in watts
    output_power_va NUMERIC(10, 2), -- Apparent power in VA
    output_load_percent NUMERIC(5, 2), -- Load percentage

    -- Battery Metrics
    battery_status VARCHAR(50), -- normal, low, depleted, unknown
    battery_capacity_percent NUMERIC(5, 2), -- Remaining capacity percentage
    battery_voltage NUMERIC(6, 2), -- Battery voltage
    battery_temperature NUMERIC(5, 2), -- Battery temperature in Celsius
    battery_runtime_remaining_seconds INTEGER, -- Estimated runtime remaining

    -- Input Metrics
    input_voltage NUMERIC(6, 2),
    input_frequency NUMERIC(5, 2),
    input_current NUMERIC(6, 2),

    -- Output Metrics
    output_voltage NUMERIC(6, 2),
    output_frequency NUMERIC(5, 2),
    output_current NUMERIC(6, 2),

    -- Status Flags
    on_battery BOOLEAN NOT NULL DEFAULT false,
    on_line BOOLEAN NOT NULL DEFAULT true,
    on_bypass BOOLEAN NOT NULL DEFAULT false,
    alarms_present BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for fast time-range queries
CREATE INDEX idx_metrics_raw_device_timestamp ON metrics_raw(device_id, timestamp DESC);
CREATE INDEX idx_metrics_raw_timestamp ON metrics_raw(timestamp DESC);
CREATE INDEX idx_metrics_raw_on_battery ON metrics_raw(device_id, on_battery, timestamp DESC);

-- Composite index for battery event detection
CREATE INDEX idx_metrics_raw_battery_events ON metrics_raw(device_id, timestamp DESC)
    WHERE on_battery = true;

-- Comments
COMMENT ON TABLE metrics_raw IS 'Raw minute-by-minute UPS metrics';
COMMENT ON COLUMN metrics_raw.output_power_watts IS 'Actual power consumption in watts (real power)';
COMMENT ON COLUMN metrics_raw.output_power_va IS 'Apparent power in volt-amperes';
COMMENT ON COLUMN metrics_raw.battery_runtime_remaining_seconds IS 'Estimated seconds of battery runtime remaining';

-- Optional: Convert to TimescaleDB hypertable for better performance (uncomment if using TimescaleDB)
-- SELECT create_hypertable('metrics_raw', 'timestamp', if_not_exists => TRUE);
