'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApprovalStatus, PaginationMeta, PendingApproval } from '@rokdajob/shared';
import { Building2, Check, Loader2, Mail, Phone, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { ApiClientError, api } from '@/lib/api/client';
import { ApprovalBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label, Textarea } from '@/components/ui/field';
import { canDecide, getStoredAdmin } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

type Tab = Extract<ApprovalStatus, 'PENDING' | 'APPROVED' | 'REJECTED'>;

const TABS: { value: Tab; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

type Counts = Partial<Record<ApprovalStatus, number>>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * The contractor approval queue.
 *
 * Rejection demands a reason, because the contractor is shown it verbatim the next time
 * they try to sign in — "no" without a cause is an unanswerable support ticket.
 */
export function ContractorQueue() {
  const [tab, setTab] = useState<Tab>('PENDING');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [rejecting, setRejecting] = useState<PendingApproval | undefined>();

  const queryClient = useQueryClient();
  const allowed = canDecide(getStoredAdmin());

  const list = useQuery({
    queryKey: ['contractors', tab, query],
    queryFn: () =>
      api.request<PendingApproval[], PaginationMeta>('/admin/contractors', {
        query: { status: tab, limit: 50, ...(query ? { q: query } : {}) },
      }),
  });

  const counts = useQuery({
    queryKey: ['contractor-counts'],
    queryFn: () => api.get<Counts>('/admin/contractors/counts'),
  });

  /** Both decisions move a row between tabs, so every cached list is invalidated. */
  function refreshAll(): void {
    void queryClient.invalidateQueries({ queryKey: ['contractors'] });
    void queryClient.invalidateQueries({ queryKey: ['contractor-counts'] });
  }

  const approve = useMutation({
    mutationFn: (row: PendingApproval) => api.patch(`/admin/contractors/${row.id}/approve`, {}),
    onSuccess: (_data, row) => {
      toast.success(`${row.companyName ?? row.name} approved`);
      refreshAll();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : 'Could not approve.');
    },
  });

  const reject = useMutation({
    mutationFn: ({ row, reason }: { row: PendingApproval; reason: string }) =>
      api.patch(`/admin/contractors/${row.id}/reject`, { reason }),
    onSuccess: (_data, { row }) => {
      toast.success(`${row.companyName ?? row.name} rejected`);
      setRejecting(undefined);
      refreshAll();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiClientError ? error.message : 'Could not reject.');
    },
  });

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const countsByStatus = counts.data ?? {};
  const loading = list.isPending;
  const error = list.error
    ? list.error instanceof ApiClientError
      ? list.error.message
      : 'Could not load the queue.'
    : undefined;
  const busyId = approve.isPending
    ? approve.variables?.id
    : reject.isPending
      ? reject.variables?.row.id
      : undefined;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Contractor approvals</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Contractors cannot post jobs or contact workers until they are approved here.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void list.refetch()}
          disabled={list.isFetching}
        >
          <RefreshCw className={cn(list.isFetching && 'animate-spin')} aria-hidden />
          Refresh
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Approval status" className="bg-muted flex rounded-md p-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => setTab(item.value)}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                tab === item.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              {countsByStatus[item.value] !== undefined ? (
                <span className="text-muted-foreground ml-1.5 text-xs">
                  {countsByStatus[item.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <form
          className="ml-auto flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
        >
          <div className="relative">
            <Search
              className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, company"
              aria-label="Search contractors"
              className="w-56 pl-8"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setQuery('');
              }}
            >
              Clear
            </Button>
          ) : null}
        </form>
      </div>

      {error ? (
        <div className="bg-destructive-subtle border-destructive/30 text-destructive mt-5 rounded-md border p-4 text-sm">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="text-muted-foreground mt-6 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <div className="bg-card mt-5 rounded-lg border p-8 text-center">
          <p className="font-medium">Nothing here</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {tab === 'PENDING'
              ? 'No contractors are waiting for review.'
              : `No ${tab.toLowerCase()} contractors${query ? ' match that search' : ''}.`}
          </p>
        </div>
      ) : null}

      <ul className="mt-5 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="bg-card rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{row.companyName ?? 'No company name'}</h2>
                  <ApprovalBadge status={row.approval.status} />
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {row.name} · @{row.username}
                </p>

                <dl className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5" aria-hidden />
                    <dd>{row.email}</dd>
                  </div>
                  {row.phone ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5" aria-hidden />
                      <dd>{row.phone}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" aria-hidden />
                    <dd>Registered {formatDate(row.registeredAt)}</dd>
                  </div>
                </dl>

                {row.approval.reason ? (
                  <p className="bg-destructive-subtle text-destructive mt-2 rounded-md px-2.5 py-1.5 text-sm">
                    Reason: {row.approval.reason}
                  </p>
                ) : null}
              </div>

              {allowed && row.approval.status !== 'APPROVED' ? (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => approve.mutate(row)}
                    disabled={busyId === row.id}
                  >
                    {busyId === row.id ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <Check aria-hidden />
                    )}
                    Approve
                  </Button>
                  {row.approval.status === 'PENDING' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejecting(row)}
                      disabled={busyId === row.id}
                    >
                      <X aria-hidden />
                      Reject
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {meta && meta.total > rows.length ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Showing {rows.length} of {meta.total}. Narrow the list with search.
        </p>
      ) : null}

      {rejecting ? (
        <RejectDialog
          row={rejecting}
          busy={busyId === rejecting.id}
          onCancel={() => setRejecting(undefined)}
          onConfirm={(reason) => reject.mutate({ row: rejecting, reason })}
        />
      ) : null}
    </section>
  );
}

function RejectDialog({
  row,
  busy,
  onCancel,
  onConfirm,
}: {
  row: PendingApproval;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const tooShort = reason.trim().length < 5;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
    >
      <div className="bg-card w-full max-w-md rounded-lg border p-5 shadow-lg">
        <h2 id="reject-title" className="font-semibold">
          Reject {row.companyName ?? row.name}?
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          They are signed out immediately and shown this reason the next time they try to sign in.
          Give them something they can act on.
        </p>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="reject-reason">Reason</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            autoFocus
            onChange={(event) => setReason(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && tooShort}
            placeholder="Company registration could not be verified"
            maxLength={500}
          />
          <FieldError
            message={touched && tooShort ? 'Give a reason of at least 5 characters' : undefined}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy || tooShort}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Reject contractor
          </Button>
        </div>
      </div>
    </div>
  );
}
