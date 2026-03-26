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

### **Step 2: Implement Payouts / Disbursements**
Once payments are being collected, the application will need to disburse funds to members of the circle.
- **Documentation**: Refer to [Interswitch Transfers / Payouts](https://docs.interswitchgroup.com/docs/home).
- **Task**: Create a new service method in `lib/services/interswitch.ts` to handle `POST /payments/transfer`.
- **Requirements**: This will require separate approval from Interswitch for "Transfer" permissions on your merchant dashboard.

### **Step 3: Transition to Production (Go Live)**
When you're ready to collect real money from real cards:
1. **Update `.env`**:
   - Change `ISW_BASE_URL` to the Production URL: `https://api.interswitchng.com`.
   - Update `ISW_CLIENT_ID` and `ISW_CLIENT_SECRET` with your Live production credentials.
   - Ensure `ISW_MERCHANT_CODE` is set to your production code.
2. **Switch Mode**: 
   - The code is already dynamic; once you change `ISW_BASE_URL` to a non-QA domain, the system will automatically switch from `mode: "TEST"` to `mode: "LIVE"`.

---
*Created for EsuX Delta-77 Integration*
