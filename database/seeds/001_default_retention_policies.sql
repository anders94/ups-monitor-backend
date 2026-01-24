-- Default Retention Policies
-- Run this if the migrations didn't populate the retention policies

INSERT INTO data_retention_policies (policy_name, table_name, retention_days) VALUES
    ('raw_metrics_retention', 'metrics_raw', 30),
    ('hourly_aggregates_retention', 'metrics_aggregated', 365),
    ('daily_aggregates_retention', 'metrics_aggregated', 1095),
    ('weekly_aggregates_retention', 'metrics_aggregated', 1825),
    ('battery_events_retention', 'battery_events', 1095)
ON CONFLICT (policy_name) DO UPDATE SET
    retention_days = EXCLUDED.retention_days;
