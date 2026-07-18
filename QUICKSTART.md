# 🚀 NitroStack Studio Quick Start - Smartcar Integration

## ✅ Prerequisites

Before running the server, make sure you have:

```bash
✓ Node.js 16+ installed
✓ npm installed
✓ .env file configured with credentials
✓ Smartcar developer account (https://developer.smartcar.com)
```

---

## 🔧 Setup Instructions

### Step 1: Copy Environment Variables

```bash
cp .env.example .env
```

### Step 2: Update `.env` with Your Credentials

```dotenv
# OAuth Configuration
OAUTH_REQUIRED=false                    # Dev mode: false, Production: true
RESOURCE_URI=http://localhost:3000
AUTH_SERVER_URL=https://dev-5dt0utuk315713tjm.us.auth0.com
TOKEN_AUDIENCE=http://localhost:3000
TOKEN_ISSUER=https://dev-5dt0utuk315713tjm.us.auth0.com

# Smartcar Configuration
SMARTCAR_MODE=sandbox                   # sandbox or live
SMARTCAR_CLIENT_ID=your-client-id       # Get from Smartcar Dashboard
SMARTCAR_CLIENT_SECRET=your-secret      # Get from Smartcar Dashboard
SMARTCAR_REDIRECT_URI=http://localhost:3000/oauth/smartcar/callback

# Optional: Duffel API (for flights)
DUFFEL_API_KEY=your-duffel-api-key
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start the Server

```bash
npm run dev
```

---

## 📡 Expected Server Output

```
🔐 Starting Calculator MCP Server with OAuth 2.1...

✅ OAuth 2.1 Module configured
   Resource URI: http://localhost:3000
   Auth Server: https://dev-5dt0utuk315713tjm.us.auth0.com
   Scopes: read, write, admin, vehicle:read, vehicle:write, maintenance:read, maintenance:write, calendar:write
   Audience: http://localhost:3000
   Enforcement: OFF (dev mode — set OAUTH_REQUIRED=true to enforce)

✅ Database initialized
   Path: data/garage.db
   Tables created: vehicles, maintenance_records, fuel_logs

✅ Services loaded
   - SmartcarService (sandbox mode)
   - SQLiteService
   - DuffelService

✅ MCP Server running
   Transport: STDIO
   Tools exposed: 16
   Health check: OK
```

---

## 🎯 Using with NitroStack Studio / OpenAI Apps

### **How to Connect:**

1. **In OpenAI Apps SDK:**
   ```javascript
   import { initializeClient } from "@modelcontextprotocol/sdk-client-stdio";
   
   const client = await initializeClient({
     command: "npm",
     args: ["run", "start"],
     cwd: "./my_car_companion"
   });
   ```

2. **In NitroStack Studio:**
   - Go to https://studio.nitrostack.io
   - Click "Add Server"
   - Select "Local Development"
   - Enter: `npm run dev`
   - Connect

3. **Then chat with Claude!**

---

## 💬 Test Prompts & Expected Outputs

### **Test 1: Generate Smartcar Auth URL**

**You say to Claude:**
```
"I want to connect my car. Can you generate the Smartcar authorization URL?"
```

**Claude calls:**
```
Tool: get_smartcar_auth_url
Input: {}
```

**Expected Response:**
```json
{
  "success": true,
  "authUrl": "https://sandbox.smartcar.com/oauth/authorize?client_id=xxx&redirect_uri=http://localhost:3000/oauth/smartcar/callback&response_type=code&scope=required&state=abc123",
  "state": "abc123",
  "message": "Redirect user to this URL to authorize Smartcar access"
}
```

**Claude displays:**
```
✅ Here's your Smartcar authorization link:

https://sandbox.smartcar.com/oauth/authorize?...

Click this link and follow these steps:
1. Log in to your Smartcar account
2. Select the vehicles you want to connect
3. Click "Authorize"
4. You'll be redirected with an authorization code
5. Come back and tell me the code
```

---

### **Test 2: Add a Vehicle Locally**

**You say to Claude:**
```
"Add my car to the garage: 2023 Toyota Camry"
```

**Claude calls:**
```
Tool: add_vehicle
Input: {
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "nickname": "My Camry"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vehicle added successfully.",
  "vehicle": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ownerId": "demo-user",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "nickname": "My Camry",
    "vin": null,
    "currentOdometer": null,
    "createdAt": "2026-07-18T04:55:00Z",
    "updatedAt": "2026-07-18T04:55:00Z"
  }
}
```

**Claude displays:**
```
✅ Vehicle Added Successfully!

