# Practical Usage Guide: Using the Smartcar Integration

## 🎯 Quick Start Scenarios

This guide shows real-world examples of how to use the integrated Smartcar tools when the MCP server is running with Claude or OpenAI Apps SDK.

---

## 📊 Scenario 1: User Connects Their Vehicle for the First Time

### **Step 1: Generate Auth URL**

**Claude asks:** "How do I connect my car to this app?"

**Backend action:**
```
Tool Called: get_smartcar_auth_url
Input: {}
```

**What happens:**
```typescript
// SmartcarService.getAuthorizationUrl() is called
authUrl = "https://sandbox.smartcar.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000/oauth/smartcar/callback&
  response_type=code&
  scope=required&
  state=abc123xyz"
```

**Response from MCP:**
```json
{
  "success": true,
  "authUrl": "https://sandbox.smartcar.com/oauth/authorize?...",
  "state": "abc123xyz",
  "message": "Redirect user to this URL to authorize Smartcar access"
}
```

**Claude displays:**
```
I found your authorization link. 
Click here: [Connect Your Vehicle]
→ https://sandbox.smartcar.com/oauth/authorize?...

After authorizing, Smartcar will redirect you back with an authorization code.
```

---

### **Step 2: User Authorizes & Gets Code**

**User clicks the link and sees Smartcar login:**

```
┌─────────────────────────────────────┐
│ Smartcar OAuth Login                │
├─────────────────────────────────────┤
│ Select Vehicles:                    │
│  ☑ 2023 Toyota Camry (abc-123)     │
│  ☑ 2024 Tesla Model 3 (xyz-456)   │
│                                     │
│ [Authorize Access]                  │
└─────────────────────────────────────┘
```

**Smartcar redirects back to:**
```
http://localhost:3000/oauth/smartcar/callback?
  code=SmartcarAuthCode123xyz&
  state=abc123xyz
```

---

### **Step 3: Exchange Code for Token**

**Claude asks:** "I got the code: SmartcarAuthCode123xyz"

**Backend action:**
```
Tool Called: exchange_smartcar_code
Input: {
  "code": "SmartcarAuthCode123xyz",
  "state": "abc123xyz"
}
```

**What happens:**
```typescript
// SmartcarService.exchangeCodeForToken() calls:
POST https://sandbox.smartcar.com/oauth/token
  Authorization: Basic {base64(CLIENT_ID:CLIENT_SECRET)}
  grant_type=authorization_code
  code=SmartcarAuthCode123xyz
  redirect_uri=http://localhost:3000/oauth/smartcar/callback

// Response:
{
  "access_token": "smartcar_access_abc123...",
  "refresh_token": "smartcar_refresh_xyz789...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

**MCP Response:**
```json
{
  "success": true,
  "accessToken": "smartcar_access_abc123...",
  "refreshToken": "smartcar_refresh_xyz789...",
  "expiresIn": 86400,
  "message": "Token exchange successful. Store the refresh token securely."
}
```

**Claude displays:**
```
✅ Successfully connected to Smartcar!
Access Token: smartcar_access_abc123...
Refresh Token: smartcar_refresh_xyz789...

Store this refresh token securely for later use.
```

---

## 🚗 Scenario 2: Get List of Connected Vehicles

### **User asks:** "Show me all my connected vehicles"

**Backend action:**
```
Tool Called: get_smartcar_vehicles
Input: {
  "accessToken": "smartcar_access_abc123..."
}
```

**What happens:**
```typescript
// SmartcarService.getVehicles() calls:
GET https://sandbox.smartcar.com/v2.0/vehicles
  Authorization: Bearer smartcar_access_abc123...

