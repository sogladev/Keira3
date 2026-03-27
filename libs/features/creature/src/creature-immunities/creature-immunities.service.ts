import { Injectable, inject } from '@angular/core';
import { SingleRowEditorService } from '@keira/shared/base-abstract-classes';
import {
  CREATURE_IMMUNITIES_ID,
  CREATURE_IMMUNITIES_TABLE,
  CreatureImmunities,
  SPELL_SCHOOL_MASK,
  MECHANIC_IMMUNE_MASK,
  DISPEL_TYPE_MASK,
  SPELL_DBC_EFFECT,
  SPELL_DBC_APPLY_AURA_NAME,
} from '@keira/shared/acore-world-model';
import { CreatureImmunitiesHandlerService } from '../creature-immunities-handler.service';

@Injectable({
  providedIn: 'root',
})
export class CreatureImmunitiesService extends SingleRowEditorService<CreatureImmunities> {
  protected override readonly handlerService = inject(CreatureImmunitiesHandlerService);
  protected override _entityClass = CreatureImmunities;
  protected override _entityTable = CREATURE_IMMUNITIES_TABLE;
  protected override _entityIdField = CREATURE_IMMUNITIES_ID;
  protected override _entityNameField = CREATURE_IMMUNITIES_ID;
  protected override isMainEntity = true;

  constructor() {
    super();
    this.init();
  }

  /**
   * Compute a human-readable comment from the current form values and write it
   * into the `Comment` form control. Caller should refresh queries afterwards.
   */
  protected override onLoadedExistingEntity(entity: CreatureImmunities) {
    super.onLoadedExistingEntity(entity);
  }

  generateComment(): void {
    const row = this._form.getRawValue() as CreatureImmunities;
    const comment = this.buildComment(row);
    this._form.controls.Comment.setValue(comment);
    this._form.controls.Comment.markAsDirty();
    this.updateDiffQuery();

    const rawRow = this._form.getRawValue() as CreatureImmunities;
    const sanitizedRow: any = {};
    const defaults = new CreatureImmunities();

    for (const key of Object.keys(defaults) as (keyof CreatureImmunities)[]) {
      const val = rawRow[key];
      const sanitized = val as any;

      if (val === null || val === undefined) {
        sanitizedRow[key] = defaults[key];
        continue;
      }

      if (Array.isArray(sanitized)) {
        sanitizedRow[key] = sanitized.join(',');
        continue;
      }

      if (sanitized instanceof Set) {
        sanitizedRow[key] = [...sanitized].join(',');
        continue;
      }

      if (typeof sanitized === 'object') {
        try {
          sanitizedRow[key] = JSON.stringify(val);
        } catch (_) {
          sanitizedRow[key] = String(val);
        }
        continue;
      }

      sanitizedRow[key] = val;
    }

    // Ensure Id is present in the row given to the full-query builder.
    const idField = this._entityIdField as string;
    const originalId = (this._originalValue && (this._originalValue as any)[idField]) ?? (this._loadedEntityId as any);

    if (sanitizedRow[idField] === undefined || sanitizedRow[idField] === null || sanitizedRow[idField] === '') {
      sanitizedRow[idField] = originalId;
    }

    this._fullQuery = this.queryService.getFullDeleteInsertQuery<CreatureImmunities>(
      this._entityTable,
      [sanitizedRow],
      this._entityIdField,
    );
  }

  private buildComment(row: CreatureImmunities): string {
    const parts: string[] = [];

    const hex = (v: number) => `0x${v.toString(16).toUpperCase()}`;

    const normalizeName = (name: string): string => name.split(' - ')[0].trim();

    // School mask
    const schoolNames: string[] = [];
    for (const f of SPELL_SCHOOL_MASK) {
      if (((row.SchoolMask >> f.bit) & 1) === 1) schoolNames.push(f.name);
    }
    if (row.SchoolMask !== 0) {
      parts.push(`school=${hex(row.SchoolMask)}(${schoolNames.join('|')})`);
    }

    // Mechanics mask
    const mechNames: string[] = [];
    for (const f of MECHANIC_IMMUNE_MASK) {
      if (((row.MechanicsMask >> f.bit) & 1) === 1) mechNames.push(normalizeName(f.name));
    }
    if (row.MechanicsMask !== 0) {
      parts.push(`mech=${hex(row.MechanicsMask)}(${mechNames.join('|')})`);
    }

    // DispelType (flags from DispelTypeMask)
    const dispelNames: string[] = [];
    for (const f of DISPEL_TYPE_MASK) {
      if (((row.DispelTypeMask >> f.bit) & 1) === 1) dispelNames.push(normalizeName(f.name));
    }
    if (dispelNames.length > 0) {
      parts.push(`flags=${dispelNames.join('|')}`);
    }

    // Effects (CSV of ids) -> names
    const effects = (row.Effects || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n !== 0);
    const effectNames = effects.map((id) => normalizeName(SPELL_DBC_EFFECT.find((o) => o.value === id)?.name ?? `${id}`));
    if (effectNames.length > 0) {
      parts.push(`effects=${effectNames.join('|')}`);
    }

    // Auras (CSV of ids) -> names
    const auras = (row.Auras || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n !== 0);
    const auraNames = auras.map((id) => normalizeName(SPELL_DBC_APPLY_AURA_NAME.find((o) => o.value === id)?.name ?? `${id}`));
    if (auraNames.length > 0) {
      parts.push(`auras=${auraNames.join('|')}`);
    }

    return parts.join(', ');
  }
}
