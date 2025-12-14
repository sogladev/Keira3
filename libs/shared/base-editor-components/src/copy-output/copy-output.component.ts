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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'keira-copy-output',
  templateUrl: './copy-output.component.html',
  styleUrls: ['./copy-output.component.scss'],
  imports: [CommonModule, TranslateModule, TooltipModule, QueryErrorComponent],
})
export class CopyOutputComponent<T extends TableRow> extends SubscriptionHandler implements OnInit {
  protected readonly clipboardService = inject(ClipboardService);
  protected readonly queryService = inject(MysqlQueryService);

  @Input({ required: true }) handlerService!: HandlerService<T>;
  @Input({ required: true }) tableName!: string;
  @Input({ required: true }) idField!: string;
  @Input({ required: true }) sourceId!: string | number;
  @Input({ required: true }) newId!: string | number;
  @Input({ required: true }) columns!: string[];

  protected copyQuery = signal<string>('');
  protected error = signal<QueryError | undefined>(undefined);
  protected executing = signal<boolean>(false);
  protected executed = signal<boolean>(false);

  ngOnInit(): void {
    this.generateCopyQuery();
  }

  protected generateCopyQuery(): void {
    const query = this.queryService.getCopyQuery(this.tableName, this.sourceId, this.newId, this.idField, this.columns);
    this.copyQuery.set(query);
  }

  protected copy(): void {
    this.clipboardService.copyFromContent(this.copyQuery());
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
