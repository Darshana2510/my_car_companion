import { Module } from "@nitrostack/core";

import { MaintenanceTools } from "./maintenance.tools.js";
import { SQLiteService } from "../../services/sqlite.service.js";
import { CalendarService } from "../../services/calendar.service.js";

@Module({
    name: "maintenance",
    description: "Vehicle maintenance tracking and scheduling",
    controllers: [MaintenanceTools],
    providers: [SQLiteService, CalendarService]
})
export class MaintenanceModule {}