import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { CreatureImmunities } from '@keira/shared/acore-world-model';
import { MysqlQueryService, SqliteService } from '@keira/shared/db-layer';
import { EditorPageObject, TranslateTestingModule } from '@keira/shared/test-utils';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { instance, mock } from 'ts-mockito';
import { CreatureImmunitiesHandlerService } from '../creature-immunities-handler.service';
import { CreatureImmunitiesComponent } from './creature-immunities.component';

class CreatureImmunitiesPage extends EditorPageObject<CreatureImmunitiesComponent> {}

describe('CreatureImmunities integration tests', () => {
  const id = 1234;
  const expectedFullCreateQuery =
    'DELETE FROM `creature_immunities` WHERE (`ID` = 1234);\n' +
    'INSERT INTO `creature_immunities` (`ID`, `SchoolMask`, `DispelTypeMask`, `MechanicsMask`, `Effects`, `Auras`, `ImmuneAoE`, `ImmuneChain`, `Comment`) VALUES\n' +
    "(1234, 0, 0, 0, '', '', 0, 0, '');";

  const originalEntity = new CreatureImmunities();
  originalEntity.ID = id;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastrModule.forRoot(), ModalModule.forRoot(), CreatureImmunitiesComponent, RouterTestingModule, TranslateTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        CreatureImmunitiesHandlerService,
        { provide: SqliteService, useValue: instance(mock(SqliteService)) },
      ],
    }).compileComponents();
  });

  function setup(creatingNew: boolean) {
    const handlerService = TestBed.inject(CreatureImmunitiesHandlerService);
    handlerService['_selected'] = `${id}`;
    handlerService.isNew = creatingNew;

    const queryService = TestBed.inject(MysqlQueryService);
    const querySpy = spyOn(queryService, 'query').and.returnValue(of([]));
    spyOn(queryService, 'queryValue').and.returnValue(of());
    spyOn(queryService, 'selectAll').and.returnValue(of(creatingNew ? [] : [originalEntity]));

    const fixture = TestBed.createComponent(CreatureImmunitiesComponent);
    const page = new CreatureImmunitiesPage(fixture);
    fixture.autoDetectChanges(true);
    fixture.detectChanges();
    return { fixture, queryService, querySpy, handlerService, page };
  }

  describe('Creating new', () => {
    it('should correctly initialise', () => {
      const { page } = setup(true);
      page.expectQuerySwitchToBeHidden();
      page.expectFullQueryToBeShown();
      page.expectFullQueryToContain(expectedFullCreateQuery);
    });

    it('should update the unsaved status', () => {
      const { handlerService, page } = setup(true);
      expect(handlerService.isCreatureImmunitiesUnsaved()).toBe(false);
      page.setInputValueById('SchoolMask', 8);
      expect(handlerService.isCreatureImmunitiesUnsaved()).toBe(true);
      page.setInputValueById('SchoolMask', 0);
      expect(handlerService.isCreatureImmunitiesUnsaved()).toBe(false);
    });

    it('changing a field and executing query should work', () => {
      const { querySpy, page } = setup(true);
      const expectedQuery =
        'DELETE FROM `creature_immunities` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `creature_immunities` (`ID`, `SchoolMask`, `DispelTypeMask`, `MechanicsMask`, `Effects`, `Auras`, `ImmuneAoE`, `ImmuneChain`, `Comment`) VALUES\n' +
        "(1234, 1, 0, 0, '', '', 0, 0, '');";

      querySpy.calls.reset();
      page.setInputValueById('SchoolMask', '1');
      page.expectFullQueryToContain(expectedQuery);

      page.clickExecuteQuery();
      expect(querySpy).toHaveBeenCalledTimes(1);
      expect(querySpy.calls.mostRecent().args[0]).toContain(expectedQuery);
    });
  });

  describe('Editing existing', () => {
    it('should correctly initialise', () => {
      const { page } = setup(false);
      page.expectDiffQueryToBeShown();
      page.expectDiffQueryToBeEmpty();
      page.expectFullQueryToContain(expectedFullCreateQuery);
    });

    it('changing values and executing query should work', () => {
      const { querySpy, page } = setup(false);
      const expectedQuery = 'UPDATE `creature_immunities` SET `SchoolMask` = 2 WHERE (`ID` = 1234);';

      querySpy.calls.reset();
      page.setInputValueById('SchoolMask', '2');
      page.expectDiffQueryToContain(expectedQuery);

      page.clickExecuteQuery();
      expect(querySpy).toHaveBeenCalledTimes(1);
      expect(querySpy.calls.mostRecent().args[0]).toContain(expectedQuery);
    });

    it('multiple field changes reflect in query', () => {
      const { page } = setup(false);
      page.setInputValueById('SchoolMask', '3');
      page.setInputValueById('MechanicsMask', '4');
      page.expectDiffQueryToContain('UPDATE `creature_immunities` SET `SchoolMask` = 3, `MechanicsMask` = 4 WHERE (`ID` = 1234);');
      page.expectFullQueryToContain(
        'INSERT INTO `creature_immunities` (`ID`, `SchoolMask`, `DispelTypeMask`, `MechanicsMask`, `Effects`, `Auras`, `ImmuneAoE`, `ImmuneChain`, `Comment`) VALUES',
      );
    });

    it('effect and aura toggles should store comma separated values', () => {
      const { fixture, page } = setup(false);
      const component = fixture.componentInstance as any;

      component.toggleCsvOption('Effects', 37);
      component.toggleCsvOption('Effects', 39);
      component.toggleCsvOption('Auras', 39);
      component.toggleCsvOption('Auras', 41);
      fixture.detectChanges();

      page.expectDiffQueryToContain("UPDATE `creature_immunities` SET `Effects` = '37,39', `Auras` = '39,41' WHERE (`ID` = 1234);");
      page.expectFullQueryToContain("(1234, 0, 0, 0, '37,39', '39,41', 0, 0, '');");
    });

    it('renders ID as readonly and disabled input', () => {
      const { page } = setup(false);
      const idInput = page.getInputById('ID');

      expect(idInput).toBeTruthy();
      expect(idInput.readOnly).toBe(true);
      expect(idInput.disabled).toBe(true);
    });

    it('toSortedCsv numeric precedence over strings is covered', () => {
      const { fixture } = setup(false);
      const component = fixture.componentInstance as any;

      const testSet = new Set(['10', '2', 'abc', '42', 'def']);
      const sorted = component.toSortedCsv(testSet);

      expect(sorted).toBe('2,10,42,abc,def');
    });

    it('buildComment includes flags and filters zero values', () => {
      const { fixture: _fixture } = setup(false);
      const component = _fixture.componentInstance as any;
      const editorService = component.editorService as any;

      editorService.form.controls.SchoolMask.setValue(8);
      editorService.form.controls.MechanicsMask.setValue(1);
      editorService.form.controls.DispelTypeMask.setValue(2); // Magic
      editorService.form.controls.Effects.setValue('69,6');
      editorService.form.controls.Auras.setValue('77');

      editorService.generateComment();
      _fixture.detectChanges();

      const comment = editorService.form.controls.Comment.value;
      expect(comment).toContain('school=0x8(');
      expect(comment).toContain('mech=0x1(');
      expect(comment).toContain('flags=Magic');
      expect(comment).toContain('effects=APPLY_AURA|DISTRACT');
      expect(comment).toContain('auras=SPELL_AURA_MECHANIC_IMMUNITY');

      editorService.form.controls.SchoolMask.setValue(0);
      editorService.form.controls.MechanicsMask.setValue(0);
      editorService.form.controls.DispelTypeMask.setValue(0);
      editorService.generateComment();
      _fixture.detectChanges();
      const commentZero = editorService.form.controls.Comment.value;
      expect(commentZero).not.toContain('school=');
      expect(commentZero).not.toContain('mech=');
      expect(commentZero).not.toContain('flags=');
    });

    it('buildComment includes flags and filters zero values', () => {
      const { fixture: _fixture } = setup(false);
      const component = _fixture.componentInstance as any;
      const editorService = component.editorService as any;

      editorService.form.controls.SchoolMask.setValue(8);
      editorService.form.controls.MechanicsMask.setValue(1);
      editorService.form.controls.DispelTypeMask.setValue(2); // Magic
      editorService.form.controls.Effects.setValue('69,6');
      editorService.form.controls.Auras.setValue('77');

      editorService.generateComment();
      _fixture.detectChanges();

      const comment = editorService.form.controls.Comment.value;
      expect(comment).toContain('school=0x8(');
      expect(comment).toContain('mech=0x1(');
      expect(comment).toContain('flags=Magic');
      expect(comment).toContain('effects=DISTRACT|APPLY_AURA');
      expect(comment).toContain('auras=SPELL_AURA_MECHANIC_IMMUNITY');

      editorService.form.controls.SchoolMask.setValue(0);
      editorService.form.controls.MechanicsMask.setValue(0);
      editorService.form.controls.DispelTypeMask.setValue(0);
      editorService.generateComment();
      _fixture.detectChanges();
      const commentZero = editorService.form.controls.Comment.value;
      expect(commentZero).not.toContain('school=');
      expect(commentZero).not.toContain('mech=');
      expect(commentZero).not.toContain('flags=');
    });

    it('csv helpers support null / absent controls safely', () => {
      const { fixture } = setup(false);
      const component = fixture.componentInstance as any;
      const editorService = component.editorService as any;

      // default empty
      expect(component.isCsvOptionEnabled('Effects', 1)).toBe(false);

      editorService.form.controls.Effects.setValue('1,3');
      expect(component.isCsvOptionEnabled('Effects', 1)).toBe(true);
      expect(component.isCsvOptionEnabled('Effects', 2)).toBe(false);
      expect(component.isCsvOptionEnabled('Effects', null)).toBe(false);

      component.toggleCsvOption('Effects', 1); // removes 1
      expect(editorService.form.controls.Effects.value).toBe('3');
      component.toggleCsvOption('Effects', 2); // adds 2
      expect(editorService.form.controls.Effects.value).toBe('2,3');

      // null option should do nothing and not throw
      component.toggleCsvOption('Effects', null);
      expect(editorService.form.controls.Effects.value).toBe('2,3');

      // missing control should return false and not throw
      delete editorService.form.controls.Effects;
      expect(component.isCsvOptionEnabled('Effects', 2)).toBe(false);
      component.toggleCsvOption('Effects', 2);
      expect(component.isCsvOptionEnabled('Effects', 2)).toBe(false);
    });
  });
});
