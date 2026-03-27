import { ChangeDetectorRef, Injectable, inject } from '@angular/core';
import { SelectService } from '@keira/shared/base-abstract-classes';
import { MysqlQueryService } from '@keira/shared/db-layer';
import { CreatureImmunitiesHandlerService } from '../creature-immunities-handler.service';
import {
  CREATURE_IMMUNITIES_ID,
  CREATURE_IMMUNITIES_SEARCH_FIELDS,
  CREATURE_IMMUNITIES_TABLE,
  CreatureImmunities,
} from '@keira/shared/acore-world-model';

@Injectable({
  providedIn: 'root',
})
export class SelectCreatureImmunitiesService extends SelectService<CreatureImmunities> {
  override readonly queryService = inject(MysqlQueryService);
  override readonly handlerService = inject(CreatureImmunitiesHandlerService);
  protected override readonly entityTable = CREATURE_IMMUNITIES_TABLE;
  protected override readonly entityIdField = CREATURE_IMMUNITIES_ID;
  protected override readonly fieldList = CREATURE_IMMUNITIES_SEARCH_FIELDS;
  protected override readonly selectFields = [`${CREATURE_IMMUNITIES_ID}`, 'SchoolMask', 'MechanicsMask', 'DispelTypeMask', 'Comment'];
  protected override entityNameField = CREATURE_IMMUNITIES_ID;

  constructor() {
    super();
    this.init();
  }

  override onSearch(changeDetectorRef: ChangeDetectorRef): void {
    this.pageOffset = 0;

    this.subscriptions.push(
      this.queryService.query<CreatureImmunities>(this.getOrderedQuery()).subscribe((data) => {
        this.rows = data as CreatureImmunities[];
        changeDetectorRef.markForCheck();
      }),
    );
  }

  private getOrderedQuery(): string {
    const trimmedQuery = this.query.trim();

    if (/\sORDER\s+BY\s/i.test(trimmedQuery)) {
      return trimmedQuery;
    }

    const orderBy = ` ORDER BY \`${CREATURE_IMMUNITIES_ID}\` DESC`;
    const limitRegex = /\sLIMIT\s+\d+\s*$/i;

    if (limitRegex.test(trimmedQuery)) {
      return trimmedQuery.replace(limitRegex, (match) => `${orderBy}${match}`);
    }

    return `${trimmedQuery}${orderBy}`;
  }
}
