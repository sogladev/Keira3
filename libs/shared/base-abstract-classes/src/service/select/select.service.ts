import { StringKeys, TableRow } from '@keira/shared/constants';
import { MysqlQueryService } from '@keira/shared/db-layer';
import { HandlerService } from '../handlers/handler.service';
import { SearchService } from './search.service';

export abstract class SelectService<T extends TableRow> extends SearchService<T> {
  abstract override readonly queryService: MysqlQueryService;
  abstract readonly handlerService: HandlerService<T>;
  protected abstract override readonly entityTable: string;
  protected abstract readonly entityIdField: string;
  protected entityNameField: string | undefined | null = undefined;
  protected abstract override readonly fieldList: StringKeys<T>[];
  protected override readonly selectFields: string[] | undefined = undefined;
  protected override readonly groupFields: string[] | undefined = undefined;

  protected resolveSelectField(row: { [key: string]: any }, field: string | undefined | null): string | number | undefined {
    if (!field || !row) {
      return undefined;
    }

    const normalizedId = row[field];
    if (normalizedId !== undefined && normalizedId !== null) {
      return normalizedId;
    }

    const upper = field.toUpperCase();
    const lower = field.toLowerCase();

    if (row[upper] !== undefined && row[upper] !== null) {
      return row[upper];
    }

    if (row[lower] !== undefined && row[lower] !== null) {
      return row[lower];
    }

    return undefined;
  }

  onSelect({ selected }: { selected: { [_key: string]: string | number }[] }) {
    const row = selected[0] || {};
    const id = this.resolveSelectField(row, this.entityIdField);
    const name = this.resolveSelectField(row, this.entityNameField) ?? this.entityTable;

    this.handlerService.select(false, id ?? '', `${name}`);

    if ('Quality' in row) {
      this.handlerService.itemQualityScssClass = row['Quality'] as number;
    }
  }
}
