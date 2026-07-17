import {
    ToolDecorator as Tool,
    ExecutionContext,
    Injectable,
    UseGuards,
    z
} from "@nitrostack/core";

import { OAuthGuard } from "../../guards/oauth.guard.js";
import { SQLiteService } from "../../services/sqlite.service.js";
import { CalendarService } from "../../services/calendar.service.js";

const AddMaintenanceRecordSchema = z.object({
    vehicleId: z.string().describe("The ID of the vehicle."),
    serviceType: z.string().describe("Type of maintenance performed."),
    performedAt: z.string().describe("Date the service was performed (ISO 8601)."),
    odometer: z.number().int().min(0).optional(),
    cost: z.number().min(0).optional(),
    notes: z.string().optional(),

    nextDueDate: z
        .string()
        .describe("Next recommended service date (ISO 8601).")
        .optional(),

    nextDueOdometer: z
        .number()
        .int()
        .min(0)
        .optional()
});

type AddMaintenanceRecordInput = z.infer<typeof AddMaintenanceRecordSchema>;

const ListMaintenanceHistorySchema = z.object({
    vehicleId: z.string().describe("The ID of the vehicle.")
});

type ListMaintenanceHistoryInput = z.infer<typeof ListMaintenanceHistorySchema>;

const ScheduleMaintenanceSchema = z.object({
    vehicleId: z.string().describe("The ID of the vehicle."),
    title: z.string().describe("Maintenance title (e.g. 'Oil Change')."),
    start: z.string().describe("Start date/time in ISO 8601 format."),
    end: z.string().describe("End date/time in ISO 8601 format."),
    description: z.string().optional(),
    location: z.string().optional()
});

type ScheduleMaintenanceInput = z.infer<typeof ScheduleMaintenanceSchema>;

@Injectable({
    deps: [SQLiteService, CalendarService]
})
export class MaintenanceTools {

    constructor(
        private sqlite: SQLiteService,
        private calendar: CalendarService
    ) { }

    @Tool({
        name: "add_maintenance_record",
        description:
            "Record maintenance performed on one of the authenticated user's vehicles.",
        inputSchema: AddMaintenanceRecordSchema
    })
    @UseGuards(OAuthGuard)
    async addMaintenanceRecord(
        input: AddMaintenanceRecordInput,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        if (!ownerId) {
            throw new Error("User is not authenticated.");
        }

        const vehicle = await this.sqlite.getVehicle(
            input.vehicleId,
            ownerId
        );

        if (!vehicle) {
            throw new Error("Vehicle not found.");
        }

        const record = await this.sqlite.createMaintenanceRecord({
            vehicleId: input.vehicleId,
            serviceType: input.serviceType,
            performedAt: input.performedAt,
            odometer: input.odometer,
            cost: input.cost,
            notes: input.notes,
            nextDueDate: input.nextDueDate,
            nextDueOdometer: input.nextDueOdometer
        });

        return {
            success: true,
            message: "Maintenance record added successfully.",
            record
        };
    }

    @Tool({
        name: "list_maintenance_history",
        description: "List all maintenance records for one of the authenticated user's vehicles.",
        inputSchema: ListMaintenanceHistorySchema
    })
    @UseGuards(OAuthGuard)
    async listMaintenanceHistory(
        input: ListMaintenanceHistoryInput,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        if (!ownerId) {
            throw new Error("User is not authenticated.");
        }

        const vehicle = await this.sqlite.getVehicle(
            input.vehicleId,
            ownerId
        );

        if (!vehicle) {
            throw new Error("Vehicle not found.");
        }

        const history = await this.sqlite.listMaintenanceHistory(
            input.vehicleId,
            ownerId
        );

        return {
            success: true,
            vehicle: {
                id: vehicle.id,
                nickname: vehicle.nickname,
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model
            },
            count: history.length,
            history
        };
    }

    @Tool({
        name: "schedule_maintenance",
        description: "Create a maintenance reminder in the user's Google Calendar.",
        inputSchema: ScheduleMaintenanceSchema
    })
    @UseGuards(OAuthGuard)
    async scheduleMaintenance(
        input: ScheduleMaintenanceInput,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject;

        if (!ownerId) {
            throw new Error("User is not authenticated.");
        }

        const vehicle = await this.sqlite.getVehicle(
            input.vehicleId,
            ownerId
        );

        if (!vehicle) {
            throw new Error("Vehicle not found.");
        }

        const event = await this.calendar.createEvent({
            title: `${input.title} - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            description: input.description,
            location: input.location,
            start: input.start,
            end: input.end
        });

        return {
            success: true,
            message: "Maintenance reminder added to Google Calendar.",
            vehicle: {
                id: vehicle.id,
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model
            },
            event
        };
    }
}