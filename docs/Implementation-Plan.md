# Implementation Plan - Dashboard & Portfolio View Separation

This plan outlines the specific steps, modifications, and verifications required to separate the **Dashboard** (focusing on high-level summaries and performance charts) from a dedicated **Portfolio** view (detailed holdings grouped by asset category with CRUD operations).

---

## User Review Required

> [!IMPORTANT]
> **CRUD Boundaries for Holdings**:
> We will add Server Actions to `src/app/actions/portfolio.ts` to support editing and soft-deleting holdings directly from the new `/portfolio` page.
> All deletes will set `deletedAt: Timestamp` (soft deletes) as mandated by security rules.

---

## Open Questions

> [!NOTE]
> None. The layout and functional specifications align with your design request.

---

## Proposed Changes

### 1. Server Actions & Services

#### [MODIFY] [actions/portfolio.ts](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/actions/portfolio.ts)
*   Implement `deleteHolding(holdingId)` to set `deletedAt: serverTimestamp()` on the target document.
*   Implement `updateHolding(holdingId, { quantity, avgBuyPrice })` to update specific holding coordinates.
*   Implement `addSingleHolding(holding)` to support adding a manually entered position from the Portfolio page directly.

---

### 2. Layout & View Separation

#### [NEW] [portfolio/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/portfolio/page.tsx)
*   Build the server-side wrapper page `/portfolio`.
*   Verify user session and load active holdings from Firestore (`deletedAt == null`).
*   Retrieve live prices using `fetchPrices` and enrich using `computePortfolioStats`.
*   Pass enriched holdings and user `baseCurrency` preferences to a client view component.

#### [NEW] [portfolio/categorized-holdings.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/portfolio/categorized-holdings.tsx)
*   Create a client component to display holdings grouped category-wise:
    1. **Equities & ETFs** (type is `stock` or `etf`)
    2. **Cryptocurrencies** (type is `crypto`)
    3. **Mutual Funds** (type is `mutual_fund`)
*   Provide action headers at the top:
    *   **"Upload Screenshot"** (routes to `/portfolio/upload`).
    *   **"Add position manually"** (opens a manual addition modal rendering `AddHoldingForm`).
*   Render custom holdings tables for each group.
*   Add Edit Modal: allow updating quantity and average buy price.
*   Add Delete Confirmation Modal: invoke the `deleteHolding` server action.

#### [MODIFY] [dashboard/page.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/app/%28dashboard%29/dashboard/page.tsx)
*   Remove the detailed `HoldingsTable` from the bottom of the page.
*   Add a link/button inside the dashboard layout saying **"View Detailed Portfolio & Positions"** (using a premium gold/amber text gradient link with `ArrowRight` icon) pointing to `/portfolio`.

---

### 3. Sidebar Links

#### [MODIFY] [layout/sidebar.tsx](file:///c:/Users/Gaurav%20Kumar/Desktop/Portfolio%20Pulse/src/components/layout/sidebar.tsx)
*   Change the sidebar link for "Portfolio" from `ROUTES.upload` (directing to screenshot upload) to `ROUTES.portfolio` (directing to the new categorized holdings listing page).

---

## Verification Plan

### Automated Tests
*   Run the compiler build validation:
    ```powershell
    npm run build
    ```

### Manual Verification
1.  **Dashboard Inspection**: Check `/dashboard` page and verify the holdings table is removed from the bottom and replaced with the navigation CTA.
2.  **Portfolio Ingestion Flows**:
    *   Click "Portfolio" in the sidebar and verify it routes to `/portfolio`.
    *   Click **"Upload Screenshot"** on `/portfolio` and verify it takes you to the screenshot upload dropzone page, which redirects back to the dashboard/portfolio upon confirmation.
    *   Click **"Add manually"** on `/portfolio` and add a test asset. Verify it shows up immediately in the categorized section.
3.  **CRUD Actions**:
    *   Click "Edit" on a holding row, modify quantity/average buy price, save, and check updated figures.
    *   Click "Delete" on a holding row, confirm, and verify the holding is removed from the page and set as soft-deleted in Firestore.
