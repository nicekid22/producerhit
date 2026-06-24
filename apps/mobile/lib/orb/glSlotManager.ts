import { useLayoutEffect, useState } from "react";

import { isExpoGo } from "@/lib/expoRuntime";

export type GlSlotPriority = "critical" | "high" | "normal" | "low";

const PRIORITY_WEIGHT: Record<GlSlotPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

type Holder = {
  priority: GlSlotPriority;
  weight: number;
  wants: boolean;
  granted: boolean;
  onGrant: () => void;
  onRevoke: () => void;
};

function maxSlots(): number {
  return isExpoGo() ? 2 : 3;
}

class GlSlotManager {
  private holders = new Map<string, Holder>();

  request(
    id: string,
    priority: GlSlotPriority,
    wants: boolean,
    onGrant: () => void,
    onRevoke: () => void,
  ): () => void {
    this.holders.set(id, {
      priority,
      weight: PRIORITY_WEIGHT[priority],
      wants,
      granted: false,
      onGrant,
      onRevoke,
    });
    this.rebalance();
    return () => {
      const holder = this.holders.get(id);
      if (holder?.granted) holder.onRevoke();
      this.holders.delete(id);
      this.rebalance();
    };
  }

  setWants(id: string, wants: boolean): void {
    const holder = this.holders.get(id);
    if (!holder || holder.wants === wants) return;
    holder.wants = wants;
    this.rebalance();
  }

  private rebalance(): void {
    const active = [...this.holders.entries()]
      .filter(([, h]) => h.wants)
      .sort((a, b) => b[1].weight - a[1].weight);

    const grantedIds = new Set(active.slice(0, maxSlots()).map(([id]) => id));

    for (const [id, holder] of this.holders) {
      const shouldGrant = holder.wants && grantedIds.has(id);
      if (shouldGrant && !holder.granted) {
        holder.granted = true;
        holder.onGrant();
      } else if (!shouldGrant && holder.granted) {
        holder.granted = false;
        holder.onRevoke();
      }
    }
  }
}

const manager = new GlSlotManager();

/** Limite les contextes WebGL simultanés (crash Expo Go si trop d'orbs actifs). */
export function useGlSlot(priority: GlSlotPriority, wants = true): boolean {
  const [granted, setGranted] = useState(false);
  const id = useGlSlotId();

  useLayoutEffect(() => {
    return manager.request(
      id,
      priority,
      wants,
      () => setGranted(true),
      () => setGranted(false),
    );
  }, [id, priority]);

  useLayoutEffect(() => {
    manager.setWants(id, wants);
  }, [id, wants]);

  return granted;
}

let slotCounter = 0;

function useGlSlotId(): string {
  const [id] = useState(() => `gl-slot-${slotCounter++}`);
  return id;
}
