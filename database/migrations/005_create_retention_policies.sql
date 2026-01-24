-- Data Retention Policies Table
-- Configurable retention settings for automatic data cleanup

CREATE TABLE IF NOT EXISTS data_retention_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(50) NOT NULL UNIQUE,
    table_name VARCHAR(100) NOT NULL,
    retention_days INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_cleanup_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update timestamp trigger
CREATE TRIGGER update_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default retention policies
INSERT INTO data_retention_policies (policy_name, table_name, retention_days) VALUES
    ('raw_metrics_retention', 'metrics_raw', 30),
    ('hourly_aggregates_retention', 'metrics_aggregated', 365),
    ('daily_aggregates_retention', 'metrics_aggregated', 1095),
    ('weekly_aggregates_retention', 'metrics_aggregated', 1825),
    ('battery_events_retention', 'battery_events', 1095)
ON CONFLICT (policy_name) DO NOTHING;

-- Comments
COMMENT ON TABLE data_retention_policies IS 'Configurable data retention policies for automatic cleanup';
COMMENT ON COLUMN data_retention_policies.retention_days IS 'Number of days to retain data before deletion';
