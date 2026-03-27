import { TableRow } from '@keira/shared/constants';

export const CREATURE_IMMUNITIES_TABLE = 'creature_immunities';
export const CREATURE_IMMUNITIES_ID = 'ID';
export const CREATURE_IMMUNITIES_CUSTOM_STARTING_ID = 11_000;
export const CREATURE_IMMUNITIES_SEARCH_FIELDS = [CREATURE_IMMUNITIES_ID, 'SchoolMask', 'MechanicsMask'];

export class CreatureImmunities extends TableRow {
  ID: number = 0;
  SchoolMask: number = 0;
  DispelTypeMask: number = 0;
  MechanicsMask: number = 0;
  Effects: string = '';
  Auras: string = '';
  ImmuneAoE: number = 0;
  ImmuneChain: number = 0;
  Comment: string = '';
}
