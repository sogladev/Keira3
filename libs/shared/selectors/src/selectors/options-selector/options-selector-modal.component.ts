import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UiSwitchModule } from 'ngx-ui-switch';

import { BaseSelectorModalComponent } from '../base-selector/base-selector-modal.component';
import { OptionsModalConfig } from './options-selector.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'keira-options-selector-modal',
  templateUrl: './options-selector-modal.component.html',
  styleUrls: ['./options-selector-modal.component.scss'],
  imports: [UiSwitchModule, TranslateModule],
})
export class OptionsSelectorModalComponent extends BaseSelectorModalComponent<OptionsModalConfig> implements OnInit {
  selectedMap: Record<string, boolean> = {};

  ngOnInit() {
    const opts = this.config?.options ?? [];
    const raw = `${this.value ?? ''}`;
    const tokens = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    for (const opt of opts) {
      const key = `${opt.value}`;
      this.selectedMap[key] = tokens.includes(key);
    }
  }

  toggleOption(optValue: string | number | null) {
    const key = `${optValue ?? ''}`;
    this.selectedMap[key] = !this.selectedMap[key];
    // compute CSV string
    const selected = Object.keys(this.selectedMap).filter((k) => this.selectedMap[k]);
    // sort numerically when possible, else lexicographically
    selected.sort((a, b) => {
      const an = Number(a);
      const bn = Number(b);
      const aIsNum = !Number.isNaN(an);
      const bIsNum = !Number.isNaN(bn);
      if (aIsNum && bIsNum) return an - bn;
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.localeCompare(b);
    });
    this.value = selected.join(',');
  }
}
