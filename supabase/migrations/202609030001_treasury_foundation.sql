-- Treasury Atom production persistence foundation.
-- Contains no sample balances, bank credentials, or fabricated financial records.

create extension if not exists pgcrypto;

create table public.treasury_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  base_currency text not null default 'AED' check (base_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now()
);

create table public.treasury_memberships (
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'treasury', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

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

create table public.treasury_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  display_name text not null,
  bank_name text not null,
  account_masked text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'review_required' check (status in ('review_required', 'active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.treasury_bank_statements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  bank_account_id uuid not null references public.treasury_bank_accounts(id) on delete restrict,
  statement_date date not null,
  source_filename text not null,
  source_format text not null check (source_format in ('csv', 'xlsx', 'pdf')),
  parser_status text not null check (parser_status in ('validated', 'review_required', 'pending_supported_parser', 'rejected')),
  evidence_path text,
  validation_errors jsonb not null default '[]'::jsonb,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.treasury_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  bank_account_id uuid not null references public.treasury_bank_accounts(id) on delete restrict,
  statement_id uuid references public.treasury_bank_statements(id) on delete set null,
  transaction_date date not null,
  value_date date,
  description text not null,
  debit numeric(20,4) not null default 0 check (debit >= 0),
  credit numeric(20,4) not null default 0 check (credit >= 0),
  running_balance numeric(20,4),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  reference text,
  review_status text not null default 'unmatched' check (review_status in ('matched', 'suggested', 'unmatched', 'exception', 'reviewed')),
  created_at timestamptz not null default now(),
  check (not (debit > 0 and credit > 0))
);

create table public.treasury_reconciliations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  transaction_id uuid not null references public.treasury_transactions(id) on delete cascade,
  status text not null check (status in ('matched', 'suggested', 'unmatched', 'exception')),
  matched_reference text,
  confidence numeric(5,2) check (confidence between 0 and 100),
  notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.treasury_close_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  balance_date date not null,
  status text not null default 'not_started' check (status in ('not_started', 'needs_review', 'evidence_uploaded', 'ready_for_approval', 'closed')),
  created_at timestamptz not null default now(),
  unique (organization_id, balance_date)
);

create table public.treasury_close_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  close_period_id uuid not null references public.treasury_close_periods(id) on delete cascade,
  title text not null,
  owner_id uuid references auth.users(id) on delete set null,
  due_date date,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'needs_review', 'complete', 'blocked')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.treasury_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  close_task_id uuid references public.treasury_close_tasks(id) on delete cascade,
  bank_account_id uuid references public.treasury_bank_accounts(id) on delete cascade,
  storage_path text not null,
  sha256 text not null check (sha256 ~ '^[a-fA-F0-9]{64}$'),
  media_type text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (close_task_id is not null or bank_account_id is not null)
);

create table public.treasury_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  action_type text not null,
  action_payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'executed')),
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.treasury_audit_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.treasury_organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  subject_type text not null,
  subject_id uuid,
  correlation_id uuid not null default gen_random_uuid(),
  receipt jsonb not null,
  created_at timestamptz not null default now()
);

create table public.treasury_motion_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index treasury_transactions_org_date_idx on public.treasury_transactions (organization_id, transaction_date desc);
create index treasury_transactions_account_idx on public.treasury_transactions (bank_account_id, review_status);
create index treasury_reconciliations_org_status_idx on public.treasury_reconciliations (organization_id, status);
create index treasury_tasks_period_status_idx on public.treasury_close_tasks (close_period_id, status);
create index treasury_audit_org_created_idx on public.treasury_audit_receipts (organization_id, created_at desc);
create index treasury_memberships_user_idx on public.treasury_memberships (user_id);
create index treasury_accounts_org_idx on public.treasury_bank_accounts (organization_id);
create index treasury_statements_account_idx on public.treasury_bank_statements (bank_account_id);
create index treasury_statements_org_idx on public.treasury_bank_statements (organization_id);
create index treasury_transactions_statement_idx on public.treasury_transactions (statement_id);
create index treasury_reconciliations_transaction_idx on public.treasury_reconciliations (transaction_id);
create index treasury_approvals_org_idx on public.treasury_approvals (organization_id);
create index treasury_evidence_org_idx on public.treasury_evidence (organization_id);
create index treasury_evidence_task_idx on public.treasury_evidence (close_task_id);
create index treasury_approvals_requested_by_idx on public.treasury_approvals (requested_by);
create index treasury_approvals_reviewed_by_idx on public.treasury_approvals (reviewed_by);
create index treasury_audit_actor_idx on public.treasury_audit_receipts (actor_id);
create index treasury_statements_uploaded_by_idx on public.treasury_bank_statements (uploaded_by);
create index treasury_tasks_org_idx on public.treasury_close_tasks (organization_id);
create index treasury_tasks_owner_idx on public.treasury_close_tasks (owner_id);
create index treasury_evidence_account_idx on public.treasury_evidence (bank_account_id);
create index treasury_evidence_uploaded_by_idx on public.treasury_evidence (uploaded_by);
create index treasury_reconciliations_reviewed_by_idx on public.treasury_reconciliations (reviewed_by);

alter table public.treasury_organizations enable row level security;
alter table public.treasury_memberships enable row level security;
alter table public.treasury_bank_accounts enable row level security;
alter table public.treasury_bank_statements enable row level security;
alter table public.treasury_transactions enable row level security;
alter table public.treasury_reconciliations enable row level security;
alter table public.treasury_close_periods enable row level security;
alter table public.treasury_close_tasks enable row level security;
alter table public.treasury_evidence enable row level security;
alter table public.treasury_approvals enable row level security;
alter table public.treasury_audit_receipts enable row level security;
alter table public.treasury_motion_preferences enable row level security;

create policy organizations_member_access on public.treasury_organizations
  for select to authenticated using (private.is_treasury_member(id));
create policy memberships_self_access on public.treasury_memberships
  for select to authenticated using (user_id = (select auth.uid()));

create policy accounts_member_access on public.treasury_bank_accounts
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy statements_member_access on public.treasury_bank_statements
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy transactions_member_access on public.treasury_transactions
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy reconciliations_member_access on public.treasury_reconciliations
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy periods_member_access on public.treasury_close_periods
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy tasks_member_access on public.treasury_close_tasks
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy evidence_member_access on public.treasury_evidence
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy approvals_member_access on public.treasury_approvals
  for all to authenticated using (private.is_treasury_member(organization_id)) with check (private.is_treasury_member(organization_id));
create policy audit_member_read on public.treasury_audit_receipts
  for select to authenticated using (private.is_treasury_member(organization_id));
create policy audit_member_append on public.treasury_audit_receipts
  for insert to authenticated with check (private.is_treasury_member(organization_id) and actor_id = (select auth.uid()));
create policy motion_preferences_owner_access on public.treasury_motion_preferences
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select on public.treasury_organizations, public.treasury_memberships to authenticated;
grant select, insert, update, delete on public.treasury_bank_accounts, public.treasury_bank_statements,
  public.treasury_transactions, public.treasury_reconciliations, public.treasury_close_periods,
  public.treasury_close_tasks, public.treasury_evidence, public.treasury_approvals,
  public.treasury_motion_preferences to authenticated;
grant select, insert on public.treasury_audit_receipts to authenticated;
