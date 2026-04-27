# Security Specification - GreenWalks

## Data Invariants
1. **User Identity Isolation**: A user can only access and modify their own data (`/users/{userId}/**`).
2. **Trip Immutability**: Once a trip is recorded (`/users/{userId}/trips/{tripId}`), it cannot be modified, only deleted.
3. **Schema Integrity**: All documents must strictly adhere to the defined schema. No extra fields ("ghost fields") allowed.
4. **Verified Access**: All write operations require the user's email to be verified.
5. **ID Validation**: All document IDs must be valid strings (size, pattern).

## The Dirty Dozen Payloads

1. **Identity Spoofing (Create)**: Create a user document with a different `userId` in the path than the auth UID.
2. **Identity Spoofing (Write)**: Update `email` or `name` of another user's document.
3. **Resource Poisoning**: Create a `Trip` with a 2MB string as the `id`.
4. **Ghost Field Injection**: Add `isAdmin: true` to a `UserStats` update.
5. **State Shortcutting**: Manually increment `level` to 100 without increasing `experience`.
6. **Temporal Violation**: Set `lastActive` to a timestamp 10 years in the future.
7. **Cross-User Leak**: Attempt to `list` trips from `/users/ANOTHER_USER_ID/trips`.
8. **Unverified Write**: Attempt to create a trip without a verified email.
9. **Invalid Type**: Set `totalDistance` to a string `"lots"`.
10. **Orphaned Write**: Create a trip for a user document that doesn't exist (if we used relational checks, but here it's a subcollection).
11. **Mass Update**: Attempt to update `badges` and `theme` in a single request without using the restricted update actions.
12. **Negative Values**: Set `totalCO2Saved` to `-5000`.

## Test Runner (Draft Plan)
The following tests will be implemented in `src/lib/firestore.test.ts` (or equivalent) to verify these failures.

| Test Case | Operation | Target Path | Expected |
|-----------|-----------|-------------|----------|
| Identity Spoofing | CREATE | /users/other_id | DENIED |
| Ghost Field | UPDATE | /users/my_id | DENIED |
| Unverified Email | CREATE | /users/my_id/trips/t1 | DENIED |
| Trip Update | UPDATE | /users/my_id/trips/t1 | DENIED |
| Size Limit | CREATE | /users/my_id | DENIED (if string exceeds) |
