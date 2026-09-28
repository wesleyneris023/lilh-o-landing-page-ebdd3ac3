-- Keep the rate-limit state table inaccessible through the public Data API.
create policy pedido_rate_limits_no_client_access
on public.pedido_rate_limits
for all
to anon, authenticated
using (false)
with check (false);

revoke all on table public.pedido_rate_limits from anon, authenticated;
