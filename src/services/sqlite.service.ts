import Database from 'better-sqlite3';
import { Injectable } from '@nitrostack/core';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SQLiteService {
    private readonly db: Database.Database;

    // Prepared statements
    private readonly insertVehicleStmt;
    private readonly listVehiclesStmt;
    private readonly getVehicleStmt;
    private readonly deleteVehicleStmt;

    constructor() {
        console.log("SQLiteService constructor");
        const dbPath = 'data/garage.db';

        mkdirSync(dirname(dbPath), { recursive: true });

        this.db = new Database(dbPath);

        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');

        console.log("Database opened");
        this.initialize();
        console.log("Tables initialized");

        this.insertVehicleStmt = this.db.prepare(`
            INSERT INTO vehicles (
                id,
                owner_id,
                nickname,
                vin,
                year,
                make,
                model,
                current_odometer,
                created_at,
                updated_at
            )
            VALUES (
                @id,
                @ownerId,
                @nickname,
                @vin,
                @year,
                @make,
                @model,
                @currentOdometer,
                @createdAt,
                @updatedAt
            )
        `);

        this.listVehiclesStmt = this.db.prepare(`
            SELECT *
            FROM vehicles
            WHERE owner_id = ?
            ORDER BY created_at DESC
        `);

        this.getVehicleStmt = this.db.prepare(`
            SELECT *
            FROM vehicles
            WHERE id = ?
              AND owner_id = ?
        `);

        this.deleteVehicleStmt = this.db.prepare(`
            DELETE
            FROM vehicles
            WHERE id = ?
              AND owner_id = ?
        `);
    }

    private initialize(): void {
        console.info("Initializing SQLite database...");
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS vehicles (
                    id TEXT PRIMARY KEY,

                    owner_id TEXT NOT NULL,

                    nickname TEXT,

                    vin TEXT,

                    year INTEGER NOT NULL,
                    make TEXT NOT NULL,
                    model TEXT NOT NULL,

                    current_odometer INTEGER,

                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

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
                        ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS fuel_logs (
                    id TEXT PRIMARY KEY,

                    vehicle_id TEXT NOT NULL,

                    filled_at TEXT NOT NULL,

                    odometer INTEGER NOT NULL,

                    litres REAL NOT NULL,

                    price REAL,

                    created_at TEXT NOT NULL,

                    FOREIGN KEY(vehicle_id)
                        REFERENCES vehicles(id)
                        ON DELETE CASCADE
                );
            `);
        } catch (error) {
            console.error("Error initializing SQLite database:", error);
            throw error;
        }
    }

    createVehicle(input: {
        ownerId: string;
        nickname?: string;
        vin?: string;
        year: number;
        make: string;
        model: string;
        currentOdometer?: number;
    }) {
        const now = new Date().toISOString();

        const vehicle = {
            id: randomUUID(),
            ownerId: input.ownerId,
            nickname: input.nickname ?? null,
            vin: input.vin ?? null,
            year: input.year,
            make: input.make,
            model: input.model,
            currentOdometer: input.currentOdometer ?? null,
            createdAt: now,
            updatedAt: now
        };

        this.insertVehicleStmt.run(vehicle);

        return vehicle;
    }

    listVehicles(ownerId: string) {
        return this.listVehiclesStmt.all(ownerId);
    }

    getVehicle(vehicleId: string, ownerId: string) {
        return this.getVehicleStmt.get(vehicleId, ownerId);
    }

    deleteVehicle(vehicleId: string, ownerId: string) {
        const result = this.deleteVehicleStmt.run(vehicleId, ownerId);

        return {
            deleted: result.changes > 0
        };
    }

    close() {
        this.db.close();
    }
}