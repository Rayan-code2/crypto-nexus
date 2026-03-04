
# CryptoNexus MLM Platform

## Deployment Steps

1.  **Supabase Setup**:
    *   Create a new project on [Supabase](https://supabase.com).
    *   Run the provided `schema.sql` in the SQL Editor.
    *   **Disable Email Confirmation**: 
        *   Go to **Authentication** -> **Providers** -> **Email**.
        *   Turn OFF "Confirm email". This allows users to register and login immediately.
    
2.  **Frontend Setup**:
    *   The app is built as a high-performance React SPA.
    *   Copy the `anon public` key and `Project URL` from Settings -> API into `lib/supabase.ts`.

3.  **Edge Functions**:
    *   The MLM logic (Matrix Placement, Level Commission calculation) should be handled via Supabase Edge Functions to ensure security and atomicity.

## MLM Plan Summary
*   **2x2 Forced Matrix**: Spillover from uplines fills gaps automatically.
*   **7 Levels**: Level 1 (50%), Levels 2-7 (5% each).
*   **AutoPools**: 10 distinct pools with global entry. 
*   **Ledger**: Wallet balances are derived/verified via the `transactions` ledger for audit compliance.
