# 🤖 TO THE NEXT AI ASSISTANT: Interswitch Integration Context of EsuX

> [!IMPORTANT]
> **READ THIS COMPLETELY BEFORE WORKING ON INTERSWITCH.** This file contains the handover notes, learned behaviors, URL endpoints mismatch resolutions, and instructions on unlocking the direct Identity node routing.

---

## 🔗 1. Official API Reference docs
Keep this documentation link handy to pull specs for data payouts endpoints & payloads structures:
- **Documentation Center**: `https://docs.interswitchgroup.com/docs/home`

---

## 🟢 2. State of What is Configured

### **A. Auth Handshake resolved via QA node**
- Credentials are valid for the **QA Node** (`https://qa.interswitchng.com`), NOT default sandbox nodes.
- `.env` holds `ISW_CLIENT_ID` and `ISW_CLIENT_SECRET`. 
- `getAccessToken()` fetcher Singleton successfully pulls **`200 OK — Bearer access_token`** auth from QA passport route `/passport/oauth/token` now natively.

### **B. Service helper code & Singleton**
- File: `/lib/services/interswitch.ts` contains the configured service Singleton that manages Token Caching in-memory natively.
- Fixed: Drizzle query `rounds` types error directly within `lib/db/client.ts` to solve compiler issues ahead.
- Replace: Endpoint paths mapping within route calls verify standard parameters natively successfully.

---

## ⏳ 3. Known Blocker: Dashboard Review State

While auth successfully returns token authorizations, hitting BVN/Identity API node endpoints currently returns **`404 Not Found`**.

**Wait Status:** The user created an **Individual Business** profile on the Interswitch onboarding dashboard console just now. Dashboard state is **`Pending Review approval`** so the application profile profile is not loaded on gateway tables fully.

---

## 🚀 4. INSTRUCTIONS: How to Unblock endpoints once approved

As soon as the user says **"My Business profile review cleared on dashboard"**, follow these direct fix-routing checklist:

### **Step 1: Retrieve the Missing Router Header**
The Interswitch API gateway evaluates authorization using full profile links. You strictly need a **MerchantCode** header.
- **Instruct User**: Ask them to look up **Merchant Code** or **Aggregator ID** inside their newly approved dashboard.

### **Step 2: Update `.env` setup variables**
Add the discovered code to `.env` variables list:
```env
ISW_MERCHANT_CODE="MX12345" # Example ID provided by user
```

### **Step 3: Update `lib/services/interswitch.ts`**
Append the header lookup inside both `verifyBVN()` and `verifyTransaction()` dispatching calls:
```typescript
const response = await fetch(`${baseUrl}/api/v1/identity/bvn`, { // Note: use /identity/bvn path or check docs
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'MerchantCode': process.env.ISW_MERCHANT_CODE || '' // Adds appropriate routing
  },
  body: JSON.stringify({ bvn })
});
```

Verify if `response.status === 200` to parse out names safely, and continue implementing payouts endpoints according to official docs!
