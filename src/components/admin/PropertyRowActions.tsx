"use client";
import { useState, useTransition } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

export default function PropertyRowActions({ id, listingKey, hidden }: { id?: string; listingKey?: string; hidden?: boolean | null }) {
  const [pending, start] = useTransition();
  const [localHidden, setLocalHidden] = useState(!!hidden);

  async function doPatch(updates: any) {
    const payload: any = { ...(id ? { id } : {}), ...(listingKey ? { listing_key: listingKey } : {}), ...updates };
    const res = await fetch('/api/admin/mls-properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Request failed');
  }

  async function doDelete() {
    const payload: any = { ...(id ? { id } : {}), ...(listingKey ? { listing_key: listingKey } : {}) };
    const res = await fetch('/api/admin/mls-properties', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Delete failed');
  }

  const hideLabel = localHidden ? 'Unhide' : 'Hide';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hover:cursor-pointer" disabled={pending}>Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Property</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => start(async () => {
            try {
              await doPatch({ hidden: !localHidden });
              setLocalHidden(!localHidden);
              // Soft refresh
              if (typeof window !== 'undefined') window.location.reload();
            } catch (e) { console.error(e); }
          })}
        >{hideLabel}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-variant="destructive"
          onClick={() => start(async () => {
            try {
              if (!confirm('Delete this property?')) return;
              await doDelete();
              if (typeof window !== 'undefined') window.location.reload();
            } catch (e) { console.error(e); }
          })}
        >Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
