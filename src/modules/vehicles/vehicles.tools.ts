import {
    ToolDecorator as Tool,
    ExecutionContext,
    Injectable,
    UseGuards,
    z
} from "@nitrostack/core";

import { OAuthGuard } from '../../guards/oauth.guard.js';
import { SQLiteService } from "../../services/sqlite.service.js";
import { SmartcarService } from "../../services/smartcar.service.js";

// ============================================================================
// VEHICLE MANAGEMENT SCHEMAS
// ============================================================================

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

// ============================================================================
// SMARTCAR INTEGRATION SCHEMAS
// ============================================================================

const SmartcarAuthSchema = z.object({
    code: z.string().describe("OAuth authorization code from Smartcar"),
    state: z.string().optional().describe("State parameter for CSRF protection")
});

const GetSmartcarVehiclesSchema = z.object({
    accessToken: z.string().describe("Smartcar API access token")
});

const GetVehicleFuelSchema = z.object({
    vehicleId: z.string().describe("Vehicle ID from local database"),
    smartcarVehicleId: z.string().describe("Vehicle ID from Smartcar"),
    accessToken: z.string().describe("Smartcar API access token")
});

const GetVehicleLocationSchema = z.object({
    vehicleId: z.string().describe("Vehicle ID from local database"),
    smartcarVehicleId: z.string().describe("Vehicle ID from Smartcar"),
    accessToken: z.string().describe("Smartcar API access token")
});

const GetVehicleOdometerSchema = z.object({
    vehicleId: z.string().describe("Vehicle ID from local database"),
    smartcarVehicleId: z.string().describe("Vehicle ID from Smartcar"),
    accessToken: z.string().describe("Smartcar API access token")
});

// ============================================================================
// VEHICLE TOOLS CONTROLLER
// ============================================================================

@Injectable({
    deps: [SQLiteService, SmartcarService]
})
export class VehicleTools {

    constructor(
        private sqlite: SQLiteService,
        private smartcar: SmartcarService
    ) { }

    // ========================================================================
    // LOCAL DATABASE TOOLS (Existing)
    // ========================================================================

    /**
     * Add a vehicle to the authenticated user's garage
     * Stores vehicle information in local SQLite database
     */
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

    /**
     * List all vehicles belonging to the authenticated user
     * Retrieved from local SQLite database
     */
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

        ctx.logger.info("Listing vehicles", { ownerId });

        const vehicles = await this.sqlite.listVehicles(ownerId);

