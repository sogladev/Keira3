import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CREATURE_TEMPLATE_ID, CREATURE_TEMPLATE_TABLE } from '@keira/shared/acore-world-model';
import { CopyOutputComponent } from '@keira/shared/base-editor-components';
import { CreatureHandlerService } from '../creature-handler.service';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'keira-creature-copy',
  templateUrl: './creature-copy.component.html',
  standalone: true,
  imports: [CopyOutputComponent],
})
export class CreatureCopyComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly handlerService = inject(CreatureHandlerService);

  protected readonly tableName = CREATURE_TEMPLATE_TABLE;
  protected readonly idField = CREATURE_TEMPLATE_ID;
  protected sourceId!: string | number;
  protected newId!: string | number;

  ngOnInit(): void {
    if (!this.handlerService.sourceId || !this.handlerService.selected) {
      // If no source ID or new ID, redirect back to select
      this.router.navigate(['/creature/select']);
      return;
    }

    this.sourceId = this.handlerService.sourceId;
    this.newId = this.handlerService.selected;
  }
}
