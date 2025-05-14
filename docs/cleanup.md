# Frontend Cleanup Plan

This document outlines the steps to remove unused components, services, and configurations from the frontend application, focusing on retaining only the core voice agent functionality.

## Phase 1: Initial Cleanup

1.  **Remove Unused Component Directories**:
    *   Delete `frontend/src/components/Auth`
    *   Delete `frontend/src/components/Cart`
    *   Delete `frontend/src/components/Footer`
    *   Delete `frontend/src/components/Menu`
    *   Delete `frontend/src/components/Profile`
    *   Identify and remove any imports related to these components throughout the codebase.

2.  **Remove Unused VoiceAgent Sub-Components**:
    *   Delete `frontend/src/components/VoiceAgent/OrderDetails.tsx`
    *   Delete `frontend/src/components/VoiceAgent/VoiceAgentSettings.tsx`
    *   Identify and remove any imports related to these components.

3.  **Remove Additional Unused Components**:
    *   Delete `frontend/src/components/PropertyList.tsx`
    *   Delete `frontend/src/components/SearchFilters.tsx`
    *   Delete `frontend/src/components/VoiceAgentSettings.tsx` (top-level one)
    *   Identify and remove any imports related to these components.

4.  **Remove Unused Services**:
    *   Delete `frontend/src/services/authService.ts`
    *   Delete `frontend/src/services/menuService.ts`
    *   Delete `frontend/src/services/orderService.ts`
    *   Delete `frontend/src/services/propertyService.ts`
    *   Delete `frontend/src/services/userService.ts`
    *   Identify and remove any imports related to these services.

5.  **Remove Unused Redux Slices**:
    *   Delete `frontend/src/store/slices/authSlice.ts`
    *   Delete `frontend/src/store/slices/menuSlice.ts`
    *   Delete `frontend/src/store/slices/orderSlice.ts`
    *   Delete `frontend/src/store/slices/themeSlice.ts`
    *   Delete `frontend/src/store/slices/voiceAgentSettingsSlice.ts`
    *   Identify and remove imports related to these slices.
    *   Update the Redux store configuration (`frontend/src/store/store.ts` or similar) to remove references to these slices.

6.  **Remove Unused Types Folder**:
    *   Delete the `frontend/src/types` directory.
    *   Identify and remove any imports related to types from this folder.

7.  **Cleanup `CONSTANTS.ts`**:
    *   Edit `frontend/src/utils/CONSTANTS.ts` to remove restaurant-specific constants (e.g., `MENU_CATEGORIES`, `ORDER_STATUS`, `PAYMENT_METHODS`, financial constants related to orders/delivery).

## Phase 2: Verification and Refinement

1.  **Dependency Check**:
    *   Review `package.json` for any unused dependencies that can be removed.

2.  **Build Test**:
    *   Run `npm run build` (or the equivalent build command for your project) to ensure the application builds successfully without errors.

3.  **Runtime Test**:
    *   Thoroughly test the voice agent functionality to confirm it remains fully operational.
    *   Check the browser console for any errors.

4.  **Code Review**:
    *   Manually review the changes to catch any missed anachronisms or broken imports.

## Phase 3: Documentation Update (As per Custom Instructions)

1.  Create/Update `Readme.md` for project context, structure, and setup.
2.  Create/Update `docs/cursor/feature-design.md`.
3.  Create/Update `docs/cursor/current-state.md`.
4.  Create/Update `docs/cursor/changelog.md`.
5.  Create/Update `docs/cursor/memory.md`.
6.  Create/Update `docs/cursor/architecture.md`.

This phased approach will help manage the cleanup systematically and minimize the risk of breaking existing functionality. 