# Complete Repository Architecture & MCP Server Guide

## 📋 Repository Overview

This is a **NitroStack MCP (Model Context Protocol) Server** with OAuth 2.1 authentication and vehicle management capabilities powered by Smartcar API integration.

```
my_car_companion/
├── src/
│   ├── app.module.ts                 # Root application module (bootstraps MCP server)
│   ├── index.ts                      # Entry point - starts the server
│   ├── modules/
│   │   ├── vehicles/                 # Vehicle management module
│   │   │   ├── vehicles.module.ts   # Module definition with DI providers
│   │   │   └── vehicles.tools.ts    # Exposed tools (add_vehicle, list_vehicles)
│   │   ├── flights/                  # Flight booking module (disabled)
│   │   └── maintenance/              # Maintenance tracking module (skeleton)
│   ├── services/
│   │   ├── smartcar.service.ts      # ✅ Smartcar API integration (newly added)
│   │   ├── sqlite.service.ts        # SQLite database service
│   │   ├── duffel.service.ts        # Flight booking API service
│   │   ├── calendar.service.ts      # Calendar integration (empty)
│   │   └── nhtsa.service.ts         # NHTSA vehicle data (empty)
│   ├── guards/
│   │   └── oauth.guard.ts           # OAuth authentication guard
│   ├── health/
│   │   └── system.health.ts         # Server health check
│   └── database/                     # Database utilities (skeleton)
├── .env.example                      # Environment variables template (updated)
├── package.json                      # Dependencies and scripts
├── SMARTCAR_INTEGRATION.md          # ✅ Smartcar integration guide (newly added)
└── README.md                         # Project documentation

Database Files (created at runtime):
data/
└── garage.db                         # SQLite database with vehicles, maintenance records, fuel logs
```

---

## 🏗️ Architecture Breakdown

### 1. **Dependency Injection Container (NitroStack Core)**

NitroStack uses **decorators** for dependency injection similar to NestJS:

```typescript
// Service Registration
@Injectable()
export class SmartcarService { }

// Module Configuration
@Module({
  providers: [SQLiteService, SmartcarService],  // Services available for injection
  controllers: [VehicleTools]                   // Controllers using services
})
export class VehiclesModule { }

// Tool Injection
@Injectable({ deps: [SQLiteService, SmartcarService] })
export class VehicleTools {
  constructor(
    private sqlite: SQLiteService,
    private smartcar: SmartcarService
  ) { }
}
```

### 2. **Module Hierarchy**

```
AppModule (root)
├── ConfigModule.forRoot()           # Environment variable configuration
├── OAuthModule.forRoot({...})       # OAuth 2.1 authentication
├── VehiclesModule                   # Vehicle management
│   ├── SQLiteService
│   ├── SmartcarService
│   └── VehicleTools (controllers)
└── SystemHealthCheck (providers)
```

### 3. **Service Layer**

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| `SmartcarService` | Vehicle data from Smartcar API | None (uses fetch) |
| `SQLiteService` | Local vehicle database storage | sqlite3, sqlite package |
| `DuffelService` | Flight booking API | @duffel/api package |

---

## 🚀 What Happens When You Run `npm run dev`

### **Step 1: Server Startup**

```bash
$ npm run dev
# Executes: nitrostack-cli dev

# Output:
🔐 Starting Calculator MCP Server with OAuth 2.1...

✅ OAuth 2.1 Module configured
   Resource URI: http://localhost:3000
   Auth Server: https://dev-5dt0utuk31h13tjm.us.auth0.com
   Scopes: read, write, admin, vehicle:read, vehicle:write, maintenance:read, maintenance:write, calendar:write
   Audience: http://localhost:3000
   Enforcement: OFF (dev mode — set OAUTH_REQUIRED=true to enforce)
```

### **Step 2: Initialization Order**

1. **Environment Variables Loaded** → `.env` parsed via dotenv
2. **ConfigModule** → Reads all process.env variables
3. **OAuthModule** → Initializes OAuth 2.1 with Auth0
4. **Database Init** → `SQLiteService.init()` creates `data/garage.db`
5. **Services Instantiated** → All `@Injectable()` classes created
6. **Tools Registered** → MCP protocol exposes tools
7. **Health Checks** → System health endpoint ready

### **Step 3: Database Initialization**

