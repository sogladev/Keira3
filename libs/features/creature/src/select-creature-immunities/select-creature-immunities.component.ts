import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SelectComponent } from '@keira/shared/base-abstract-classes';
import { CREATURE_IMMUNITIES_ID, CREATURE_IMMUNITIES_TABLE, CreatureImmunities } from '@keira/shared/acore-world-model';
import { NgxDatatableModule } from '@siemens/ngx-datatable';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreatureImmunitiesHandlerService } from '../creature-immunities-handler.service';
import { SelectCreatureImmunitiesService } from './select-creature-immunities.service';
import { WIKI_BASE_URL } from '@keira/shared/constants';
import { CreateComponent, HighlightjsWrapperComponent, TopBarComponent } from '@keira/shared/base-editor-components';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select-creature-immunities.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    NgxDatatableModule,
    CreateComponent,
    HighlightjsWrapperComponent,
    TopBarComponent,
  ],
})
export class SelectCreatureImmunitiesComponent extends SelectComponent<CreatureImmunities> {
  protected override readonly entityTable = CREATURE_IMMUNITIES_TABLE;
  protected override readonly entityIdField = CREATURE_IMMUNITIES_ID;
  protected readonly customStartingId = -1_000;
  protected readonly selectService = inject(SelectCreatureImmunitiesService);
  readonly handlerService = inject(CreatureImmunitiesHandlerService);
  protected readonly WIKI_BASE_URL = WIKI_BASE_URL;
}
