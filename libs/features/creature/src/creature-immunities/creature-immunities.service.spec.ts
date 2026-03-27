import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { MysqlQueryService } from '@keira/shared/db-layer';
import { instance, mock } from 'ts-mockito';

import { CreatureImmunitiesService } from './creature-immunities.service';
import { CreatureImmunitiesHandlerService } from '../creature-immunities-handler.service';
import { CreatureImmunities } from '@keira/shared/acore-world-model';

describe('CreatureImmunitiesService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ToastrModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        CreatureImmunitiesHandlerService,
        { provide: MysqlQueryService, useValue: instance(mock(MysqlQueryService)) },
        CreatureImmunitiesService,
      ],
    }),
  );

  it('should be created', () => {
    const service = TestBed.inject(CreatureImmunitiesService);
    expect(service).toBeTruthy();
  });

  it('generateComment builds comment and sanitizes values for full query', () => {
    const service = TestBed.inject(CreatureImmunitiesService) as any;
    const queryService = TestBed.inject(MysqlQueryService) as any;

    const spy = spyOn(queryService, 'getFullDeleteInsertQuery').and.returnValue('FULL_SQL');

    // ensure we have a loaded original id so sanitized row gets an ID
    (service as any)._originalValue = { ID: 555 };
    (service as any)._loadedEntityId = 555;

    // populate form controls with a variety of types to exercise sanitization
    service._loading = true;
    service._form.controls.ID.setValue(555);
    service._form.controls.SchoolMask.setValue(3);
    service._form.controls.MechanicsMask.setValue(5);
    service._form.controls.Effects.setValue('6,2');
    service._form.controls.Auras.setValue('7,6');
    service._form.controls.Comment.setValue({ a: 1 } as any);
    service._form.controls.ImmuneAoE.setValue(null);
    service._loading = false;

    service.generateComment();

    // Comment control should be updated and marked dirty
    expect(service._form.controls.Comment.value).toContain('school=0x3');

    expect(spy).toHaveBeenCalled();
    const args = spy.calls.mostRecent().args as unknown as any[];
    expect(args[0]).toBe((service as any)._entityTable);
    expect(args[2]).toBe((service as any)._entityIdField);

    const sanitizedRow = args[1][0] as any;
    expect(sanitizedRow.ID).toBe(555);
    expect(typeof sanitizedRow.Effects).toBe('string');
    expect(sanitizedRow.Effects).toBe('6,2');
    expect(typeof sanitizedRow.Auras).toBe('string');
    expect(sanitizedRow.Auras).toBe('7,6');
    expect(sanitizedRow.Comment).toContain('school=0x3');
    expect(sanitizedRow.ImmuneAoE).toBe(0);
    // null branch for defaults
    expect(sanitizedRow.ImmuneAoE).toBe(new CreatureImmunities().ImmuneAoE);
  });

  it('generateComment handles non-serializable objects gracefully', () => {
    const service = TestBed.inject(CreatureImmunitiesService) as any;
    const queryService = TestBed.inject(MysqlQueryService) as any;
    const spy = spyOn(queryService, 'getFullDeleteInsertQuery').and.returnValue('FULL_SQL');

    const objectValue = { foo: 'bar' };

    service._originalValue = { ID: 999 };
    service._loadedEntityId = 999;

    service._loading = true;
    service._form.controls.ID.setValue(999);
    service._form.controls.SchoolMask.setValue(0);
    service._form.controls.MechanicsMask.setValue(0);
    service._form.controls.DispelTypeMask.setValue(0);
    service._form.controls.Effects.setValue('');
    service._form.controls.Auras.setValue('');
    service._form.controls.Comment.setValue('');
    service._form.controls.ImmuneAoE.setValue(objectValue as any);
    service._loading = false;

    service.generateComment();

    expect(spy).toHaveBeenCalled();
    const callArgs: any = spy.calls.mostRecent().args;
    const sanitizedRow = callArgs[1][0] as any;
    expect(sanitizedRow.ImmuneAoE).toBe(JSON.stringify(objectValue));
  });

  it('buildComment skips empty effects/auras and normalizes names', () => {
    const service = TestBed.inject(CreatureImmunitiesService) as any;

    const emptyRow = {
      ID: 100,
      SchoolMask: 0,
      MechanicsMask: 0,
      Effects: '',
      Auras: '',
      ImmuneAoE: 0,
      ImmuneChain: 0,
      Comment: '',
    } as CreatureImmunities;

    const dashRow = {
      ...emptyRow,
      MechanicsMask: 1 << 5, // GRIP - Death Grip and similar effects (bit 5)
      DispelTypeMask: 1 << 8, // Special - npc only (bit 8)
      Effects: '69,6',
      Auras: '77',
    } as CreatureImmunities;

    const dashComment = service.buildComment(dashRow);
    expect(dashComment).toContain('mech=0x20(GRIP)');
    expect(dashComment).toContain('flags=Special');

    const blank = service.buildComment(emptyRow);
    expect(blank).not.toContain('school=');
    expect(blank).not.toContain('mech=');
    expect(blank).not.toContain('effects=');
    expect(blank).not.toContain('auras=');

    const nonEmptyRow = {
      ...emptyRow,
      SchoolMask: 8,
      MechanicsMask: 1,
      DispelTypeMask: 2,
      Effects: '69,6',
      Auras: '77',
    } as CreatureImmunities;

    const comment = service.buildComment(nonEmptyRow);
    expect(comment).toContain('school=0x8(');
    expect(comment).toContain('mech=0x1(');
    expect(comment).toContain('flags=Magic');
    expect(comment).toContain('effects=DISTRACT|APPLY_AURA');
    expect(comment).toContain('auras=SPELL_AURA_MECHANIC_IMMUNITY');
  });

  it('generateComment handles all sanitize branches and loader fallback', () => {
    const service = TestBed.inject(CreatureImmunitiesService) as any;
    const queryService = TestBed.inject(MysqlQueryService) as any;
    const spy = spyOn(queryService, 'getFullDeleteInsertQuery').and.returnValue('FULL_SQL');

    const invalidObject = {
      toJSON: () => {
        throw new Error('boom');
      },
      toString: () => 'UNSERIALIZABLE',
    };

    service._originalValue = undefined; // ensures fallback to _loadedEntityId via ??
    service._loadedEntityId = 888;

    service._form.controls.ID.setValue('');
    service._form.controls.SchoolMask.setValue(0);
    service._form.controls.MechanicsMask.setValue([1, 2]); // array branch
    service._form.controls.DispelTypeMask.setValue(new Set([3, 4])); // Set branch
    service._form.controls.Effects.setValue(null); // null branch
    service._form.controls.Auras.setValue(undefined); // null branch
    service._form.controls.ImmuneAoE.setValue({ cool: true }); // object -> JSON.stringify success
    service._form.controls.ImmuneChain.setValue(invalidObject); // object -> JSON.stringify throws => toString fallback
    service._form.controls.Comment.setValue('');

    service.generateComment();

    expect(spy).toHaveBeenCalled();
    const callArgs = spy.calls.mostRecent().args as unknown as any[];
    const sanitizedRow = callArgs[1][0] as any;

    expect(sanitizedRow.ID).toBe(888); // id fallback branch via loadedEntityId
    expect(sanitizedRow.Effects).toBe(new CreatureImmunities().Effects); // null -> default
    expect(sanitizedRow.Auras).toBe(new CreatureImmunities().Auras); // undefined -> default

    expect(sanitizedRow.MechanicsMask).toBe('1,2');
    expect(sanitizedRow.DispelTypeMask).toBe('3,4');
    expect(sanitizedRow.ImmuneAoE).toBe(JSON.stringify({ cool: true }));
    expect(sanitizedRow.ImmuneChain).toBe('UNSERIALIZABLE');
  });

  it('generateComment fallback to loaded entity ID when current ID is empty', () => {
    const service = TestBed.inject(CreatureImmunitiesService) as any;
    const queryService = TestBed.inject(MysqlQueryService) as any;
    const spy = spyOn(queryService, 'getFullDeleteInsertQuery').and.returnValue('FULL_SQL');

    service._originalValue = undefined;
    service._loadedEntityId = 777;
    service._form.controls.ID.setValue('');
    service._form.controls.SchoolMask.setValue(0);
    service._form.controls.MechanicsMask.setValue(0);
    service._form.controls.DispelTypeMask.setValue(0);
    service._form.controls.Effects.setValue('');
    service._form.controls.Auras.setValue('');
    service._form.controls.ImmuneAoE.setValue(0);
    service._form.controls.ImmuneChain.setValue(0);

    service.generateComment();

    expect(spy).toHaveBeenCalled();
    const callArgs = spy.calls.mostRecent().args as unknown as any[];
    const sanitizedRow = callArgs[1][0] as any;
    expect(sanitizedRow.ID).toBe(777);
  });
});