```typescript
// SQLiteService automatically creates tables:

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
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fuel_logs (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  filled_at TEXT NOT NULL,
  odometer INTEGER NOT NULL,
  litres REAL NOT NULL,
  price REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

---

## 🔌 MCP Tools Exposed (OpenAI Apps SDK)

When you connect to this MCP server via OpenAI Apps SDK or Claude, these tools are available:

### **Available Tools**

```json
{
  "tools": [
    {
      "name": "add_vehicle",
      "description": "Add a vehicle to the authenticated user's garage.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "nickname": { "type": "string", "minLength": 1, "maxLength": 50 },
          "year": { "type": "number", "minimum": 1900 },
          "make": { "type": "string" },
          "model": { "type": "string" },
          "vin": { "type": "string", "length": 17 },
          "currentOdometer": { "type": "number", "minimum": 0 }
        },
        "required": ["year", "make", "model"]
      }
    },
    {
      "name": "list_vehicles",
      "description": "List all vehicles belonging to the authenticated user.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    }
  ]
}
```

---

## 📡 Request/Response Flow

### **Example 1: Add a Vehicle**

```
┌─────────────────────────────────────────────────────────────┐
│ Claude/OpenAI Apps SDK                                       │
│ (Calling the MCP Server)                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ MCP Call Handler   │
        │ (NitroStack Core)  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ 1. Parse Tool Input                │
        │    {                               │
        │      "make": "Toyota",             │
        │      "model": "Camry",             │
        │      "year": 2023                 │
        │    }                               │
        └────────┬───────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ 2. Validate with Zod Schema        │
        │    ✓ All required fields present   │
        │    ✓ Year in valid range           │
        └────────┬───────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ 3. Apply OAuthGuard                │
        │    ✓ Token validated               │
        │    ✓ User ID extracted: "demo-user"│
        └────────┬───────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ 4. Execute addVehicle()            │
        │    - Generate UUID                 │
        │    - Get timestamp                 │
        │    - Create vehicle object         │
        └────────┬───────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ 5. Insert into SQLite              │
        │    INSERT INTO vehicles (...)      │
        │    VALUES (...)                    │
        │    ✓ Inserted with ID: xyz-123    │
        └────────┬───────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ 6. Return Response                 │
        │    {                               │
        │      "success": true,              │
        │      "message": "...",             │
        │      "vehicle": {                  │
        │        "id": "xyz-123",            │
        │        "ownerId": "demo-user",     │
        │        "make": "Toyota",           │
        │        "model": "Camry",           │
        │        "year": 2023,               │
        │        "createdAt": "2026-07-18.."│
        │      }                             │
        │    }                               │
        └────────┬───────────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────────┐
        │ Claude/OpenAI Apps SDK             │
        │ (Receives Response)                │
        └────────────────────────────────────┘
```

### **Example 2: List Vehicles**

```
Claude Request:
  "Can you show me all my vehicles?"

MCP Flow:
1. Parse request → "list_vehicles" tool
2. Input validation → empty schema (no parameters needed)
3. OAuth check → Extract user ID: "demo-user"
4. Execute SQL query:
   SELECT * FROM vehicles 
   WHERE owner_id = 'demo-user' 
   ORDER BY created_at DESC
5. Map rows to Vehicle objects
6. Return response:
   {
     "success": true,
     "count": 2,
     "vehicles": [
       {
         "id": "xyz-123",
         "ownerId": "demo-user",
         "make": "Toyota",
         "model": "Camry",
         "year": 2023,
         "nickname": "My Camry",
         "vin": null,
         "currentOdometer": 25000,
         "createdAt": "2026-07-18T...",
         "updatedAt": "2026-07-18T..."
       },
       ...
     ]
   }
```

---

## 🔐 OAuth Authentication Flow

### **Without OAuth Enforcement (Dev Mode)**

```
MCP Request
    ↓
No OAuth Guard Applied (OAUTH_REQUIRED=false)
    ↓
Request Processed
    ↓
Default User: "demo-user"
```

### **With OAuth Enforcement (Production)**

```
MCP Request (includes Bearer Token)
    ↓
OAuthGuard Validation
    ├─ Parse JWT/Token
    ├─ Verify Signature (JWKS)
    ├─ Check Audience (RESOURCE_URI)
    ├─ Check Issuer (AUTH_SERVER_URL)
    ├─ Check Expiration
    └─ Custom Validation Function
    ↓
