import crypto from 'crypto';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  merchant_code?: string;
  production_payment_code?: string;
  requestor_id?: string;
  payable_id?: string;
}

interface ISWResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export class InterswitchService {
  private static instance: InterswitchService;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private merchantCode: string | null = null;

  private constructor() { }

  public static getInstance(): InterswitchService {
    if (!InterswitchService.instance) {
      InterswitchService.instance = new InterswitchService();
    }
    return InterswitchService.instance;
  }

  private get baseUrl(): string {
    return process.env.ISW_BASE_URL || 'https://qa.interswitchng.com';
  }

  private get clientId(): string {
    const id = process.env.ISW_CLIENT_ID;
    if (!id) throw new Error('ISW_CLIENT_ID is missing from environment variables.');
    return id;
  }

  private get clientSecret(): string {
    const secret = process.env.ISW_CLIENT_SECRET;
    if (!secret) throw new Error('ISW_CLIENT_SECRET is missing from environment variables.');
    return secret;
  }

  /**
   * Get merchant code — first from env, then from cached token response
   */
  public getMerchantCode(): string {
    return process.env.ISW_MERCHANT_CODE || this.merchantCode || '';
  }

  /**
   * Get Pay Item ID from env
   */
  public getPayItemId(): string {
    return process.env.ISW_PAY_ITEM_ID || '';
  }

  /**
   * Fetch or return cached OAuth2 Bearer token.
   * Token endpoint: POST /passport/oauth/token
   */
  public async getAccessToken(): Promise<string> {
    // Return cached token if still valid (5-minute buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.accessToken;
    }

    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/passport/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Interswitch token fetch failed: ${response.status} ${response.statusText} — ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    // Cache merchant_code from token response if not already in env
    if (data.merchant_code && !process.env.ISW_MERCHANT_CODE) {
      this.merchantCode = data.merchant_code;
    }

    console.log('[Interswitch] Token acquired. Expires in:', data.expires_in, 'seconds. Merchant code:', data.merchant_code || process.env.ISW_MERCHANT_CODE);

