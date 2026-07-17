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

@Injectable({
    deps: [SQLiteService]
})
export class VehicleTools {

    constructor(
        private sqlite: SQLiteService
    ) { }

    // @Tool({
    //     name: "add_vehicle",
    //     description:
    //         "Add a vehicle to the authenticated user's garage.",

    //     inputSchema: AddVehicleSchema,

    //     examples: {
    //         request: {
    //             nickname: "Daily Driver",
    //             year: 2020,
    //             make: "Honda",
    //             model: "Civic",
    //             vin: "2HGFC2F69LH000001",
    //             currentOdometer: 62500
    //         },

    //         response: {
    //             success: true,
    //             vehicle: {
    //                 id: "veh_xxxxx",
    //                 nickname: "Daily Driver",
    //                 year: 2020,
    //                 make: "Honda",
    //                 model: "Civic"
    //             }
    //         }
    //     }
    // })
    // @UseGuards(OAuthGuard)
    // @Widget("vehicle-list")
    // async addVehicle(
    //     input: AddVehicleInput,
    //     ctx: ExecutionContext
    // ) {

    //     ctx.logger.info("Adding vehicle", {
    //         user: ctx.auth?.subject,
    //         make: input.make,
    //         model: input.model,
    //         year: input.year
    //     });

    //     // TODO - create a helper function to get the authenticated user ID from the context
    //     const ownerId = ctx.auth?.subject;

    //     if (!ownerId) {
    //         throw new Error("Authenticated user not found.");
    //     }

    //     const vehicle = this.sqlite.createVehicle({
    //         ownerId,
    //         ...input
    //     });

    //     ctx.logger.info("Vehicle created", {
    //         user: ctx.auth?.subject,
    //         vehicleId: vehicle.id
    //     });

    //     return {
    //         success: true,
    //         message: "Vehicle added successfully.",
    //         vehicle
    //     };
    // }
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
        const ownerId = ctx.auth?.subject;

        if (!ownerId) {
            throw new Error("User is not authenticated.");
        }

        // const vehicle = this.sqlite.createVehicle({
        //     ownerId,
        //     ...input
        // });

        return {
            success: true,
            message: "Vehicle added successfully.",
            // vehicle
        };
    }

    // @Tool(...)
    // @UseGuards(OAuthGuard)
    // @Widget("vehicle-list")
    // async listVehicles(...) { }

    // @Tool(...)
    // @UseGuards(OAuthGuard)
    // async getVehicle(...) { }

    // @Tool(...)
    // @UseGuards(OAuthGuard)
    // async deleteVehicle(...) { }

}
