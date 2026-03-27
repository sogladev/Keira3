import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { instance, mock } from 'ts-mockito';

import { MysqlQueryService, SqliteService } from '@keira/shared/db-layer';
import { SelectPageObject, TranslateTestingModule } from '@keira/shared/test-utils';
import { CreatureImmunities } from '@keira/shared/acore-world-model';
import { CreatureImmunitiesHandlerService } from '../creature-immunities-handler.service';
import { SelectCreatureImmunitiesComponent } from './select-creature-immunities.component';
import { SelectCreatureImmunitiesService } from './select-creature-immunities.service';

class SelectCreatureImmunitiesComponentPage extends SelectPageObject<SelectCreatureImmunitiesComponent> {
  override ID_FIELD = 'ID';
}

describe('SelectCreatureImmunities integration tests', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastrModule.forRoot(), ModalModule.forRoot(), SelectCreatureImmunitiesComponent, TranslateTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        CreatureImmunitiesHandlerService,
        { provide: SqliteService, useValue: instance(mock(SqliteService)) },
      ],
    }).compileComponents();
  });

  it('searching + selecting a row with uppercase ID should set editing state (not undefined)', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    const queryService = TestBed.inject(MysqlQueryService);
    const _querySpy = spyOn(queryService, 'query').and.returnValue(
      of([
        {
          ID: -100,
          SchoolMask: 8,
          DispelTypeMask: 2,
          MechanicsMask: 3,
          Effects: '',
          Auras: '',
          ImmuneAoE: 0,
          ImmuneChain: 0,
          Comment: 'ordered comment',
        } as unknown as CreatureImmunities,
      ]),
    );

    const fixture = TestBed.createComponent(SelectCreatureImmunitiesComponent);
    const service = TestBed.inject(SelectCreatureImmunitiesService);
    const page = new SelectCreatureImmunitiesComponentPage(fixture);
    fixture.autoDetectChanges(true);
    fixture.detectChanges();

    await fixture.whenStable();

    page.clickElement(page.searchBtn);

    expect(_querySpy).toHaveBeenCalled();
    expect(_querySpy.calls.mostRecent().args[0]).toContain('ORDER BY `ID` DESC');

    expect(service.rows).toBeTruthy();
    expect(service.rows?.[0].ID).toBe(-100);
    expect(service.rows?.[0].Comment).toBe('ordered comment');

    const row0 = page.getDatatableRowExternal(0);
    expect(row0.innerText).toContain('-100');
    expect(row0.innerText).toContain('ordered comment');

    page.clickElement(page.getDatatableCellExternal(0, 0));

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['creature-immunities/creature-immunities']);

    page.expectTopBarEditing(-100, '-100');
  });
});
