import { ChangeDetectionStrategy, Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ClipboardService } from 'ngx-clipboard';
import { HandlerService } from '@keira/shared/base-abstract-classes';
import { TableRow } from '@keira/shared/constants';
import { MysqlQueryService } from '@keira/shared/db-layer';
import { SubscriptionHandler } from '@keira/shared/utils';
import { QueryError } from 'mysql2';
import { QueryErrorComponent } from '../query-output/query-error/query-error.component';
import { HighlightjsWrapperComponent } from '../highlightjs-wrapper/highlightjs-wrapper.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'keira-copy-output',
  templateUrl: './copy-output.component.html',
  styleUrls: ['./copy-output.component.scss'],
  imports: [CommonModule, TranslateModule, TooltipModule, QueryErrorComponent, HighlightjsWrapperComponent],
})
export class CopyOutputComponent<T extends TableRow> extends SubscriptionHandler implements OnInit {
  protected readonly clipboardService = inject(ClipboardService);
  protected readonly queryService = inject(MysqlQueryService);

  @Input({ required: true }) handlerService!: HandlerService<T>;
  @Input({ required: true }) tableName!: string;
  @Input({ required: true }) idField!: string;
  @Input({ required: true }) sourceId!: string | number;
  @Input({ required: true }) newId!: string | number;
  @Input() relatedTables?: Array<{
    tableName: string;
    idField: string;
  }>;

  protected copyQuery = signal<string>('');
  protected relatedTableStates = signal<Array<{ tableName: string; idField: string; count: number; included: boolean }>>([]);
  protected error = signal<QueryError | undefined>(undefined);
  protected executing = signal<boolean>(false);
  protected executed = signal<boolean>(false);

  ngOnInit(): void {
    this.populateRelatedTables();
  }

  protected populateRelatedTables(): void {
    // If there are no related tables, we can just generate the query for the main table
    if (!this.relatedTables || this.relatedTables.length === 0) {
      this.generateCopyQuery();
      return;
    }

    const states: Array<{ tableName: string; idField: string; count: number; included: boolean }> = [];
    let remaining = this.relatedTables.length;

    for (const table of this.relatedTables) {
      this.subscriptions.push(
        this.queryService.getRowsCount(table.tableName, table.idField, this.sourceId).subscribe((count) => {
          const num = Number(count || 0);
          if (num > 0) {
            states.push({ tableName: table.tableName, idField: table.idField, count: num, included: true });
          }

          remaining--;
          if (remaining === 0) {
            this.relatedTableStates.set(states);
            this.generateCopyQuery();
          }
        }),
      );
    }
  }

  protected generateCopyQuery(): void {
    const setVars = this.queryService.getCopyVarsSet(this.sourceId, this.newId);
    let query = setVars + this.queryService.getCopyQuery(this.tableName, this.sourceId, this.newId, this.idField, true);

    const selectedRelatedTables = this.relatedTableStates().filter((t) => t.included);
    if (selectedRelatedTables.length > 0) {
      for (const table of selectedRelatedTables) {
        query += '\n' + this.queryService.getCopyQuery(table.tableName, this.sourceId, this.newId, table.idField, true);
      }
    }

    this.copyQuery.set(query);
  }

  protected copy(): void {
    this.clipboardService.copyFromContent(this.copyQuery());
  }

  protected toggleRelatedTable(tableName: string): void {
    const states = this.relatedTableStates().map((s) => ({ ...s }));
    const idx = states.findIndex((s) => s.tableName === tableName);
    if (idx !== -1) {
      states[idx].included = !states[idx].included;
      this.relatedTableStates.set(states);
      this.generateCopyQuery();
    }
  }

  protected selectAllRelated(checked: boolean): void {
    const states = this.relatedTableStates().map((s) => ({ ...s, included: checked }));
    this.relatedTableStates.set(states);
    this.generateCopyQuery();
  }

  protected execute(): void {
    this.executing.set(true);
    this.error.set(undefined);

    this.subscriptions.push(
      this.queryService.query(this.copyQuery()).subscribe({
        next: () => {
          this.executing.set(false);
          this.executed.set(true);
        },
        error: (error: QueryError) => {
          this.executing.set(false);
          this.error.set(error);
        },
      }),
    );
  }

  protected continue(): void {
    // Navigate to the editor for the newly created entry
    this.handlerService.select(false, this.newId);
  }
}
