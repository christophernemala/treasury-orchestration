create schema if not exists private;

create or replace function private.is_treasury_member(target_organization uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.treasury_memberships membership
    where membership.organization_id = target_organization
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_treasury_member(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_treasury_member(uuid) to authenticated;

alter policy organizations_member_access on public.treasury_organizations using (private.is_treasury_member(id));
alter policy accounts_member_access on public.treasury_bank_accounts using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy statements_member_access on public.treasury_bank_statements using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy transactions_member_access on public.treasury_transactions using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy reconciliations_member_access on public.treasury_reconciliations using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy periods_member_access on public.treasury_close_periods using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy tasks_member_access on public.treasury_close_tasks using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy evidence_member_access on public.treasury_evidence using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy approvals_member_access on public.treasury_approvals using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
alter policy audit_member_read on public.treasury_audit_receipts using (private.is_treasury_member(organization_id));
alter policy audit_member_append on public.treasury_audit_receipts with check (private.is_treasury_member(organization_id) and actor_id = (select auth.uid()));

revoke all on function public.is_treasury_member(uuid) from public, anon, authenticated;
drop function public.is_treasury_member(uuid);
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

create index if not exists treasury_memberships_user_idx on public.treasury_memberships (user_id);
create index if not exists treasury_accounts_org_idx on public.treasury_bank_accounts (organization_id);
create index if not exists treasury_statements_account_idx on public.treasury_bank_statements (bank_account_id);
create index if not exists treasury_statements_org_idx on public.treasury_bank_statements (organization_id);
create index if not exists treasury_transactions_statement_idx on public.treasury_transactions (statement_id);
create index if not exists treasury_reconciliations_transaction_idx on public.treasury_reconciliations (transaction_id);
create index if not exists treasury_approvals_org_idx on public.treasury_approvals (organization_id);
create index if not exists treasury_evidence_org_idx on public.treasury_evidence (organization_id);
create index if not exists treasury_evidence_task_idx on public.treasury_evidence (close_task_id);