Extract ctx.auth?.subject (User ID)
    ↓
Request Processed with User ID
```

---

## 🚗 SmartcarService Integration Points

### **Where Smartcar Can Be Used**

```typescript
// In a new tool (example):
@Tool({
  name: "get_vehicle_fuel_status",
  description: "Get fuel status from Smartcar API"
})
@UseGuards(OAuthGuard)
async getFuelStatus(input: { vehicleId: string }, ctx: ExecutionContext) {
  // Get access token for Smartcar (stored in database)
  const smartcarToken = await this.db.getSmartcarToken(ctx.auth.subject);
  
  // Call Smartcar API
  const fuel = await this.smartcar.getFuel(input.vehicleId, smartcarToken.access_token);
  
  // Store result in SQLite
  await this.db.logFuelStatus(input.vehicleId, fuel);
  
  return fuel;
}
```

---

## 📊 Data Flow Diagram

```
┌──────────────────────────────┐
│  Claude/OpenAI Apps SDK      │
│  (Frontend/Client)           │
└──────────────┬───────────────┘
               │
               ▼ (HTTP/SSE)
┌──────────────────────────────────────────┐
│  MCP Server (NitroStack)                 │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Request Handler                    │  │
│  │ - Parse tool call                  │  │
│  │ - Validate input schema (Zod)      │  │
│  │ - Check OAuth permissions          │  │
│  └────────────────┬───────────────────┘  │
│                   │                      │
│        ┌──────────┴──────────┐           │
│        ▼                     ▼           │
│  ┌──────────────┐   ┌──────────────┐   │
│  │ VehicleTools │   │ Service      │   │
│  │ (Controllers)│   │ Orchestration│   │
│  └──────┬───────┘   └──────┬───────┘   │
│         │                  │            │
│    ┌────┴──────────────────┴────┐      │
│    ▼                            ▼      │
│  ┌────────────────┐   ┌──────────────┐ │
│  │ SQLiteService  │   │ SmartcarAPI  │ │
│  │ (Local DB)     │   │ (Ext. API)   │ │
│  └────────┬───────┘   └──────┬───────┘ │
└───────────┼──────────────────┼──────────┘
            │                  │
            ▼                  ▼
  ┌──────────────┐   ┌──────────────────┐
  │ data/        │   │ https://        │
  │ garage.db    │   │ sandbox.smartcar│
  │              │   │ .com/v2.0       │
  │ - vehicles   │   │                  │
  │ - maint.     │   │ Returns:         │
  │ - fuel logs  │   │ - fuel status    │
  │              │   │ - location       │
  │              │   │ - odometer       │
  │              │   │ - battery        │
  └──────────────┘   └──────────────────┘
```

---

## 🔄 Complete Request Lifecycle Example

### **Scenario: Claude asks "What's the fuel level of my car?"**

```
┌─ Step 1: Claude Makes Request ─────────────────────────┐
│ Message: "What's the fuel level of my car?"            │
│ Tool Called: get_fuel_status                           │
│ Parameters: { vehicleId: "car-123", token: "xyz..." }  │
└─ Step 2: NitroStack Receives Request ──────────────────┤
│ ✓ Parses MCP protocol                                  │
│ ✓ Identifies tool: "get_fuel_status"                   │
│ ✓ Validates input against Zod schema                   │
└─ Step 3: Security ────────────────────────────────────┤
│ ✓ OAuthGuard applied                                   │
│ ✓ Token validated (if OAUTH_REQUIRED=true)            │
│ ✓ Extracts user: ctx.auth.subject = "user-123"        │
└─ Step 4: Get Smartcar Token ─────────────────────────┤
│ ✓ Query SQLite: SELECT smartcar_token                 │
│   WHERE user_id = "user-123"                           │
│ ✓ Retrieved token: "smartcar_access_token_xyz"         │
└─ Step 5: Call Smartcar API ──────────────────────────┤
│ GET https://sandbox.smartcar.com/v2.0/vehicles/car-123/fuel
│ Headers: Authorization: Bearer smartcar_access_token  │
│ Response: {                                            │
│   "percentRemaining": 75,                              │
│   "amountRemaining": 11.25,                            │
│   "capacity": 15                                       │
│ }                                                      │
└─ Step 6: Store in Database ──────────────────────────┤
│ INSERT INTO fuel_logs (                                │
│   vehicle_id, filled_at, odometer, litres, created_at │
│ ) VALUES (...)                                         │
│ ✓ Logged fuel status at 2026-07-18T04:46:00Z          │
└─ Step 7: Return Response ──────────────────────────────┤
│ {                                                      │
│   "success": true,                                     │
│   "fuel": {                                            │
│     "percentRemaining": 75,                            │
│     "amountRemaining": 11.25,                          │
│     "capacity": 15                                     │
│   },                                                   │
│   "message": "Your Toyota Camry has 75% fuel remaining"│
│ }                                                      │
└─ Step 8: Claude Displays Result ──────────────────────┤
│ "Your Toyota Camry has 75% fuel remaining              │
│  (11.25 gallons of 15 gallon tank)"                    │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Key Files & Their Responsibilities

