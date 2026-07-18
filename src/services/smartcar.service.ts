import { Injectable } from "@nitrostack/core";

const SMARTCAR_BASE_URL =
  process.env.SMARTCAR_MODE === "live"
    ? "https://api.smartcar.com/v2.0"
    : "https://sandbox.smartcar.com/v2.0";

@Injectable()
export class SmartcarService {
  /**
   * Generic request helper
   */
  private async request(
    endpoint: string,
    accessToken: string,
    method: string = "GET",
    body?: unknown
  ) {
    const response = await fetch(`${SMARTCAR_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();

      throw new Error(
        `Smartcar API Error (${response.status}): ${error}`
      );
    }

    return response.json();
  }

  /**
   * Get all connected vehicle IDs
   */
  async getVehicleIds(accessToken: string) {
    return this.request("/vehicles", accessToken);
  }

  /**
   * Vehicle attributes
   */
  async getVehicleInfo(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}`,
      accessToken
    );
  }

  /**
   * Vehicle location
   */
  async getLocation(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/location`,
      accessToken
    );
  }

  /**
   * Odometer
   */
  async getOdometer(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/odometer`,
      accessToken
    );
  }

  /**
   * Fuel status
   */
  async getFuel(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/fuel`,
      accessToken
    );
  }

  /**
   * Battery level
   */
  async getBattery(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/battery`,
      accessToken
    );
  }

  /**
   * Charge status
   */
  async getCharge(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/charge`,
      accessToken
    );
  }

  /**
   * Engine oil life
   */
  async getEngineOil(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/engine/oil`,
      accessToken
    );
  }

  /**
   * Tire pressure
   */
  async getTirePressure(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/tires/pressure`,
      accessToken
    );
  }

  /**
   * Lock vehicle
   */
  async lockVehicle(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/security`,
      accessToken,
      "POST",
      {
        action: "LOCK",
      }
    );
  }

  /**
   * Unlock vehicle
   */
  async unlockVehicle(
    vehicleId: string,
    accessToken: string
  ) {
    return this.request(
      `/vehicles/${vehicleId}/security`,
      accessToken,
      "POST",
      {
        action: "UNLOCK",
      }
    );
  }
}