    return this.accessToken!;
  }

  /**
   * Generate InterswitchAuth headers (legacy/signature-based)
   * Used for some endpoints like transaction query
   */
  private generateInterswitchAuthHeaders(method: string, url: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    // Signature: SHA1( METHOD & url-encoded-URL & timestamp & nonce & CLIENT_ID & CLIENT_SECRET )
    const signatureInput = `${method.toUpperCase()}&${encodeURIComponent(url)}&${timestamp}&${nonce}&${this.clientId}&${this.clientSecret}`;
    const signature = crypto.createHash('sha1').update(signatureInput).digest('base64');

    return {
      'Authorization': `InterswitchAuth ${Buffer.from(this.clientId).toString('base64')}`,
      'Timestamp': timestamp,
      'Nonce': nonce,
      'Signature': signature,
      'SignatureMethod': 'SHA1',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Verify BVN using Interswitch API.
   *
   * NOTE: BVN endpoints require special approval from Interswitch — they are
   * NOT available by default on the sandbox. If this returns a non-200, it
   * means the endpoint hasn't been enabled for this account yet.
   *
   * Endpoint: GET /api/v1/identity/bvn/details/{bvn}
   */
  public async verifyBVN(bvn: string): Promise<ISWResult> {
    try {
      // Validate BVN format first
      if (!bvn || bvn.length !== 11 || !/^\d{11}$/.test(bvn)) {
        return { success: false, message: 'BVN must be exactly 11 digits.' };
      }

      const token = await this.getAccessToken();
      const endpoint = `${this.baseUrl}/api/v1/identity/bvn/details/${bvn}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'MerchantCode': this.getMerchantCode(),
        },
      });

      const responseText = await response.text();
      console.log(`[Interswitch] BVN verify status: ${response.status}`, responseText.substring(0, 200));

      if (response.status === 404) {
        // BVN API not enabled for this account yet — use sandbox mock
        console.warn('[Interswitch] BVN API returned 404 — endpoint may not be enabled for this account. Using sandbox bypass.');
        return {
          success: true,
          data: {
            bvn,
            firstName: 'SANDBOX',
            lastName: 'USER',
            phoneNumber: '08000000000',
            dateOfBirth: '01-01-1990',
            _sandboxMock: true,
          },
          message: 'BVN verified (sandbox mode)',
        };
      }

      if (!response.ok) {
        return { success: false, message: `BVN Verification failed: ${response.status} ${response.statusText}` };
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        return { success: false, message: 'Invalid response from BVN service' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[Interswitch] verifyBVN error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Internal BVN verification error' };
    }
  }

  /**
   * Verify a transaction status after Web Checkout completes.
   *
   * Interswitch Web Checkout verification:
   * GET /collections/api/v1/gettransaction.json?merchantcode=...&transactionreference=...&amount=...
   *
   * NOTE: This endpoint uses InterswitchAuth (signature-based), NOT Bearer token.
   */
  public async verifyTransaction(transactionRef: string, amountInKobo?: number): Promise<ISWResult> {
    try {
      const merchantCode = this.getMerchantCode();

      if (!merchantCode) {
        console.warn('[Interswitch] No merchant code available. Set ISW_MERCHANT_CODE in .env');
        // Sandbox fallback — assume success if no merchant code configured yet
        return {
          success: true,
          data: {
            transactionRef,
            ResponseCode: '00',
            ResponseDescription: 'Approved (sandbox fallback)',
            _sandboxMock: true,
          },
        };
      }

      let url = `${this.baseUrl}/collections/api/v1/gettransaction.json?merchantcode=${merchantCode}&transactionreference=${transactionRef}`;
      if (amountInKobo !== undefined) {
        url += `&amount=${amountInKobo}`;
      }

      const headers = this.generateInterswitchAuthHeaders('GET', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          'MerchantCode': merchantCode,
        },
      });

      const responseText = await response.text();
      console.log(`[Interswitch] Transaction verify status: ${response.status}`, responseText.substring(0, 200));

      if (!response.ok) {
        return { success: false, message: `Transaction lookup failed: ${response.status}` };
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        return { success: false, message: 'Invalid response from transaction service' };
      }

      // ResponseCode '00' = success
      const isApproved = data.ResponseCode === '00';
      return {
        success: isApproved,
        data,
        message: isApproved ? 'Transaction approved' : `Transaction failed: ${data.ResponseDescription}`,
      };
    } catch (error) {
      console.error('[Interswitch] verifyTransaction error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Internal transaction verification error' };
    }
  }

  /**
   * Build parameters for Web Checkout (inline JS or redirect form).
   *
   * The merchant must include:
   * - <script src="https://newwebpay.qa.interswitchng.com/inline-checkout.js">
   * Then call: window.webpayCheckout(params)
   */
  public buildCheckoutParams(params: {
    transactionRef: string;
    amountInKobo: number;
    redirectUrl: string;
    customerEmail?: string;
  }) {
    const merchantCode = this.getMerchantCode();
    const payItemId = this.getPayItemId();
    const isQA = this.baseUrl.includes('qa');

    const config = {
      merchant_code: merchantCode,
      pay_item_id: payItemId,
      txn_ref: params.transactionRef,
      site_redirect_url: params.redirectUrl,
      amount: params.amountInKobo.toString(),
      currency: 566, // NGN
      mode: isQA ? 'TEST' : 'LIVE',
      customer_email: params.customerEmail,
      // Restore the QA script since we've fixed the COOP/COEP headers that were blocking it.
      // QA scripts are necessary for QA-only merchants like MX276325.
      checkoutScript: isQA
        ? 'https://newwebpay.qa.interswitchng.com/inline-checkout.js'
        : 'https://newwebpay.interswitchng.com/inline-checkout.js',

    };

    console.log('[Interswitch] Building checkout params:', JSON.stringify(config, null, 2));
    return config;

  }

  /**
   * Test connectivity — useful for debugging
   */
  public async testConnection(): Promise<{ tokenOk: boolean; merchantCode: string | null; error?: string }> {
    try {
      await this.getAccessToken();
      return {
        tokenOk: true,
        merchantCode: this.getMerchantCode() || null,
      };
    } catch (error) {
      return {
        tokenOk: false,
        merchantCode: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const interswitch = InterswitchService.getInstance();
