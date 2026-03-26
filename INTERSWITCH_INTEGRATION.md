# 🚀 Next Steps for Interswitch Integration (Post-Approval)

> [!NOTE]
> The foundational integration is complete. Auth handshake, payment initiation, checkout widget loading (fixed from "refused to connect"), and transaction verification are all fully operational in the **QA environment**.

---

## ⏳ **Current Blocker: Dashboard Review State**
The user's business account is currently **`Pending Review approval`** on the Interswitch onboarding console. While the payment flow is working for testing, other endpoints like **BVN/Identity** currently return **`404 Not Found`** because the merchant profile hasn't been fully loaded into those gateway tables yet.

---

## 🚀 **Remaining Tasks (Once Business Profile is Approved)**

### **Step 1: Unblock Identity Endpoints (BVN)**
As soon as the review is cleared:
- **Action**: Test the `verifyBVN()` endpoint again. It should now start returning real name verification data instead of the sandbox mock.
- **Requirement**: No code changes needed, as we've already added the `MerchantCode` header and correctly configured the `Bearer` token handshake.

### **Step 2: Implement Payouts / Automated Disbursements**
Once payments are being collected, the application will need to disburse funds to members of the circle. We want to avoid manual transfers.
- **Documentation**: Refer to [Interswitch Transfers / Payouts](https://docs.interswitchgroup.com/docs/home).
- **Automation Plan**: Integrate the `POST /api/v2/transfers` endpoint.
- **Requirements**: This requires "Transfer" permissions enabled on your Interswitch Merchant Dashboard.

### **Step 3: Transition to Production (Go Live)**
When you're ready to collect real money from real cards:
1. **Update `.env`**:
   - Change `ISW_BASE_URL` to the Production URL: `https://api.interswitchng.com`.
   - Update `ISW_CLIENT_ID` and `ISW_CLIENT_SECRET` with your Live production credentials.
   - Ensure `ISW_MERCHANT_CODE` is set to your production code.
2. **Switch Mode**: 
   - The code is already dynamic; once you change `ISW_BASE_URL` to a non-QA domain, the system will automatically switch from `mode: "TEST"` to `mode: "LIVE"`.

---

## 🏦 **Architecture: How We Differentiate Money Across Circles**

You have one Interswitch Merchant Account, but hundreds of Circles. How does the money stay separated?

### 1. The Single "Pool" Account
Physical money is fungible. When Circle A and Circle B both contribute, the money sits as one big balance in your Interswitch Settlement Account.

### 2. The Digital Ledger (The App Database)
The "Differentiation" happens in our database, which acts as the **source of truth** (the ledger).
- **The Circle Table**: Defines how much each member owes (`contributionAmount`).
- **The Rounds Table**: Tracks exactly how much has been collected *for that specific round* of *that specific circle*.
- **The Contributions Table**: Every single ₦50,000 payment is tagged with a `memberId`, a `roundId`, and a `transactionRef`.

### 3. The Payout Logic
When the app triggers a payout:
1. It looks at **Round #1 of "Enyata Circle"**.
2. It sees that `totalCollected` is ₦100,000.
3. It identifies the `recipientId` for Round #1.
4. It calls the **Disbursement API** to send exactly ₦100,000 to that recipient's bank account.

**Summary**: Your bank account holds the "Physical Cash," but the App Database holds the "Instructions" on who owns what.

---

## 🛠️ **Blueprint: Integrating the Disbursement API**

To automate payouts, we will add a `disbursePayment()` method to our `InterswitchService`.

### Prerequisites:
1. **Bank Details**: We must collect `accountNumber` and `bankCode` from every user during onboarding.
2. **Secret Hash**: Disbursement requires a `terminalId` and a secure `secret` from Interswitch.

### Technical Implementation Snippet:
```typescript
// lib/services/interswitch.ts (Potential Implementation)
public async disbursePayment(params: {
  accountNumber: string;
  bankCode: string; // e.g., '058' for GTB
  amountInKobo: number;
  transferRef: string;
}) {
  const token = await this.getAccessToken(); // Same Bearer token handshake
  const endpoint = `${this.baseUrl}/api/v2/transfers`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      amount: params.amountInKobo,
      accountNumber: params.accountNumber,
      bankCode: params.bankCode,
      requestRef: params.transferRef,
      // ... signature & terminalId fields
    })
  });

  return await response.json();
}
```

---
*Created for EsuX Delta-77 Integration*