| File | Purpose | Key Methods |
|------|---------|-------------|
| `app.module.ts` | Bootstrap & DI setup | @McpApp, @Module decorators |
| `index.ts` | Entry point | bootstrap(), starts server |
| `vehicles.module.ts` | Module config | providers, controllers |
| `vehicles.tools.ts` | MCP tools | @Tool decorators, tool logic |
| `smartcar.service.ts` | Smartcar API | getVehicles(), getFuel(), etc |
| `sqlite.service.ts` | Local DB | createVehicle(), listVehicles() |
| `duffel.service.ts` | Flight API | searchFlights(), createOrder() |
| `.env.example` | Config template | OAuth, Smartcar, API keys |

---

## 🎯 When You Use NitroStack CLI

### **`npm run dev` (Development Mode)**

```
nitrostack-cli dev
├─ Start in STDIO transport mode
├─ Enable hot-reload
├─ SQLite in data/garage.db
├─ OAuth enforcement OFF (dev-friendly)
└─ Logs to stderr for debugging
```

### **`npm run build` (Build for Production)**

```
nitrostack-cli build
├─ Compile TypeScript → JavaScript
├─ Bundle dependencies
├─ Optimize for production
└─ Output to dist/ directory
```

### **`npm run start` (Production Start)**

```
npm run build && nitrostack-cli start
├─ Use compiled JavaScript
├─ HTTP + STDIO dual transport
├─ OAuth enforcement ON
├─ Ready for OpenAI Apps deployment
└─ Health checks enabled
```

---

## 📈 Architecture Scalability

```
Current State:
┌─ VehiclesModule
│  ├─ add_vehicle (local DB only)
│  └─ list_vehicles (local DB only)

Future Enhancement:
┌─ VehiclesModule
│  ├─ add_vehicle (local DB)
│  ├─ list_vehicles (local DB)
│  ├─ sync_smartcar_vehicles (Smartcar API)
│  ├─ get_fuel_status (Smartcar API)
│  ├─ get_location (Smartcar API)
│  └─ schedule_maintenance (Calendar API)
```

---

## 🐛 Debugging Tips

### **Enable Verbose Logging**

```bash
NITRO_LOG_LEVEL=debug npm run dev
```

### **Check Database**

```bash
# Use SQLite CLI
sqlite3 data/garage.db
sqlite> SELECT * FROM vehicles;
```

### **Test OAuth Token**

```bash
# Decode JWT
echo "your-jwt-token" | cut -d. -f2 | base64 -d | jq .
```

### **Monitor API Calls**

```bash
# Watch fetch requests
SMARTCAR_DEBUG=true npm run dev
```

---

## 🎓 Summary

This NitroStack MCP Server:
1. **Bootstraps** via `app.module.ts` → loads OAuth, database, services
2. **Exposes Tools** via `vehicles.tools.ts` → available to Claude/OpenAI
3. **Manages Data** via `SQLiteService` → local persistent storage
4. **Integrates APIs** via `SmartcarService` → vehicle data retrieval
5. **Secures Access** via `OAuthGuard` → authentication & authorization
6. **Follows DI Pattern** → NestJS-like dependency injection
7. **Streams Responses** → HTTP/STDIO dual transport

When you call a tool from Claude, the request flows through decorators → guards → services → database/APIs → response back to Claude.

