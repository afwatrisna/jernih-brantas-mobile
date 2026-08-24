# Supabase Auth and Field Mode authorization design

The next Jernih phase will use **Supabase Auth** for staff identity while keeping public dashboard reads available through the existing read-only policies. The chosen authorization model has three application roles: `viewer`, `field_operator`, and `admin`. Only `field_operator` users assigned to a station, or an `admin`, may insert a `manual` reading for that station.

The database design will add a `profiles` table linked one-to-one to `auth.users`, a `station_memberships` table that maps a field operator to permitted stations, and an optional `recorded_by` reference on manual readings. RLS will require a non-null authenticated identity, restrict Field Mode inserts to `source = 'manual'`, and prevent browsers from creating sensor or simulation records. Service-role ingestion remains the only pathway for future sensor gateways.

Supabase guidance confirms that exposed-schema tables need RLS, browser writes should use `auth.uid()` checks and explicit `TO authenticated` policies, and service-role credentials must not be exposed in browsers. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

The existing project currently has no `auth.users` records and no `profiles` or station-membership table, so no user is authorized for production manual writes yet.

## Local signed-out validation

The Field Mode screen was opened in a signed-out browser session. It displayed the officer email prompt and a disabled save action, confirming that anonymous visitors cannot submit manual readings from the interface. A signed-out session is intentionally treated as a normal state rather than an error; the underlying RLS test also verified that an anonymous public client cannot bypass this interface and insert a manual reading.

After the signed-out session handling adjustment, the same browser check displayed only the intended email prompt and disabled save control, with no session-verification error. The login email flow itself remains untested because it would send an external sign-in email and requires a user-approved staff address plus Supabase redirect configuration.
