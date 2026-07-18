import { Injectable } from "@nitrostack/core";

/**
 * Smartcar API Service
 * 
 * Handles all interactions with the Smartcar API v2.0
 * Implements OAuth 2.0 authentication and vehicle data retrieval
 * 
 * Supported Methods:
 * - getVehicles(): Fetch all connected vehicles for authenticated user
 * - getVehicleInfo(): Get vehicle attributes (make, model, year, etc)
 * - getFuel(): Get fuel level percentage and remaining gallons/liters
 * - getBattery(): Get battery level percentage (EVs)
 * - getOdometer(): Get odometer reading in miles
 * - getLocation(): Get vehicle GPS location
 * - getEngineOil(): Get engine oil life percentage
 * - getTirePressure(): Get tire pressure for all tires
 * 
 * Environment Variables:
 * - SMARTCAR_CLIENT_ID: OAuth client ID from Smartcar
 * - SMARTCAR_CLIENT_SECRET: OAuth client secret from Smartcar
 * - SMARTCAR_REDIRECT_URI: OAuth redirect URI (e.g., http://localhost:3000/oauth/callback)
 * - SMARTCAR_MODE: 'live' for production API, 'sandbox' for testing (default: sandbox)
 */

const SMARTCAR_BASE_URL =
  process.env.SMARTCAR_MODE === "live"
    ? "https://api.smartcar.com/v2.0"
    : "https://sandbox.smartcar.com/v2.0";

const SMARTCAR_OAUTH_URL = 
  process.env.SMARTCAR_MODE === "live"
    ? "https://accounts.smartcar.com/oauth/authorize"
    : "https://sandbox.smartcar.com/oauth/authorize";

const SMARTCAR_TOKEN_URL = 
  process.env.SMARTCAR_MODE === "live"
    ? "https://accounts.smartcar.com/oauth/token"
    : "https://sandbox.smartcar.com/oauth/token";

interface SmartcarTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface SmartcarVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
}

interface SmartcarVehicleInfo {
  id: string;
  make: string;
  model: string;
  year: number;
}

interface SmartcarLocation {
  latitude: number;
  longitude: number;
}

interface SmartcarFuel {
  percentRemaining: number;
  amountRemaining: number;
  capacity: number;
}

interface SmartcarBattery {
  percentRemaining: number;
  range: number;
}

interface SmartcarOdometer {
  value: number;
}

interface SmartcarEngineOil {
  lifeRemaining: number;
}

interface SmartcarTirePressure {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
}

@Injectable()
export class SmartcarService {
  private clientId = process.env.SMARTCAR_CLIENT_ID;
  private clientSecret = process.env.SMARTCAR_CLIENT_SECRET;
  private redirectUri = process.env.SMARTCAR_REDIRECT_URI || "http://localhost:3000/oauth/callback";

