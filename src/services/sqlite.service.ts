import { Injectable } from '@nitrostack/core';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SQLiteService {
    private db!: Database<sqlite3.Database, sqlite3.Statement>;

    async init() {
        const dbPath = 'data/garage.db';

        mkdirSync(dirname(dbPath), { recursive: true });

        this.db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await this.db.exec('PRAGMA foreign_keys = ON;');

        await this.initialize();
    }

    private async initialize() {
        await this.db.exec(`
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
    }

    async createVehicle(input: {
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

    async listVehicles(ownerId: string) {
        return this.db.all(
            `
            SELECT *
            FROM vehicles
            WHERE owner_id = ?
            ORDER BY created_at DESC
            `,
            [ownerId]
        );
    }

    async getVehicle(vehicleId: string, ownerId: string) {
        return this.db.get(
            `
            SELECT *
            FROM vehicles
            WHERE id = ?
              AND owner_id = ?
            `,
            [vehicleId, ownerId]
        );
    }

    async deleteVehicle(vehicleId: string, ownerId: string) {
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

    async close() {
        await this.db.close();
    }
}