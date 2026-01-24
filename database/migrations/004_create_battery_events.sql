-- Battery Events Table
-- Tracks continuous on-battery events (power outages)

CREATE TABLE IF NOT EXISTS battery_events (
    id BIGSERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    -- Event Timing
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Battery State
    battery_capacity_start_percent NUMERIC(5, 2),
    battery_capacity_end_percent NUMERIC(5, 2),
    battery_capacity_drop_percent NUMERIC(5, 2),

    -- Event Details
    trigger_reason VARCHAR(255), -- if available from SNMP
    max_load_percent NUMERIC(5, 2),
    avg_load_percent NUMERIC(5, 2),

    -- Status
    event_completed BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_battery_events_device_start ON battery_events(device_id, event_start DESC);
CREATE INDEX idx_battery_events_start ON battery_events(event_start DESC);
CREATE INDEX idx_battery_events_incomplete ON battery_events(device_id, event_completed)
    WHERE event_completed = false;

-- Update timestamp trigger
CREATE TRIGGER update_battery_events_updated_at
    BEFORE UPDATE ON battery_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE battery_events IS 'Continuous on-battery events (power outages)';
COMMENT ON COLUMN battery_events.event_completed IS 'False while event is ongoing, true when UPS returns to line power';
COMMENT ON COLUMN battery_events.duration_seconds IS 'Total duration of power outage in seconds';