  /**
   * Generate OAuth authorization URL
   * Direct user to this URL to authenticate with Smartcar
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId || "",
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "required",
      ...(state && { state })
    });

    return `${SMARTCAR_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * Called during OAuth callback with code from Smartcar
   */
  async exchangeCodeForToken(code: string): Promise<SmartcarTokenResponse> {
    const response = await fetch(SMARTCAR_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${this.clientId}:${this.clientSecret}`
        ).toString("base64")}`
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri
      }).toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return response.json() as Promise<SmartcarTokenResponse>;
  }

  /**
   * Refresh expired access token
   */
  async refreshToken(refreshToken: string): Promise<SmartcarTokenResponse> {
    const response = await fetch(SMARTCAR_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${this.clientId}:${this.clientSecret}`
        ).toString("base64")}`
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      }).toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json() as Promise<SmartcarTokenResponse>;
  }

  /**
   * Generic request helper
   */
  private async request<T>(
    endpoint: string,
    accessToken: string,
    method: string = "GET",
    body?: unknown
  ): Promise<T> {
    const url = `${SMARTCAR_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Smartcar API Error (${response.status}): ${error}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all connected vehicles for the authenticated user
   * Returns list of vehicle IDs and metadata
   */
  async getVehicles(accessToken: string): Promise<SmartcarVehicle[]> {
    interface VehiclesResponse {
      vehicles: Array<{
        id: string;
        make: string;
        model: string;
        year: number;
      }>;
      paging: {
        cursor: string;
      };
    }

    const response = await this.request<VehiclesResponse>(
      "/vehicles",
      accessToken
    );

    return response.vehicles || [];
  }

  /**
   * Get vehicle attributes (make, model, year, VIN)
   */
  async getVehicleInfo(
    vehicleId: string,
    accessToken: string
  ): Promise<SmartcarVehicleInfo> {
    return this.request<SmartcarVehicleInfo>(
      `/vehicles/${vehicleId}`,
      accessToken
    );
  }

  /**
   * Get fuel level and capacity
   * Returns percentRemaining (0-100), amountRemaining, and capacity
   */
  async getFuel(
    vehicleId: string,
    accessToken: string
  ): Promise<SmartcarFuel> {
    return this.request<SmartcarFuel>(
      `/vehicles/${vehicleId}/fuel`,
      accessToken
    );
  }

  /**
   * Get battery level (for electric vehicles)
   * Returns percentRemaining (0-100) and estimated range
   */
  async getBattery(
    vehicleId: string,
    accessToken: string
  ): Promise<SmartcarBattery> {
    return this.request<SmartcarBattery>(
      `/vehicles/${vehicleId}/battery`,
      accessToken
    );
  }

  /**
   * Get odometer reading in miles
   */
  async getOdometer(
    vehicleId: string,
    accessToken: string
  ): Promise<SmartcarOdometer> {
    return this.request<SmartcarOdometer>(
      `/vehicles/${vehicleId}/odometer`,
      accessToken
    );
  }

  /**
   * Get vehicle GPS location
   * Returns latitude and longitude
   */
  async getLocation(
    vehicleId: string,
    accessToken: string
  ): Promise<SmartcarLocation> {
    return this.request<SmartcarLocation>(
      `/vehicles/${vehicleId}/location`,
      accessToken
    );
  }

  /**
   * Get engine oil life percentage
   * Returns lifeRemaining (0-100)
   */
  async getEngineOil(
    vehicleId: string,
    accessToken: string
  ): Promise<SmartcarEngineOil> {
    return this.request<SmartcarEngineOil>(
      `/vehicles/${vehicleId}/engine/oil`,
      accessToken
    );
  }

  /**
   * Get tire pressure for all tires
   * Returns pressure in PSI for each tire
   */
  async getTirePressure(
    vehicleId: string,
    accessToken: string
  ): Promise<SmartcarTirePressure> {
    return this.request<SmartcarTirePressure>(
      `/vehicles/${vehicleId}/tires/pressure`,
      accessToken
    );
  }

  /**
   * Get battery/charge status (for plug-in hybrids or EVs)
   * Returns isPluggedIn status
   */
  async getCharge(
    vehicleId: string,
    accessToken: string
  ): Promise<{ isPluggedIn: boolean }> {
    return this.request<{ isPluggedIn: boolean }>(
      `/vehicles/${vehicleId}/charge`,
      accessToken
    );
  }

  /**
   * Lock vehicle
   * Sends a lock command to the vehicle
   */
  async lockVehicle(
    vehicleId: string,
    accessToken: string
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      `/vehicles/${vehicleId}/security`,
      accessToken,
      "POST",
      {
        action: "LOCK"
      }
    );
  }

  /**
   * Unlock vehicle
   * Sends an unlock command to the vehicle
   */
  async unlockVehicle(
    vehicleId: string,
    accessToken: string
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      `/vehicles/${vehicleId}/security`,
      accessToken,
      "POST",
      {
        action: "UNLOCK"
      }
    );
  }

  /**
   * Start engine (supported vehicles only)
   */
  async startEngine(
    vehicleId: string,
    accessToken: string
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      `/vehicles/${vehicleId}/engine/start`,
      accessToken,
      "POST"
    );
  }

  /**
   * Stop engine (supported vehicles only)
   */
  async stopEngine(
    vehicleId: string,
    accessToken: string
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      `/vehicles/${vehicleId}/engine/stop`,
      accessToken,
      "POST"
    );
  }
}
