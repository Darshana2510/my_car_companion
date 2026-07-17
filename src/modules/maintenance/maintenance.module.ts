import { Module } from "@nitrostack/core";

import { MaintenanceTools } from "./maintenance.tools.js";
import { SQLiteService } from "../../services/sqlite.service.js";

@Module({
    name: "maintenance",
    description: "Vehicle maintenance tracking and scheduling",
    controllers: [MaintenanceTools],
    providers: [SQLiteService]
})
export class MaintenanceModule {}