-- UPS Devices Configuration Table
-- Stores UPS device configuration and SNMPv3 credentials

CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 161,
    manufacturer VARCHAR(100),
    model VARCHAR(100),

    -- SNMPv3 Configuration
    snmp_version VARCHAR(10) NOT NULL DEFAULT '3',
    snmp_username VARCHAR(100) NOT NULL,
    snmp_auth_protocol VARCHAR(20) NOT NULL DEFAULT 'SHA', -- SHA, SHA-256, MD5
    snmp_auth_key VARCHAR(255) NOT NULL,
    snmp_priv_protocol VARCHAR(20) NOT NULL DEFAULT 'AES', -- AES, AES-256, DES
    snmp_priv_key VARCHAR(255) NOT NULL,
    snmp_security_level VARCHAR(20) NOT NULL DEFAULT 'authPriv', -- noAuthNoPriv, authNoPriv, authPriv

    -- OID Configuration (flexible per-device mappings)
    oid_profile VARCHAR(50) NOT NULL DEFAULT 'apc-powernet', -- apc-powernet, rfc1628, custom
    oid_overrides JSONB DEFAULT '{}',

    -- Polling Configuration
    poll_interval_seconds INTEGER NOT NULL DEFAULT 60,
    enabled BOOLEAN NOT NULL DEFAULT true,

    -- Status Tracking
    last_poll_at TIMESTAMP WITH TIME ZONE,
    last_poll_success BOOLEAN,
    last_poll_error TEXT,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_devices_enabled ON devices(enabled);
CREATE INDEX idx_devices_last_poll ON devices(last_poll_at DESC);
CREATE UNIQUE INDEX idx_devices_host_port ON devices(host, port);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE devices IS 'UPS device configuration and SNMPv3 credentials';
COMMENT ON COLUMN devices.oid_profile IS 'OID profile to use: apc-powernet, rfc1628, or custom';
COMMENT ON COLUMN devices.oid_overrides IS 'JSONB object with custom OID mappings to override profile defaults';
COMMENT ON COLUMN devices.snmp_security_level IS 'SNMPv3 security level: noAuthNoPriv, authNoPriv, or authPriv';