// Response from Smartcar:
{
  "vehicles": [
    {
      "id": "car_123",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023
    },
    {
      "id": "car_456",
      "make": "Tesla",
      "model": "Model 3",
      "year": 2024
    }
  ],
  "paging": { "cursor": "..." }
}
```

**MCP Response:**
```json
{
  "success": true,
  "count": 2,
  "vehicles": [
    {
      "id": "car_123",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023
    },
    {
      "id": "car_456",
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
You have 2 connected vehicles:

1. 🚗 Toyota Camry (2023)
   Smartcar ID: car_123

2. ⚡ Tesla Model 3 (2024)
   Smartcar ID: car_456

What would you like to know about these vehicles?
```

---

## ⛽ Scenario 3: Check Fuel Level

### **User asks:** "How much gas does my Camry have?"

**Backend action:**
```
Tool Called: get_vehicle_fuel
Input: {
  "vehicleId": "local-vehicle-123",
  "smartcarVehicleId": "car_123",
  "accessToken": "smartcar_access_abc123..."
}
```

**What happens:**
```typescript
// SmartcarService.getFuel() calls:
GET https://sandbox.smartcar.com/v2.0/vehicles/car_123/fuel
  Authorization: Bearer smartcar_access_abc123...

// Response from Smartcar:
{
  "percentRemaining": 75,
  "amountRemaining": 11.25,
  "capacity": 15
}

// Stores in SQLite:
INSERT INTO fuel_logs (vehicle_id, filled_at, odometer, litres, created_at)
VALUES ('local-vehicle-123', '2026-07-18T04:53:00Z', 25000, 11.25, '2026-07-18T04:53:00Z')
```

**MCP Response:**
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
├─ Percentage: 75%
├─ Amount: 11.25 gallons
└─ Capacity: 15 gallons

Good fuel level! You can drive approximately 375 more miles 
(assuming 25 mpg average).
```

---

## 📍 Scenario 4: Get Vehicle Location

### **User asks:** "Where is my Tesla parked?"

**Backend action:**
```
Tool Called: get_vehicle_location
Input: {
  "vehicleId": "local-vehicle-456",
  "smartcarVehicleId": "car_456",
  "accessToken": "smartcar_access_abc123..."
}
```

**What happens:**
```typescript
// SmartcarService.getLocation() calls:
GET https://sandbox.smartcar.com/v2.0/vehicles/car_456/location
  Authorization: Bearer smartcar_access_abc123...

// Response from Smartcar:
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

**MCP Response:**
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
├─ Latitude: 37.7749
├─ Longitude: -122.4194
└─ View on Maps: https://maps.google.com/?q=37.7749,-122.4194

Your Tesla is parked near San Francisco, CA
```

---

## 🔋 Scenario 5: Check Battery & Range (EV)

### **User asks:** "What's the battery level on my Tesla?"

**Backend action:**
```
Tool Called: get_vehicle_battery
Input: {
  "smartcarVehicleId": "car_456",
  "accessToken": "smartcar_access_abc123..."
}
```

**What happens:**
```typescript
// SmartcarService.getBattery() calls:
GET https://sandbox.smartcar.com/v2.0/vehicles/car_456/battery
  Authorization: Bearer smartcar_access_abc123...

// Response from Smartcar:
{
  "percentRemaining": 87,
  "range": 285
}
```

**MCP Response:**
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
├─ Charge Level: 87%
├─ Range: 285 miles
└─ Status: Good

Your Tesla has plenty of charge for daily commute.
Nearest Supercharger: 2.3 miles away
```

---

## 🛞 Scenario 6: Check Tire Pressure

### **User asks:** "Check my tire pressure"

**Backend action:**
```
Tool Called: get_vehicle_tire_pressure
Input: {
  "smartcarVehicleId": "car_123",
  "accessToken": "smartcar_access_abc123..."
}
```

**What happens:**
```typescript
// SmartcarService.getTirePressure() calls:
GET https://sandbox.smartcar.com/v2.0/vehicles/car_123/tires/pressure
  Authorization: Bearer smartcar_access_abc123...

// Response from Smartcar:
{
  "frontLeft": 32,
  "frontRight": 32,
  "rearLeft": 30,
  "rearRight": 30
}
```

**MCP Response:**
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
🛞 Toyota Camry - Tire Pressure
├─ Front Left: 32 PSI ✓
├─ Front Right: 32 PSI ✓
├─ Rear Left: 30 PSI ✓
└─ Rear Right: 30 PSI ✓

All tire pressures are within normal range.
Recommended: 30-35 PSI
```

---

## 🛢️ Scenario 7: Check Engine Oil Life

### **User asks:** "When do I need an oil change?"

**Backend action:**
```
Tool Called: get_vehicle_engine_oil
Input: {
  "smartcarVehicleId": "car_123",
  "accessToken": "smartcar_access_abc123..."
}
```

**What happens:**
```typescript
// SmartcarService.getEngineOil() calls:
GET https://sandbox.smartcar.com/v2.0/vehicles/car_123/engine/oil
  Authorization: Bearer smartcar_access_abc123...

// Response from Smartcar:
{
  "lifeRemaining": 45
}
```

**MCP Response:**
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
├─ Life Remaining: 45%
└─ Status: Good

Your engine oil is still in good condition.
Schedule oil change when it reaches 0%.
```

---

## 🔒 Scenario 8: Lock/Unlock Vehicle

### **User asks:** "Lock my car"

**Backend action:**
```
Tool Called: lock_vehicle
Input: {
  "smartcarVehicleId": "car_456",
  "accessToken": "smartcar_access_abc123..."
}
```

**What happens:**
```typescript
// SmartcarService.lockVehicle() calls:
POST https://sandbox.smartcar.com/v2.0/vehicles/car_456/security
  Authorization: Bearer smartcar_access_abc123...
  Body: { "action": "LOCK" }

// Response from Smartcar:
{
  "status": "success"
}
```

**MCP Response:**
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
🔒 Tesla Model 3 - Lock Status
└─ Status: LOCKED ✓

Your Tesla has been locked successfully.
All doors secured.
```

---

## 📊 Scenario 9: Get Complete Vehicle Dashboard

### **User asks:** "Give me a complete status of my Camry"

**Backend action:**
Multiple parallel calls:

```
1. get_vehicle_fuel
2. get_vehicle_odometer
3. get_vehicle_engine_oil
4. get_vehicle_tire_pressure
5. get_vehicle_location

All with same smartcarVehicleId and accessToken
```

**What happens:**
```typescript
// SmartcarService makes 5 API calls to Smartcar in parallel
const [fuel, odometer, oil, tires, location] = await Promise.all([
  smartcar.getFuel(vehicleId, token),
  smartcar.getOdometer(vehicleId, token),
  smartcar.getEngineOil(vehicleId, token),
  smartcar.getTirePressure(vehicleId, token),
  smartcar.getLocation(vehicleId, token)
]);

// All data stored in SQLite
```

**MCP Response:**
```json
{
  "success": true,
  "dashboard": {
    "fuel": { "percentRemaining": 75, "amountRemaining": 11.25, "capacity": 15 },
    "odometer": { "value": 25000 },
    "engineOil": { "lifeRemaining": 45 },
    "tirePressure": { "frontLeft": 32, "frontRight": 32, "rearLeft": 30, "rearRight": 30 },
    "location": { "latitude": 37.7749, "longitude": -122.4194 }
  }
}
```

**Claude displays:**
```
🚗 TOYOTA CAMRY - COMPLETE STATUS REPORT
═══════════════════════════════════════════════════════════

⛽ FUEL
  └─ 75% Full (11.25 / 15 gallons)

📊 ODOMETER
  └─ 25,000 miles

🛢️ ENGINE OIL
  └─ 45% Life Remaining (Schedule soon)

🛞 TIRE PRESSURE
  ├─ Front Left: 32 PSI ✓
  ├─ Front Right: 32 PSI ✓
  ├─ Rear Left: 30 PSI ✓
  └─ Rear Right: 30 PSI ✓

📍 LOCATION
  └─ San Francisco, CA (37.7749, -122.4194)

═══════════════════════════════════════════════════════════
⚠️  MAINTENANCE ALERT: Oil change recommended soon
```

---

## 🔄 Scenario 10: Token Refresh (Automatic)

### **After 24 hours, access token expires**

**User asks:** "Check my fuel level again"

**Backend action:**
```
1. Call get_vehicle_fuel()
2. Receive 401 Unauthorized from Smartcar
3. Catch error in SmartcarService
4. Call refreshToken(refreshToken)
5. Get new accessToken
6. Retry get_vehicle_fuel() with new token
```

**What happens:**
```typescript
// Old token expired:
GET /vehicles/car_123/fuel
Response: 401 Unauthorized

// Automatic token refresh:
POST /oauth/token
  grant_type=refresh_token
  refresh_token=smartcar_refresh_xyz789...

Response:
{
  "access_token": "smartcar_access_new456...",
  "refresh_token": "smartcar_refresh_new999...",
  "expires_in": 86400
}

// Retry with new token:
GET /vehicles/car_123/fuel
  Authorization: Bearer smartcar_access_new456...

Response: 200 OK { fuel data }
```

**MCP Response:**
```json
{
  "success": true,
  "fuel": { ... },
  "message": "Token refreshed and fuel data retrieved"
}
```

---

## 🔌 Integration with Local Database

### **All Smartcar data is stored locally:**

```sql
-- After fetching fuel:
INSERT INTO fuel_logs (id, vehicle_id, filled_at, odometer, litres, created_at)
VALUES (
  'fuel_xyz123',
  'local-vehicle-123',
  '2026-07-18T04:53:00Z',
  25000,
  11.25,
  '2026-07-18T04:53:00Z'
);

-- Check history:
SELECT * FROM fuel_logs 
WHERE vehicle_id = 'local-vehicle-123'
ORDER BY filled_at DESC;

-- Result:
| id        | vehicle_id        | filled_at           | odometer | litres | created_at          |
|-----------|------------------|---------------------|----------|--------|---------------------|
| fuel_xyz1 | local-vehicle-123| 2026-07-18 04:53:00 | 25000    | 11.25  | 2026-07-18 04:53:00|
| fuel_abc2 | local-vehicle-123| 2026-07-17 10:30:00 | 24950    | 12.00  | 2026-07-17 10:30:00|
```

---

## ⚠️ Error Scenarios

### **Scenario A: Invalid Access Token**

```
User asks: "Show fuel level"
Tool: get_vehicle_fuel
Error from Smartcar: 401 Unauthorized

MCP Response:
{
  "success": false,
  "error": "Smartcar API Error (401): Invalid access token"
}

Claude displays:
"❌ Your Smartcar connection has expired.
Please reconnect by calling get_smartcar_auth_url again."
```

### **Scenario B: Vehicle Not Connected**

```
User asks: "Show fuel for my BMW"
Error from Smartcar: 404 Not Found (vehicle_id doesn't exist in Smartcar)

MCP Response:
{
  "success": false,
  "error": "Smartcar API Error (404): Vehicle not found"
}

Claude displays:
"❌ The vehicle with ID car_999 is not connected to your Smartcar account.
Available vehicles: car_123, car_456"
```

### **Scenario C: API Rate Limit**

```
User calls get_vehicle_fuel 50 times rapidly
Smartcar Rate Limit: 100 requests/min

MCP Response:
{
  "success": false,
  "error": "Smartcar API Error (429): Rate limit exceeded"
}

Claude displays:
"⏱️ You've made too many requests.
Please wait 30 seconds before trying again."
```

---

## 📈 Data Flow Summary

```
Claude Request
    ↓
MCP Tool Handler
    ↓
OAuth Guard Check
    ↓
Zod Schema Validation
    ↓
SmartcarService Method
    ↓
Fetch to Smartcar API
    ↓
Parse Response
    ↓
Store in SQLite (if applicable)
    ↓
Return Formatted Response
    ↓
Claude Displays to User
```

---

## 🎓 Key Takeaways

1. **OAuth Flow**: User authorizes once, receives tokens, passes `accessToken` to tools
2. **Local Storage**: All vehicle data cached in SQLite for offline access
3. **Error Handling**: All tools return `{ success, data/error, message }`
4. **Logging**: All operations logged for debugging and auditing
5. **Scalable**: Can add more tools following the same pattern
6. **Secure**: OAuth tokens never exposed to Claude frontend

