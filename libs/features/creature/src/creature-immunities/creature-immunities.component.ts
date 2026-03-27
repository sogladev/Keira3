import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CreatureImmunities,
  MECHANIC_IMMUNE_MASK,
  SPELL_DBC_APPLY_AURA_NAME,
  SPELL_DBC_EFFECT,
  SPELL_SCHOOL_MASK,
  // add Dispel type options
  DISPEL_TYPE,
  DISPEL_TYPE_MASK,
} from '@keira/shared/acore-world-model';
import { SingleRowEditorComponent } from '@keira/shared/base-abstract-classes';
import { QueryOutputComponent, TopBarComponent } from '@keira/shared/base-editor-components';
import { BooleanOptionSelectorComponent, FlagsSelectorBtnComponent, OptionsSelectorBtnComponent } from '@keira/shared/selectors';
import { Option } from '@keira/shared/constants';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { UiSwitchModule } from 'ngx-ui-switch';
import { CreatureImmunitiesService } from './creature-immunities.service';
import { CreatureImmunitiesHandlerService } from '../creature-immunities-handler.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'keira-creature-immunities',
  templateUrl: './creature-immunities.component.html',
  imports: [
    TopBarComponent,
    TranslateModule,
    QueryOutputComponent,
    FormsModule,
    ReactiveFormsModule,
    TooltipModule,
    UiSwitchModule,
    FlagsSelectorBtnComponent,
    OptionsSelectorBtnComponent,
    BooleanOptionSelectorComponent,
  ],
})
export class CreatureImmunitiesComponent extends SingleRowEditorComponent<CreatureImmunities> {
  protected readonly SPELL_SCHOOL_MASK = SPELL_SCHOOL_MASK;
  protected readonly MECHANIC_IMMUNE_MASK = MECHANIC_IMMUNE_MASK;
  protected readonly DISPEL_TYPE = DISPEL_TYPE;
  protected readonly DISPEL_TYPE_MASK = DISPEL_TYPE_MASK;
  protected readonly SPELL_DBC_EFFECT = SPELL_DBC_EFFECT;
  protected readonly SPELL_DBC_APPLY_AURA_NAME = SPELL_DBC_APPLY_AURA_NAME;

  protected override readonly editorService = inject(CreatureImmunitiesService);
  protected readonly handlerService = inject(CreatureImmunitiesHandlerService);

  protected isCsvOptionEnabled(field: 'Effects' | 'Auras', optionValue: Option['value']): boolean {
    if (optionValue === null) {
      return false;
    }

    const control = this.editorService.form?.controls[field];
    if (!control) {
      return false;
    }

    return this.parseCsvValues(control.value).has(`${optionValue}`);
  }

  protected toggleCsvOption(field: 'Effects' | 'Auras', optionValue: Option['value']) {
    if (optionValue === null) {
      return;
    }

    const control = this.editorService.form?.controls[field];
    if (!control) {
      return;
    }

    const key = `${optionValue}`;
    const selectedValues = this.parseCsvValues(control.value);

    if (selectedValues.has(key)) {
      selectedValues.delete(key);
    } else {
      selectedValues.add(key);
    }

    const csvValue = this.toSortedCsv(selectedValues);
    control.markAsDirty();
    control.setValue(csvValue);
  }

  private parseCsvValues(value: unknown): Set<string> {
    const raw = `${value ?? ''}`;
    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
    return new Set(tokens);
  }

  private toSortedCsv(values: Set<string>): string {
    return [...values]
      .sort((a, b) => {
        const aNum = Number(a);
        const bNum = Number(b);
        const aIsNum = !Number.isNaN(aNum);
        const bIsNum = !Number.isNaN(bNum);

        if (aIsNum && bIsNum) {
          return aNum - bNum;
        }

        if (aIsNum) {
          return -1;
        }

        if (bIsNum) {
          return 1;
        }

        return a.localeCompare(b);
      })
      .join(',');
  }
}
