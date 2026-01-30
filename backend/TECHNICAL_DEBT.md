# Technical Debt Documentation

This document tracks all known TODOs, technical debt, and future improvements identified in the mudbase backend codebase.

Last Updated: 2026-01-30

---

## Critical Priority

### 1. Labor Hours Field Implementation (Version 2)
**Status**: Planned for Version 2
**Impact**: High - Affects estimate calculations and labor pricing
**Scope**: 24+ instances across multiple files

**Affected Files**:
- `backend/src/db/entities/estimate/entity_estimate_labor_items.ts`
- `backend/src/db/entities/estimate/offers/entity_estimate_offers.ts`
- `backend/src/db/entities/offers/labor_offers.ts`
- `backend/src/db/entities/catalog/labors.ts/labor_prices_journal.ts`
- `backend/src/api/estimate/estimate_labor/estimate_update_labor_item.ts` (3 instances)
- `backend/src/api/catalog/offers/labor_offer.ts` (7 instances)
- `backend/src/permissions/db_fields_setup.ts`
- `backend/src/permissions/db_get_fields.ts`

**Description**: Multiple fields and calculations marked with `//🔴 TODO: this will need us in version 2` related to laborHours tracking and calculations. This appears to be a planned feature for tracking actual hours worked vs estimated hours.

**Action Required**:
- Decide if laborHours will be implemented in Version 2
- If yes: Create implementation plan with database migration
- If no: Remove TODO comments and document decision

---

### 2. Permission Checks in Signup Flow
**Status**: Incomplete implementation
**Impact**: High - Security implications
**Scope**: 4 instances

**Affected Files**:
- `backend/src/api/signup/signup_invite.ts` (lines 29, 95, 211)
- `backend/src/api/signup/signup_register.ts` (line 24)
- `backend/src/api/signup/signup_approve.ts` (line 31)

**TODOs**:
1. `signup_invite.ts:29` - "TODO: check permissions" - Need to verify user has permission to invite
2. `signup_invite.ts:95` - "TODO: check permissions" - Verify permissions before processing invitation
3. `signup_invite.ts:211` - "TODO: check permissions" - Check permissions before sending invite
4. `signup_register.ts:24` - "TODO: based on role and account type" - Implement role-based permission assignment
5. `signup_approve.ts:31` - "TODO: add function for update" - Need dedicated function for approval updates

**Action Required**: Implement permission validation in signup endpoints before production use

---

### 3. AccountId Handling in Auth
**Status**: Implementation needed
**Impact**: Medium - Affects user session management
**Scope**: 2 instances

**Affected Files**:
- `backend/src/authjs/authjs_get_session.ts` (line 71)
- `backend/src/authjs/authjs_authorize.ts` (line 46)

**Description**: AccountId TODO comments suggest incomplete account association in authentication flow.

**Action Required**: Review and complete accountId handling in auth flows

---

## High Priority

### 4. Translation Missing Keys
**Status**: Incomplete internationalization
**Impact**: Medium - Affects user experience in non-English locales
**Scope**: 8+ instances

**Affected Files**:
- `backend/src/api/catalog/labors/labor_category.ts` (lines 640, 665)
- `backend/src/api/catalog/labors/labor_subcategory.ts` (line 315)
- `backend/src/api/catalog/labors/labor_item.ts` (line 571)
- `backend/src/api/catalog/materials/material_category.ts` (line 426)
- `backend/src/api/catalog/materials/material_subcategory.ts` (line 326)
- `backend/src/api/catalog/materials/material_item.ts` (line 164)
- `backend/src/api/signup/signup_invite.ts` (lines 137, 145)
- `backend/src/api/auth/user_password_reset.ts` (line 86)

**Description**: Several error messages and user-facing strings need translation keys added to support multiple languages.

**Action Required**:
1. Extract hardcoded strings to translation files
2. Add translation keys for all supported languages
3. Update code to use i18n translation functions

---

## Medium Priority

