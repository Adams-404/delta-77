export class InterswitchService {
  private static instance: InterswitchService;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  private constructor() {}

  public static getInstance(): InterswitchService {
    if (!InterswitchService.instance) {
      InterswitchService.instance = new InterswitchService();
    }
    return InterswitchService.instance;
  }

  /**
   * Fetches or returns a cached Access Token from Interswitch Passport OAuth
   */
  public async getAccessToken(): Promise<string> {
    // Check if cached token is still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.accessToken;
    }

    const clientId = process.env.ISW_CLIENT_ID;
    const clientSecret = process.env.ISW_CLIENT_SECRET;
    const baseUrl = process.env.ISW_BASE_URL || 'https://sandbox.interswitchng.com';

    if (!clientId || !clientSecret) {
      throw new Error("Interswitch Credentials (ISW_CLIENT_ID, ISW_CLIENT_SECRET) are missing from environment variables.");
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await fetch(`${baseUrl}/passport/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch Interswitch token: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      this.accessToken = data.access_token;
      // expires_in is usually in seconds. Convert to timestamp.
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      return this.accessToken!;
    } catch (error) {
      console.error("Interswitch Token Fetch Error:", error);
      throw error;
    }
  }

  /**
   * Verify BVN Full Details
   */
  public async verifyBVN(bvn: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = process.env.ISW_BASE_URL || 'https://sandbox.interswitchng.com';

      const response = await fetch(`${baseUrl}/api/v1/bvn/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          // Add MerchantCode if required by Sandbox. For now leaving standard.
        },
        body: JSON.stringify({ bvn })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `BVN Verification Failed: ${response.statusText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("verifyBVN Error:", error);
      return { success: false, message: "Internal verification error" };
    }
  }

  /**
   * Verify Transaction Status
   */
  public async verifyTransaction(transactionRef: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = process.env.ISW_BASE_URL || 'https://sandbox.interswitchng.com';

      // Example endpoint structure for Transaction Search api
      const response = await fetch(`${baseUrl}/api/v1/transactions?transactionRef=${transactionRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return { success: false, message: "Transaction lookup failed" };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
       console.error("verifyTransaction Error:", error);
       return { success: false, message: "Internal transaction lookup error" };
    }
  }
}

export const interswitch = InterswitchService.getInstance();
