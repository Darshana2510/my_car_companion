# Smartcar Integration Guide

## Overview

This NitroStack MCP project includes a comprehensive Smartcar integration that enables vehicle data access through OAuth 2.0 authentication. The `SmartcarService` provides methods to retrieve vehicle information, fuel status, battery level, odometer readings, location, maintenance data, and more.

## Features

### Core Vehicle Data Methods
- **getVehicles()** - Fetch all connected vehicles for authenticated user
- **getVehicleInfo()** - Get vehicle attributes (make, model, year, VIN)
- **getFuel()** - Get fuel level percentage and remaining capacity
- **getBattery()** - Get battery level (for electric vehicles)
- **getOdometer()** - Get odometer reading in miles
- **getLocation()** - Get vehicle GPS location (latitude, longitude)
- **getEngineOil()** - Get engine oil life percentage
- **getTirePressure()** - Get tire pressure for all four tires

### Additional Methods
- **getCharge()** - Get battery/charge status (EVs and plug-in hybrids)
- **lockVehicle()** - Lock the vehicle
- **unlockVehicle()** - Unlock the vehicle
- **startEngine()** - Start engine (supported vehicles)
- **stopEngine()** - Stop engine (supported vehicles)

### OAuth 2.0 Authentication
- **getAuthorizationUrl()** - Generate OAuth authorization URL
- **exchangeCodeForToken()** - Exchange authorization code for access token
- **refreshToken()** - Refresh expired access tokens

## Setup Instructions

### 1. Get Smartcar Developer Credentials

