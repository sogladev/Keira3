import { ChangeDetectorRef, Injectable, inject } from '@angular/core';
import { SelectService } from '@keira/shared/base-abstract-classes';
import { MysqlQueryService } from '@keira/shared/db-layer';
import {
  ITEM_TEMPLATE_ID,
  ITEM_TEMPLATE_NAME,
  ITEM_TEMPLATE_SEARCH_FIELDS,
  ITEM_TEMPLATE_TABLE,
  ItemTemplate,
} from '@keira/shared/acore-world-model';
import { ItemHandlerService } from '../item-handler.service';

@Injectable({
  providedIn: 'root',
})
export class SelectItemService extends SelectService<ItemTemplate> {
  override readonly queryService = inject(MysqlQueryService);
  override readonly handlerService = inject(ItemHandlerService);
  protected override readonly entityTable = ITEM_TEMPLATE_TABLE;
  protected override readonly entityIdField = ITEM_TEMPLATE_ID;
  protected override entityNameField = ITEM_TEMPLATE_NAME;
  protected override readonly fieldList = ITEM_TEMPLATE_SEARCH_FIELDS;
  constructor() {
    super();
    this.init();
  }

  override onSearch(changeDetectorRef: ChangeDetectorRef): void {
    this.pageOffset = 0;

    this.subscriptions.push(
      this.queryService.query<ItemTemplate>(this.query).subscribe((data) => {
        this.rows = (data as ItemTemplate[]).map((row) => this.normalizeRow(row));
        changeDetectorRef.markForCheck();
      }),
    );
  }

  private normalizeRow(row: ItemTemplate): ItemTemplate {
    const normalized = { ...row } as any;

    if (normalized.entry === undefined || normalized.entry === null) {
      if ((row as any).ID !== undefined && (row as any).ID !== null) {
        normalized.entry = (row as any).ID;
      } else if ((row as any).id !== undefined && (row as any).id !== null) {
        normalized.entry = (row as any).id;
      }
    }

    return normalized as ItemTemplate;
  }
}
