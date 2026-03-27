import { Flag } from '@keira/shared/constants';

export const DISPEL_TYPE_MASK: Flag[] = [
  { bit: 0, name: 'None' },
  { bit: 1, name: 'Magic' },
  { bit: 2, name: 'Curse' },
  { bit: 3, name: 'Disease' },
  { bit: 4, name: 'Poison' },
  { bit: 5, name: 'Stealth' },
  { bit: 6, name: 'Invisibility' },
  { bit: 7, name: 'All(M+C+D+P)' },
  { bit: 8, name: 'Special - npc only' },
  { bit: 9, name: 'Enrage' },
  { bit: 10, name: 'ZG Trinkets' },
  { bit: 11, name: 'ZZOLD UNUSED' },
];
