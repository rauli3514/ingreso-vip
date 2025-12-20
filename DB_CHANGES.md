# Database Changes Required

This document tracks manually required changes to the Supabase database schema that cannot be automatically applied by the frontend code.

## 1. Add `assigned_event_ids` to `profiles` table

To support the "Multi-Assignment" of events to providers and users, we need a column to store the list of Event IDs they have access to.

**SQL Command to run in Supabase SQL Editor:**

```sql
ALTER TABLE profiles 
ADD COLUMN assigned_event_ids text[];
```

### Explanation:
- **Table**: `profiles`
- **Column**: `assigned_event_ids`
- **Type**: `text[]` (Array of text strings, which will hold UUIDs)
- **Purpose**: Allows a user (Provider or User Final) to be assigned to multiple specific events.

### Logic Update:
- **Superadmin**: Sees ALL events (bypass this check).
- **Owner**: Sees events where `owner_id` matches their ID.
- **Assigned User**: Sees events where the event ID is present in their `assigned_event_ids` array.

---

## 2. Verify Storage Buckets

Ensure the following Storage Buckets exist and have public read policies:

1.  **`event-assets`**: For event backgrounds, logos, and default screen loops.
2.  **`guest-videos`**: For personalized videos generated/uploaded for guests.

**Policy Example (Public Read All):**
- Bucket: `event-assets`
- Policy Name: `Public Read`
- Allowed Operations: `SELECT`
- Target Roles: `anon`, `authenticated`

**Policy Example (Authenticated Upload):**
- Bucket: `event-assets`
- Policy Name: `Authenticated Upload`
- Allowed Operations: `INSERT`, `UPDATE`
- Target Roles: `authenticated`
