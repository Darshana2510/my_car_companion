import { Injectable } from '@nitrostack/core';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface Vehicle {
    id: string;
    ownerId: string;

    nickname: string | null;
    vin: string | null;

    year: number;
    make: string;
    model: string;

    currentOdometer: number | null;

    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class SQLiteService {
    private db!: Database<sqlite3.Database, sqlite3.Statement>;
    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) {
            return;
        }

        const dbPath = 'data/garage.db';

        mkdirSync(dirname(dbPath), { recursive: true });

        this.db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await this.db.exec(`
            PRAGMA foreign_keys = ON;
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
        `);

        await this.initialize();

        this.initialized = true;
    }

    private async initialize(): Promise<void> {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS vehicles (
                id TEXT PRIMARY KEY,

                owner_id TEXT NOT NULL,

                nickname TEXT,
                vin TEXT UNIQUE,

                year INTEGER NOT NULL,
                make TEXT NOT NULL,
                model TEXT NOT NULL,

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
                    ON DELETE CASCADE
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

                created_at TEXT NOT NULL,

                FOREIGN KEY(vehicle_id)
                    REFERENCES vehicles(id)
                    ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_fuel_vehicle
            ON fuel_logs(vehicle_id);
        `);
    }

    private mapVehicle(row: any): Vehicle | null {
        if (!row) {
            return null;
        }

        return {
            id: row.id,
            ownerId: row.owner_id,

            nickname: row.nickname,
            vin: row.vin,

            year: row.year,
            make: row.make,
            model: row.model,

            currentOdometer: row.current_odometer,

            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async createVehicle(input: {
        ownerId: string;
        nickname?: string;
        vin?: string;
        year: number;
        make: string;
        model: string;
        currentOdometer?: number;
    }): Promise<Vehicle> {
        await this.init();

        const now = new Date().toISOString();

        const vehicle: Vehicle = {
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

        await this.db.run(
            `
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                vehicle.id,
                vehicle.ownerId,
                vehicle.nickname,
                vehicle.vin,
                vehicle.year,
                vehicle.make,
                vehicle.model,
                vehicle.currentOdometer,
                vehicle.createdAt,
                vehicle.updatedAt
            ]
        );

        return vehicle;
    }

    async listVehicles(ownerId: string): Promise<Vehicle[]> {
        await this.init();

        const rows = await this.db.all(
            `
            SELECT *
            FROM vehicles
            WHERE owner_id = ?
            ORDER BY created_at DESC
            `,
            [ownerId]
        );

        return rows.map(row => this.mapVehicle(row)!);
    }

    async getVehicle(
        vehicleId: string,
        ownerId: string
    ): Promise<Vehicle | null> {
        await this.init();

        const row = await this.db.get(
            `
            SELECT *
            FROM vehicles
            WHERE id = ?
              AND owner_id = ?
            `,
            [vehicleId, ownerId]
        );

        return this.mapVehicle(row);
    }

    async deleteVehicle(
        vehicleId: string,
        ownerId: string
    ): Promise<{ deleted: boolean }> {
        await this.init();

        const result = await this.db.run(
            `
            DELETE
            FROM vehicles
            WHERE id = ?
              AND owner_id = ?
            `,
            [vehicleId, ownerId]
        );

        return {
            deleted: (result.changes ?? 0) > 0
        };
    }

    async createMaintenanceRecord(input: {
        vehicleId: string;
        serviceType: string;
        performedAt: string;
        odometer?: number;
        cost?: number;
        notes?: string;
        nextDueDate?: string;
        nextDueOdometer?: number;
    }) {
        const now = new Date().toISOString();

        const record = {
            id: randomUUID(),
            vehicleId: input.vehicleId,
            serviceType: input.serviceType,
            performedAt: input.performedAt,
            odometer: input.odometer ?? null,
            cost: input.cost ?? null,
            notes: input.notes ?? null,
            nextDueDate: input.nextDueDate ?? null,
            nextDueOdometer: input.nextDueOdometer ?? null,
            createdAt: now
        };

        await this.db.run(
            `
        INSERT INTO maintenance_records (
            id,
            vehicle_id,
            service_type,
            performed_at,
            odometer,
            cost,
            notes,
            next_due_date,
            next_due_odometer,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
                record.id,
                record.vehicleId,
                record.serviceType,
                record.performedAt,
                record.odometer,
                record.cost,
                record.notes,
                record.nextDueDate,
                record.nextDueOdometer,
                record.createdAt
            ]
        );

        return record;
    }

    async listMaintenanceHistory(
        vehicleId: string,
        ownerId: string
    ) {
        return this.db.all(
            `
        SELECT
            mr.id,
            mr.vehicle_id,
            mr.service_type,
            mr.performed_at,
            mr.odometer,
            mr.cost,
            mr.notes,
            mr.next_due_date,
            mr.next_due_odometer,
            mr.created_at
        FROM maintenance_records mr
        INNER JOIN vehicles v
            ON mr.vehicle_id = v.id
        WHERE mr.vehicle_id = ?
          AND v.owner_id = ?
        ORDER BY mr.performed_at DESC
        `,
            [vehicleId, ownerId]
        );
    }

    async close(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        await this.db.close();
        this.initialized = false;
    }
}