📋 Vehicle Details:
├─ Make: Toyota
├─ Model: Camry
├─ Year: 2023
├─ Nickname: My Camry
├─ ID: 550e8400-e29b-41d4-a716-446655440000
└─ Added: 2026-07-18T04:55:00Z

Your Camry is now in your garage!
```

---

### **Test 3: List All Local Vehicles**

**You say to Claude:**
```
"Show me all my vehicles"
```

**Claude calls:**
```
Tool: list_vehicles
Input: {}
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "vehicles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ownerId": "demo-user",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "nickname": "My Camry",
      "vin": null,
      "currentOdometer": null,
      "createdAt": "2026-07-18T04:55:00Z",
      "updatedAt": "2026-07-18T04:55:00Z"
    }
  ]
}
```

**Claude displays:**
```
🚗 Your Vehicles (1 total)

1️⃣ Toyota Camry (2023)
   └─ Nickname: My Camry
   └─ ID: 550e8400-e29b-41d4-a716-446655440000
```

---

### **Test 4: Exchange Smartcar Code**

**You say to Claude:**
```
"I just authorized and got this code from Smartcar: SmartcarAuthCode_Example123ABC"
```

**Claude calls:**
```
Tool: exchange_smartcar_code
Input: {
  "code": "SmartcarAuthCode_Example123ABC",
  "state": "abc123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "accessToken": "smartcar_access_token_example_xyz789...",
  "refreshToken": "smartcar_refresh_token_example_abc123...",
  "expiresIn": 86400,
  "message": "Token exchange successful. Store the refresh token securely."
}
```

**Claude displays:**
```
✅ Successfully Connected to Smartcar!

🔐 Authentication Tokens:
├─ Access Token: smartcar_access_token_example_xyz789...
├─ Refresh Token: smartcar_refresh_token_example_abc123...
├─ Expires In: 86400 seconds (24 hours)
└─ Status: Ready to use

⚠️ Important: Keep your refresh token safe. You'll need it to reconnect when the access token expires.

