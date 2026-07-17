import {
    ToolDecorator as Tool,
    ExecutionContext,
    Injectable,
    UseGuards,
    Widget,
    z
} from "@nitrostack/core";

import { OAuthGuard } from '../../guards/oauth.guard.js';
import { SQLiteService } from "../../services/sqlite.service.js";

const AddVehicleSchema = z.object({
    nickname: z.string().min(1).max(50).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    make: z.string().min(1),
    model: z.string().min(1),
    vin: z.string().length(17).optional(),
    currentOdometer: z.number().int().min(0).optional()
});

type AddVehicleInput = z.infer<typeof AddVehicleSchema>;

const ListVehiclesSchema = z.object({});

@Injectable({
    deps: [SQLiteService]
})
export class VehicleTools {

    constructor(
        private sqlite: SQLiteService
    ) { }

    @Tool({
        name: "add_vehicle",
        description: "Add a vehicle to the authenticated user's garage.",
        inputSchema: AddVehicleSchema
    })
    @UseGuards(OAuthGuard)
    async addVehicle(
        input: AddVehicleInput,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        if (!ownerId) {
            throw new Error("User is not authenticated.");
        }

        ctx.logger.info("Adding vehicle", {
            ownerId,
            make: input.make,
            model: input.model,
            year: input.year
        });

        const vehicle = await this.sqlite.createVehicle({
            ownerId,
            ...input
        });

        ctx.logger.info("Vehicle created", {
            ownerId,
            vehicleId: vehicle.id
        });

        return {
            success: true,
            message: "Vehicle added successfully.",
            vehicle
        };
    }

    @Tool({
        name: "list_vehicles",
        description: "List all vehicles belonging to the authenticated user.",
        inputSchema: ListVehiclesSchema
    })
    @UseGuards(OAuthGuard)
    async listVehicles(
        _: z.infer<typeof ListVehiclesSchema>,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        if (!ownerId) {
            throw new Error("User is not authenticated.");
        }

        const vehicles = await this.sqlite.listVehicles(ownerId);

        return {
            success: true,
            count: vehicles.length,
            vehicles
        };
    }

    // @Tool(...)
    // @UseGuards(OAuthGuard)
    // async getVehicle(...) { }

    // @Tool(...)
    // @UseGuards(OAuthGuard)
    // async deleteVehicle(...) { }

}
