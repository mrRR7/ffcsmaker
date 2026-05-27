import { TimeSlot } from '@/engine/types';

export function normalizeSlotString(slots: string | undefined): string[] {
  if (!slots) return [];
  return slots.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}

export function resolveLabSlotIds(rawSlots: string | undefined, slots: TimeSlot[]): string[] {
  if (!rawSlots) return [];
  
  // Extract all L-numbers from the input
  const matches = rawSlots.toUpperCase().match(/L\d+/g) || [];
  const foundIds = new Set<string>();
  
  const catalogLabSlots = slots.filter(s => s.kind === "lab");
  
  for (const match of matches) {
    // Find the lab slot pair that contains this L-number
    const slot = catalogLabSlots.find(s => {
       const parts = s.label.split('+').map(p => p.trim());
       return parts.includes(match);
    });
    if (slot) {
      foundIds.add(slot.id);
    }
  }
  
  return Array.from(foundIds);
}

export function resolveTheorySlotIds(rawSlots: string | undefined, slots: TimeSlot[]): string[] {
  if (!rawSlots) return [];
  // Also split by + in case they wrote A1+A2 instead of A1, A2
  const normalized = rawSlots.split(/[,+]/).map(s => s.trim().toUpperCase()).filter(Boolean);
  
  const theorySlots = slots.filter(s => s.kind === "theory");
  const foundIds = new Set<string>();
  
  for (const label of normalized) {
    const matchingSlots = theorySlots.filter(s => s.label === label);
    matchingSlots.forEach(s => foundIds.add(s.id));
  }
  
  return Array.from(foundIds);
}