Next, ask me to "Show all my Smartcar vehicles" to see what's connected.
```

---

### **Test 5: Get Smartcar Vehicles**

**You say to Claude:**
```
"Show all my Smartcar vehicles"
```

**Claude calls:**
```
Tool: get_smartcar_vehicles
Input: {
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response (Sandbox with test vehicles):**
```json
{
  "success": true,
  "count": 2,
  "vehicles": [
    {
      "id": "625e8400-e29b-41d4-a716-446655440001",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023
    },
    {
      "id": "625e8400-e29b-41d4-a716-446655440002",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2024
    }
  ],
  "message": "Found 2 connected vehicle(s)"
}
```

**Claude displays:**
```
🚗 Your Connected Smartcar Vehicles (2 total)

1️⃣ Toyota Camry (2023)
   └─ Smartcar ID: 625e8400-e29b-41d4-a716-446655440001

2️⃣ Tesla Model 3 (2024)
   └─ Smartcar ID: 625e8400-e29b-41d4-a716-446655440002

You can now check fuel, battery, location, and more!
```

---

### **Test 6: Check Fuel Level**

**You say to Claude:**
```
"What's the fuel level in my Camry?"
```

**Claude calls:**
```
Tool: get_vehicle_fuel
Input: {
  "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
  "smartcarVehicleId": "625e8400-e29b-41d4-a716-446655440001",
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response (from Smartcar API):**
```json
{
  "success": true,
  "fuel": {
    "percentRemaining": 75,
    "amountRemaining": 11.25,
    "capacity": 15
  },
  "message": "Fuel: 75% (11.25 / 15 units)"
}
```

**Claude displays:**
```
⛽ Toyota Camry - Fuel Status

📊 Current Fuel Level:
├─ Percentage: 75%
├─ Amount: 11.25 gallons
├─ Capacity: 15 gallons
└─ Status: Good ✅

🛣️ Estimated Range:
   ~ 375 miles (assuming 25 MPG average)

⏰ Next Fill-Up:
   Recommended when below 10%
```

---

### **Test 7: Check Vehicle Location**

**You say to Claude:**
```
"Where is my Tesla parked?"
```

**Claude calls:**
```
Tool: get_vehicle_location
Input: {
  "vehicleId": "local-vehicle-456",
  "smartcarVehicleId": "625e8400-e29b-41d4-a716-446655440002",
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "message": "Location: 37.7749, -122.4194",
  "mapsUrl": "https://maps.google.com/?q=37.7749,-122.4194"
}
```

**Claude displays:**
```
📍 Tesla Model 3 - Current Location

🌍 GPS Coordinates:
├─ Latitude: 37.7749
├─ Longitude: -122.4194
├─ Address: San Francisco, CA
└─ Link: https://maps.google.com/?q=37.7749,-122.4194

🚗 Your Tesla is parked at the coordinates above.
Click the link above to see it on Google Maps.
```

---

### **Test 8: Check Battery (EV)**

**You say to Claude:**
```
"What's the battery level on my Tesla?"
```

**Claude calls:**
```
Tool: get_vehicle_battery
Input: {
  "smartcarVehicleId": "625e8400-e29b-41d4-a716-446655440002",
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "battery": {
    "percentRemaining": 87,
    "range": 285
  },
  "message": "Battery: 87% (Range: 285 miles)"
}
```

**Claude displays:**
```
🔋 Tesla Model 3 - Battery Status

⚡ Charge Level:
├─ Current: 87%
├─ Range: 285 miles
└─ Status: Excellent ✅

🔌 Charging Tips:
├─ Don't charge to 100% daily (battery longevity)
├─ Optimal range: 20-80%
└─ Nearest Supercharger: 2.3 miles away
```

---

### **Test 9: Get Tire Pressure**

**You say to Claude:**
```
"Check my tire pressure"
```

**Claude calls:**
```
Tool: get_vehicle_tire_pressure
Input: {
  "smartcarVehicleId": "625e8400-e29b-41d4-a716-446655440001",
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "tires": {
    "frontLeft": 32,
    "frontRight": 32,
    "rearLeft": 30,
    "rearRight": 30
  },
  "message": "Tire Pressure - FL: 32PSI, FR: 32PSI, RL: 30PSI, RR: 30PSI"
}
```

**Claude displays:**
```
🛞 Toyota Camry - Tire Pressure Status

Recommended PSI Range: 30-35 PSI

Front Tires:
├─ Left: 32 PSI ✅
└─ Right: 32 PSI ✅

Rear Tires:
├─ Left: 30 PSI ✅
└─ Right: 30 PSI ✅

✅ All tires are at optimal pressure!

Rotation Recommended: Every 7,500 miles
```

---

### **Test 10: Check Engine Oil**

**You say to Claude:**
```
"When do I need an oil change?"
```

**Claude calls:**
```
Tool: get_vehicle_engine_oil
Input: {
  "smartcarVehicleId": "625e8400-e29b-41d4-a716-446655440001",
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "oil": {
    "lifeRemaining": 45
  },
  "message": "Engine Oil Life: 45% remaining"
}
```

**Claude displays:**
```
🛢️ Toyota Camry - Engine Oil Status

Oil Life Remaining: 45%

📊 Oil Change Timeline:
├─ Current: 45% remaining
├─ Good Range: > 20%
├─ Warning: < 10%
└─ Overdue: < 0%

⚠️ Action Items:
   Your oil is still in good condition.
   Schedule maintenance when it drops below 10%.

💡 Tip:
   Regular oil changes extend engine life.
   Follow manufacturer's recommended intervals.
```

---

### **Test 11: Lock Vehicle**

**You say to Claude:**
```
"Lock my Tesla"
```

**Claude calls:**
```
Tool: lock_vehicle
Input: {
  "smartcarVehicleId": "625e8400-e29b-41d4-a716-446655440002",
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "status": "success"
  },
  "message": "Vehicle locked successfully"
}
```

**Claude displays:**
```
🔒 Tesla Model 3 - Security Status

Status: LOCKED ✅