        return {
            success: true,
            count: vehicles.length,
            vehicles
        };
    }

    // ========================================================================
    // SMARTCAR INTEGRATION TOOLS (New)
    // ========================================================================

    /**
     * Generate Smartcar OAuth authorization URL
     * Direct user to this URL to connect their vehicle(s)
     */
    @Tool({
        name: "get_smartcar_auth_url",
        description: "Generate the Smartcar OAuth authorization URL for connecting vehicles. Redirect your user to this URL.",
        inputSchema: z.object({})
    })
    async getSmartcarAuthUrl(
        _: {},
        ctx: ExecutionContext
    ) {
        ctx.logger.info("Generating Smartcar auth URL");

        const state = Math.random().toString(36).substring(7);
        const authUrl = this.smartcar.getAuthorizationUrl(state);

        return {
            success: true,
            authUrl,
            state,
            message: "Redirect user to this URL to authorize Smartcar access"
        };
    }

    /**
     * Exchange Smartcar authorization code for access token
     * Call this after user authorizes in Smartcar OAuth flow
     */
    @Tool({
        name: "exchange_smartcar_code",
        description: "Exchange Smartcar authorization code for access token. Call this in your OAuth callback.",
        inputSchema: SmartcarAuthSchema
    })
    @UseGuards(OAuthGuard)
    async exchangeSmartcarCode(
        input: z.infer<typeof SmartcarAuthSchema>,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Exchanging Smartcar authorization code", {
            ownerId,
            hasCode: !!input.code
        });

        try {
            const tokenResponse = await this.smartcar.exchangeCodeForToken(input.code);

            ctx.logger.info("Successfully exchanged Smartcar code for token", {
                ownerId,
                tokenType: tokenResponse.token_type
            });

            return {
                success: true,
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                expiresIn: tokenResponse.expires_in,
                message: "Token exchange successful. Store the refresh token securely."
            };
        } catch (error) {
            ctx.logger.error("Failed to exchange Smartcar code", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get all connected vehicles from Smartcar
     * Requires valid Smartcar access token
     */
    @Tool({
        name: "get_smartcar_vehicles",
        description: "Get all vehicles connected to Smartcar for this user.",
        inputSchema: GetSmartcarVehiclesSchema
    })
    @UseGuards(OAuthGuard)
    async getSmartcarVehicles(
        input: z.infer<typeof GetSmartcarVehiclesSchema>,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching Smartcar vehicles", { ownerId });

        try {
            const vehicles = await this.smartcar.getVehicles(input.accessToken);

            ctx.logger.info("Successfully fetched Smartcar vehicles", {
                ownerId,
                count: vehicles.length
            });

            return {
                success: true,
                count: vehicles.length,
                vehicles,
                message: `Found ${vehicles.length} connected vehicle(s)`
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch Smartcar vehicles", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get vehicle info (make, model, year) from Smartcar
     */
    @Tool({
        name: "get_smartcar_vehicle_info",
        description: "Get detailed vehicle information from Smartcar (make, model, year, etc).",
        inputSchema: z.object({
            smartcarVehicleId: z.string(),
            accessToken: z.string()
        })
    })
    @UseGuards(OAuthGuard)
    async getSmartcarVehicleInfo(
        input: any,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching vehicle info from Smartcar", {
            ownerId,
            vehicleId: input.smartcarVehicleId
        });

        try {
            const info = await this.smartcar.getVehicleInfo(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                vehicleInfo: info
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch vehicle info", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get fuel level from Smartcar
     * Returns percentage remaining, amount remaining, and capacity
     */
    @Tool({
        name: "get_vehicle_fuel",
        description: "Get current fuel level and capacity from Smartcar.",
        inputSchema: GetVehicleFuelSchema
    })
    @UseGuards(OAuthGuard)
    async getVehicleFuel(
        input: z.infer<typeof GetVehicleFuelSchema>,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching fuel status from Smartcar", {
            ownerId,
            vehicleId: input.vehicleId
        });

        try {
            const fuel = await this.smartcar.getFuel(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                fuel,
                message: `Fuel: ${fuel.percentRemaining}% (${fuel.amountRemaining} / ${fuel.capacity} units)`
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch fuel status", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get battery level from Smartcar (for electric vehicles)
     */
    @Tool({
        name: "get_vehicle_battery",
        description: "Get battery level for electric vehicles.",
        inputSchema: z.object({
            smartcarVehicleId: z.string(),
            accessToken: z.string()
        })
    })
    @UseGuards(OAuthGuard)
    async getVehicleBattery(
        input: any,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching battery status from Smartcar", {
            ownerId,
            vehicleId: input.smartcarVehicleId
        });

        try {
            const battery = await this.smartcar.getBattery(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                battery,
                message: `Battery: ${battery.percentRemaining}% (Range: ${battery.range} miles)`
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch battery status", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get vehicle location from Smartcar
     * Returns latitude and longitude
     */
    @Tool({
        name: "get_vehicle_location",
        description: "Get current vehicle GPS location from Smartcar.",
        inputSchema: GetVehicleLocationSchema
    })
    @UseGuards(OAuthGuard)
    async getVehicleLocation(
        input: z.infer<typeof GetVehicleLocationSchema>,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching vehicle location from Smartcar", {
            ownerId,
            vehicleId: input.vehicleId
        });

        try {
            const location = await this.smartcar.getLocation(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                location,
                message: `Location: ${location.latitude}, ${location.longitude}`,
                mapsUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch vehicle location", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get odometer reading from Smartcar
     */
    @Tool({
        name: "get_vehicle_odometer",
        description: "Get current odometer reading from Smartcar.",
        inputSchema: GetVehicleOdometerSchema
    })
    @UseGuards(OAuthGuard)
    async getVehicleOdometer(
        input: z.infer<typeof GetVehicleOdometerSchema>,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching odometer reading from Smartcar", {
            ownerId,
            vehicleId: input.vehicleId
        });

        try {
            const odometer = await this.smartcar.getOdometer(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                odometer,
                message: `Odometer: ${odometer.value.toLocaleString()} miles`
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch odometer reading", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get engine oil life from Smartcar
     */
    @Tool({
        name: "get_vehicle_engine_oil",
        description: "Get engine oil life percentage from Smartcar.",
        inputSchema: z.object({
            smartcarVehicleId: z.string(),
            accessToken: z.string()
        })
    })
    @UseGuards(OAuthGuard)
    async getVehicleEngineOil(
        input: any,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching engine oil status from Smartcar", {
            ownerId,
            vehicleId: input.smartcarVehicleId
        });

        try {
            const oil = await this.smartcar.getEngineOil(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                oil,
                message: `Engine Oil Life: ${oil.lifeRemaining}% remaining`
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch engine oil status", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Get tire pressure from Smartcar
     */
    @Tool({
        name: "get_vehicle_tire_pressure",
        description: "Get tire pressure readings for all four tires from Smartcar.",
        inputSchema: z.object({
            smartcarVehicleId: z.string(),
            accessToken: z.string()
        })
    })
    @UseGuards(OAuthGuard)
    async getVehicleTirePressure(
        input: any,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Fetching tire pressure from Smartcar", {
            ownerId,
            vehicleId: input.smartcarVehicleId
        });

        try {
            const tires = await this.smartcar.getTirePressure(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                tires,
                message: `Tire Pressure - FL: ${tires.frontLeft}PSI, FR: ${tires.frontRight}PSI, RL: ${tires.rearLeft}PSI, RR: ${tires.rearRight}PSI`
            };
        } catch (error) {
            ctx.logger.error("Failed to fetch tire pressure", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Lock vehicle via Smartcar
     */
    @Tool({
        name: "lock_vehicle",
        description: "Lock the vehicle via Smartcar API.",
        inputSchema: z.object({
            smartcarVehicleId: z.string(),
            accessToken: z.string()
        })
    })
    @UseGuards(OAuthGuard)
    async lockVehicle(
        input: any,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Locking vehicle via Smartcar", {
            ownerId,
            vehicleId: input.smartcarVehicleId
        });

        try {
            const result = await this.smartcar.lockVehicle(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                result,
                message: "Vehicle locked successfully"
            };
        } catch (error) {
            ctx.logger.error("Failed to lock vehicle", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Unlock vehicle via Smartcar
     */
    @Tool({
        name: "unlock_vehicle",
        description: "Unlock the vehicle via Smartcar API.",
        inputSchema: z.object({
            smartcarVehicleId: z.string(),
            accessToken: z.string()
        })
    })
    @UseGuards(OAuthGuard)
    async unlockVehicle(
        input: any,
        ctx: ExecutionContext
    ) {
        const ownerId = ctx.auth?.subject ?? "demo-user";

        ctx.logger.info("Unlocking vehicle via Smartcar", {
            ownerId,
            vehicleId: input.smartcarVehicleId
        });

        try {
            const result = await this.smartcar.unlockVehicle(
                input.smartcarVehicleId,
                input.accessToken
            );

            return {
                success: true,
                result,
                message: "Vehicle unlocked successfully"
            };
        } catch (error) {
            ctx.logger.error("Failed to unlock vehicle", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }
}