### 5. Error Handling Improvements
**Status**: Basic implementation exists
**Impact**: Low-Medium - Code quality improvement
**Scope**: 1 instance

**Affected File**:
- `backend/src/tslib/assert.ts` (line 4)

**TODO**: "figure out better error handling"

**Description**: Current assertion/error handling could be improved with better error types and messages.

**Action Required**: Review and enhance error handling strategy across the application

---

### 6. Hardcoded Currency
**Status**: Not configurable
**Impact**: Low-Medium - Limits multi-currency support
**Scope**: 1+ instances

**Affected File**:
- `backend/src/api/catalog/offers/labor_offer.ts` (line 329)

**TODO**: "then it will take from database"

**Description**: Currency appears to be hardcoded as 'AMD' instead of being configurable per account or retrieved from database.

**Action Required**: Make currency configurable at the account level

---

### 7. Data Fetching Optimization
**Status**: Basic implementation
**Impact**: Medium - Performance optimization opportunity
**Scope**: 1 instance

**Affected File**:
- `backend/src/api/accounts/accounts.ts` (line 245)

**TODO**: "only required fields"

**Description**: Consider optimizing data fetching to retrieve only required fields instead of full documents.

**Action Required**: Review MongoDB queries and implement field projection where beneficial

---

## Low Priority

### 8. Verification Logic
**Status**: Commented out
**Impact**: Low
**Scope**: 2 instances

**Affected Files**:
- `backend/src/api/measurement_unit/measurement_unit_fetch.ts` (line 15)
- `backend/src/api/signup/signup_register.ts` (line 46)

**Description**: Some verification logic is commented out. Need to determine if it should be re-enabled or removed.

**Action Required**: Review and decide whether to implement or remove

---

## Completed Cleanup (2026-01-30)

### ✅ Removed Unused Dependencies
- Removed: `cors`, `global`, `esm-module-alias`, `i18next-express-middleware`
- Removed: `@types/cors`
- Impact: ~56 packages removed (including transitive dependencies)
- Bundle size reduction: ~35 KB

### ✅ Fixed Broken Imports
- Fixed: `backend/src/api/auth/user_psw_change.ts` - Removed non-existent aws_cognito import
- Cleaned up all commented AWS Cognito code

### ✅ Code Cleanup
- Cleaned: `backend/src/app.ts` - Removed ~15 lines of commented middleware
- Cleaned: `backend/src/app_authjs.ts` - Removed ~50 lines of commented Auth.js code
- Result: Improved code readability and maintainability

---

## Future Considerations

### Potential Optimizations (Not Scheduled)

1. **CLI Utilities Consolidation**
   - `backend/src/tscli/` directory has 7 files
   - Only `oslib.ts` is actively used
   - Consider: Move to `tslib/` and remove unused utilities

2. **Commented Code in API Files**
   - `backend/src/api/users/users_fetch.ts` - 20+ lines of commented MongoDB queries
   - `backend/src/api/catalog/offers/labor_offer.ts` - 25+ lines commented
   - Consider: Remove or document why alternatives are kept

3. **Drizzle Schema**
   - `backend/src/drizzle/schema.ts` - Commented old session schema
   - Consider: Remove if no longer needed

---

## Notes

- All API endpoints (80+) remain functional after cleanup
- MongoDB and MySQL connections preserved
- Auth.js authentication working correctly
- Estimate calculation and PDF generation intact
- No database migrations required for current cleanup

---

## How to Use This Document

1. **Before Starting Work**: Review relevant sections to understand context
2. **When Adding TODOs**: Add them to this document with proper categorization
3. **When Completing Work**: Move items to "Completed" section with date
4. **Sprint Planning**: Use priority levels to guide feature development
5. **Code Reviews**: Reference this document when reviewing related code

---

## Priority Definitions

- **Critical**: Blocks important features or has security implications
- **High**: Affects user experience or code quality significantly
- **Medium**: Nice-to-have improvements or optimizations
- **Low**: Future enhancements or minor issues