Details:
├─ All Doors: Locked
├─ Windows: Secure
├─ Trunk: Secure
└─ Timestamp: 2026-07-18T04:56:00Z

✅ Your Tesla is now secured.
```

---

### **Test 12: Unlock Vehicle**

**You say to Claude:**
```
"Unlock my Tesla"
```

**Claude calls:**
```
Tool: unlock_vehicle
Input: {
  "smartcarVehicleId": "625e8400-e29b-41d4-a716-446655440002",
  "accessToken": "smartcar_access_token_example_xyz789..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "status": "success"
  },
  "message": "Vehicle unlocked successfully"
}
```

**Claude displays:**
```
🔓 Tesla Model 3 - Security Status

Status: UNLOCKED ✅

Details:
├─ All Doors: Unlocked
├─ Ready for Entry
└─ Timestamp: 2026-07-18T04:56:30Z

✅ Your Tesla is now unlocked and ready to drive.
```

---

## 🗂️ Database Files Created

After running the server, these files will be created:

```
data/
├── garage.db                 # SQLite database with all vehicle data
├── garage.db-shm            # Shared memory for WAL mode
└── garage.db-wal            # Write-ahead log
```

**View database contents:**
```bash
sqlite3 data/garage.db

# List all vehicles:
sqlite> SELECT * FROM vehicles;

# View fuel logs:
sqlite> SELECT * FROM fuel_logs;

# View maintenance records:
sqlite> SELECT * FROM maintenance_records;
```

---

## 🧪 Testing Without Smartcar Credentials

If you don't have Smartcar credentials yet:

1. **Test local database tools:**
   ```
   "Add a 2023 Toyota Camry to my garage"
   "Show me all my vehicles"
   ```

2. **Generate auth URL (no credentials needed):**
   ```
   "Generate my Smartcar auth URL"
   ```

3. **Get real credentials:**
   - Visit https://developer.smartcar.com
   - Sign up for free
   - Create an application
   - Get Client ID and Secret
   - Update `.env` with credentials
   - Restart server with `npm run dev`

---

## 📚 Documentation Files

In your repository:

- **`SMARTCAR_INTEGRATION.md`** - Complete Smartcar setup guide
- **`ARCHITECTURE_GUIDE.md`** - How the MCP server works internally
- **`USAGE_GUIDE.md`** - Real-world scenarios with data flows
- **`.env.example`** - Environment variable template
- **`src/services/smartcar.service.ts`** - Smartcar API service
- **`src/modules/vehicles/vehicles.tools.ts`** - All MCP tools

---

## 🆘 Troubleshooting

### Server Won't Start

```bash
# Check Node version
node --version          # Must be 16+

# Check npm
npm --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run with debug logging
DEBUG=* npm run dev
```

### Database Error

```bash
# Delete old database
rm data/garage.db*

# Restart server
npm run dev
```

### Smartcar Connection Failed

```
✓ Verify SMARTCAR_CLIENT_ID and SMARTCAR_CLIENT_SECRET in .env
✓ Check SMARTCAR_MODE=sandbox for testing
✓ Verify SMARTCAR_REDIRECT_URI matches your registered URI
✓ Check internet connection
```

### Token Expired

```
Claude: "Refresh my Smartcar connection"
→ Calls exchange_smartcar_code with new token
→ Or get new auth URL with get_smartcar_auth_url
```

---

## 🎉 Success Checklist

- [ ] npm install completed
- [ ] .env file configured
- [ ] `npm run dev` running without errors
- [ ] data/garage.db created
- [ ] Can add local vehicle
- [ ] Can list vehicles
- [ ] Got Smartcar auth URL
- [ ] Exchanged Smartcar code for token
- [ ] Can see Smartcar vehicles
- [ ] Can check fuel, location, battery, etc.

---

## 📞 Next Steps

1. **Deploy to Production:**
   ```bash
   OAUTH_REQUIRED=true npm run start
   ```

2. **Integrate with OpenAI Apps:**
   - Get API key from OpenAI
   - Deploy to cloud (AWS, Heroku, Railway)
   - Connect MCP server URL

3. **Add More Features:**
   - Maintenance scheduling
   - Cost tracking
   - Trip logging
   - Fuel efficiency analytics

---

**Happy coding! 🚗⚡**