1. Visit [Smartcar Developer Dashboard](https://developer.smartcar.com/)
2. Create a new application
3. Configure OAuth 2.0 settings:
   - Set **Redirect URI** to match your setup (e.g., `http://localhost:3000/oauth/smartcar/callback`)
   - Note the **Client ID** and **Client Secret**
4. Choose environment: **Sandbox** for testing or **Live** for production

### 2. Configure Environment Variables

Copy the Smartcar configuration to your `.env` file:

```bash
# Smartcar API Integration
SMARTCAR_MODE=sandbox                                          # sandbox or live
SMARTCAR_CLIENT_ID=your-smartcar-client-id
SMARTCAR_CLIENT_SECRET=your-smartcar-client-secret
SMARTCAR_REDIRECT_URI=http://localhost:3000/oauth/smartcar/callback
```

### 3. API Endpoints by Environment

**Sandbox (Testing)**
```
Authorization: https://sandbox.smartcar.com/oauth/authorize
Token Exchange: https://sandbox.smartcar.com/oauth/token
API Base: https://sandbox.smartcar.com/v2.0
```

**Live (Production)**
```
Authorization: https://accounts.smartcar.com/oauth/authorize
Token Exchange: https://accounts.smartcar.com/oauth/token
API Base: https://api.smartcar.com/v2.0
```

## Usage Examples

### OAuth Authentication Flow

```typescript
import { SmartcarService } from './services/smartcar.service.js';

// Initialize the service
const smartcarService = new SmartcarService();

// Step 1: Generate authorization URL and redirect user
const authUrl = smartcarService.getAuthorizationUrl('state-token');
// User clicks link and authorizes your app

// Step 2: Exchange authorization code for access token (in callback route)
const tokenResponse = await smartcarService.exchangeCodeForToken(authCode);
const accessToken = tokenResponse.access_token;
const refreshToken = tokenResponse.refresh_token;

// Store tokens securely in your database
```

### Fetching Vehicle Data

```typescript
// Get all connected vehicles
const vehicles = await smartcarService.getVehicles(accessToken);
console.log(vehicles);
// Output: [
//   { id: 'car-123', make: 'Toyota', model: 'Camry', year: 2023 },
//   { id: 'car-456', make: 'Tesla', model: 'Model 3', year: 2024 }
// ]

// Get specific vehicle information
const vehicleId = vehicles[0].id;
const info = await smartcarService.getVehicleInfo(vehicleId, accessToken);
console.log(info);
// Output: { id: 'car-123', make: 'Toyota', model: 'Camry', year: 2023 }

// Get fuel status
const fuel = await smartcarService.getFuel(vehicleId, accessToken);
console.log(fuel);
// Output: {
//   percentRemaining: 75,
//   amountRemaining: 11.25,
//   capacity: 15
// }

// Get location
const location = await smartcarService.getLocation(vehicleId, accessToken);
console.log(location);
// Output: { latitude: 37.7749, longitude: -122.4194 }

// Get odometer
const odometer = await smartcarService.getOdometer(vehicleId, accessToken);
console.log(odometer);
// Output: { value: 25000 }

// Get engine oil status
const oil = await smartcarService.getEngineOil(vehicleId, accessToken);
console.log(oil);
// Output: { lifeRemaining: 85 }

// Get tire pressure
const tires = await smartcarService.getTirePressure(vehicleId, accessToken);
console.log(tires);
// Output: {
//   frontLeft: 32,
//   frontRight: 32,
//   rearLeft: 30,
//   rearRight: 30
// }
```

### Vehicle Control Methods

```typescript
// Lock vehicle
const lockResult = await smartcarService.lockVehicle(vehicleId, accessToken);
console.log(lockResult); // { status: 'success' }

// Unlock vehicle
const unlockResult = await smartcarService.unlockVehicle(vehicleId, accessToken);
console.log(unlockResult); // { status: 'success' }

// Start engine
const startResult = await smartcarService.startEngine(vehicleId, accessToken);
console.log(startResult); // { status: 'success' }

// Stop engine
const stopResult = await smartcarService.stopEngine(vehicleId, accessToken);
console.log(stopResult); // { status: 'success' }
```

### Token Refresh

```typescript
// When access token expires
const newTokenResponse = await smartcarService.refreshToken(refreshToken);
const newAccessToken = newTokenResponse.access_token;

// Use the new access token for subsequent requests
const vehicles = await smartcarService.getVehicles(newAccessToken);
```

## Integration with NitroStack Tools

The SmartcarService is already registered as a provider in the VehiclesModule. You can inject it into your tools:

```typescript
import { Injectable, Tool, ExecutionContext, z } from "@nitrostack/core";
import { SmartcarService } from "../../services/smartcar.service.js";

@Injectable({ deps: [SmartcarService] })
export class VehicleTools {
  constructor(private smartcar: SmartcarService) {}

  @Tool({
    name: "get_vehicle_fuel",
    description: "Get fuel status for a vehicle",
    inputSchema: z.object({
      vehicleId: z.string(),
      accessToken: z.string()
    })
  })
  async getVehicleFuel(input: any, ctx: ExecutionContext) {
    try {
      const fuel = await this.smartcar.getFuel(input.vehicleId, input.accessToken);
      return {
        success: true,
        fuel
      };
    } catch (error) {
      ctx.logger.error("Failed to get fuel", error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}
```

## Error Handling

The SmartcarService throws descriptive errors for API failures:

```typescript
try {
  const fuel = await smartcarService.getFuel(vehicleId, accessToken);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes("401")) {
      console.log("Unauthorized - token may have expired");
      // Refresh token and retry
    } else if (error.message.includes("404")) {
      console.log("Vehicle not found");
    } else {
      console.log("API Error:", error.message);
    }
  }
}
```

## Database Schema for Token Storage

Store OAuth tokens securely in your SQLite database:

```sql
CREATE TABLE IF NOT EXISTS smartcar_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX idx_smartcar_tokens_user
ON smartcar_tokens(user_id);
```

## Security Best Practices

1. **Never expose tokens** - Keep Client Secret secure on server-side only
2. **Use HTTPS** - Required for OAuth redirects in production
3. **Validate redirects** - Ensure redirect_uri matches registered URI
4. **Refresh tokens** - Implement token expiration and refresh logic
5. **Rate limiting** - Implement rate limits to prevent API abuse
6. **Audit logging** - Log all vehicle data access for compliance

## API Rate Limits

Smartcar API rate limits:
- **Sandbox**: 100 requests per minute
- **Production**: 120 requests per minute

Implement exponential backoff for rate limit handling.

## Troubleshooting

### Invalid Authorization URL
- Verify SMARTCAR_CLIENT_ID is correct
- Check SMARTCAR_REDIRECT_URI matches registered URI in dashboard

### Token Exchange Fails
- Confirm SMARTCAR_CLIENT_SECRET is correct
- Verify authorization code hasn't expired (valid for 5 minutes)
- Ensure redirect_uri in exchange matches original authorization URL

### API Request Fails with 401
- Token may have expired - call refreshToken()
- Verify access token wasn't revoked in Smartcar dashboard

### Vehicle Data Not Available
- Confirm user has connected vehicle in Smartcar
- Check user's vehicle supports requested data point
- Try with sandbox credentials first

## Resources

- [Smartcar API Documentation](https://smartcar.com/docs)
- [Smartcar Developer Dashboard](https://developer.smartcar.com)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [NitroStack Documentation](https://nitrostack.com)

## Support

For issues with the Smartcar integration:
1. Check the [Smartcar Status Page](https://status.smartcar.com)
2. Review [Smartcar API Documentation](https://smartcar.com/docs)
3. Contact [Smartcar Support](https://smartcar.com/contact)
