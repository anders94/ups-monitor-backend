-- Aggregated Metrics Table
-- Stores pre-computed time-bucketed aggregates for faster dashboard queries

CREATE TABLE IF NOT EXISTS metrics_aggregated (
    id BIGSERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    bucket_start TIMESTAMP WITH TIME ZONE NOT NULL,
    bucket_duration_seconds INTEGER NOT NULL, -- 3600=hourly, 86400=daily, 604800=weekly, 2592000=monthly

    -- Aggregated Power Metrics
    avg_output_power_watts NUMERIC(10, 2),
    min_output_power_watts NUMERIC(10, 2),
    max_output_power_watts NUMERIC(10, 2),

    avg_output_power_va NUMERIC(10, 2),
    min_output_power_va NUMERIC(10, 2),
    max_output_power_va NUMERIC(10, 2),

    avg_output_load_percent NUMERIC(5, 2),
    min_output_load_percent NUMERIC(5, 2),
    max_output_load_percent NUMERIC(5, 2),

    -- Aggregated Battery Metrics
    avg_battery_capacity_percent NUMERIC(5, 2),
    min_battery_capacity_percent NUMERIC(5, 2),
    max_battery_capacity_percent NUMERIC(5, 2),

    avg_battery_voltage NUMERIC(6, 2),
    min_battery_voltage NUMERIC(6, 2),
    max_battery_voltage NUMERIC(6, 2),

    avg_battery_temperature NUMERIC(5, 2),
    min_battery_temperature NUMERIC(5, 2),
    max_battery_temperature NUMERIC(5, 2),

    avg_battery_runtime_remaining_seconds INTEGER,

    -- Aggregated Input/Output Metrics
    avg_input_voltage NUMERIC(6, 2),
    avg_output_voltage NUMERIC(6, 2),
    avg_input_frequency NUMERIC(5, 2),
    avg_output_frequency NUMERIC(5, 2),

    -- On-Battery Statistics
    on_battery_sample_count INTEGER NOT NULL DEFAULT 0,
    on_battery_total_seconds INTEGER NOT NULL DEFAULT 0,
    on_battery_event_count INTEGER NOT NULL DEFAULT 0,

    -- Data Quality
    sample_count INTEGER NOT NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate aggregations
CREATE UNIQUE INDEX idx_metrics_agg_unique ON metrics_aggregated(device_id, bucket_duration_seconds, bucket_start);

-- Indexes for fast queries
CREATE INDEX idx_metrics_agg_device_duration_bucket ON metrics_aggregated(device_id, bucket_duration_seconds, bucket_start DESC);
CREATE INDEX idx_metrics_agg_bucket_start ON metrics_aggregated(bucket_start DESC);

-- Comments
COMMENT ON TABLE metrics_aggregated IS 'Pre-computed time-bucketed aggregates for fast dashboard queries';
COMMENT ON COLUMN metrics_aggregated.bucket_duration_seconds IS 'Duration of bucket: 3600 (1h), 86400 (1d), 604800 (1w), 2592000 (~1M)';
COMMENT ON COLUMN metrics_aggregated.on_battery_sample_count IS 'Number of raw samples where on_battery was true';
COMMENT ON COLUMN metrics_aggregated.on_battery_event_count IS 'Number of distinct on-battery events in this bucket';
