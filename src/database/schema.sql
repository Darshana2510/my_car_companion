PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,

    owner_id TEXT NOT NULL,

    nickname TEXT,

    vin TEXT,

    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,

    current_odometer INTEGER,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_owner
ON vehicles(owner_id);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,

    vehicle_id TEXT NOT NULL,

    service_type TEXT NOT NULL,

    performed_at TEXT NOT NULL,

    odometer INTEGER,

    cost REAL,

    notes TEXT,

    next_due_date TEXT,

    next_due_odometer INTEGER,

    created_at TEXT NOT NULL,

    FOREIGN KEY(vehicle_id)
        REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle
ON maintenance_records(vehicle_id);

CREATE TABLE IF NOT EXISTS fuel_logs (
    id TEXT PRIMARY KEY,

    vehicle_id TEXT NOT NULL,

    filled_at TEXT NOT NULL,

    odometer INTEGER NOT NULL,

    litres REAL NOT NULL,

    price REAL,

    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_vehicle
ON fuel_logs(vehicle_id);
