import { Module } from '@nitrostack/core';
import { VehicleTools } from './vehicles.tools.js';
import { SQLiteService } from '../../services/sqlite.service.js';
import { SmartcarService } from "../../services/smartcar.service.js";

@Module({
    name: "vehicles",
    description: "Vehicle management and maintenance tracking",
    controllers: [VehicleTools],
    providers: [SQLiteService,SmartcarService]
})
export class VehiclesModule { }
