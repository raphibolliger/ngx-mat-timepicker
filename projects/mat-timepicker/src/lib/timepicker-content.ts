import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewEncapsulation,
  ElementRef,
  OnInit,
} from '@angular/core';
import { mixinColor } from '@angular/material/core';
import { Subject } from 'rxjs';

import {
  ExtractTimeTypeFromSelection,
  MatTimeSelectionModel,
} from './time-selection-model';
import { MatTimepickerDefaultActions } from './timepicker-actions';
import { matTimepickerAnimations } from './timepicker-animations';
import { MatTimepickerBase, TimepickerMode } from './timepicker-base';

// Boilerplate for applying mixins to MatTimepickerContent.
const _MatTimepickerContentBase = mixinColor(
  class {
    constructor(public _elementRef: ElementRef) {}
  }
);

@Component({
  selector: 'mat-timepicker-content',
  templateUrl: './timepicker-content.html',
  styleUrls: ['./timepicker-content.scss'],
  exportAs: 'matTimepickerContent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'mat-timepicker-content',
    '[@transformPanel]': '_animationState',
    '(@transformPanel.done)': '_animationDone.next()',
  },
  animations: [
    matTimepickerAnimations.transformPanel,
    matTimepickerAnimations.fadeInTimepicker,
  ],
})
export class MatTimepickerContent<S, T = ExtractTimeTypeFromSelection<S>>
  extends _MatTimepickerContentBase
  implements OnInit
{
  /** Reference to the timepicker that created the overlay. */
  timepicker: MatTimepickerBase<any, S, T>;

  /** Display mode. */
  mode: TimepickerMode;

  /** Current state of the animation. */
  _animationState: 'enter-dropdown' | 'enter-dialog' | 'void';

  /** Whether the clock uses 12 hour format. */
  isMeridiem: boolean;

  /** Portal with projected action buttons. */
  _actionsPortal:
    | TemplatePortal
    | ComponentPortal<MatTimepickerDefaultActions>
    | null = null;

  /** Emits when an animation has finished. */
  readonly _animationDone = new Subject<void>();

  private _model: MatTimeSelectionModel<S, T>;

  constructor(
    elementRef: ElementRef,
    private _globalModel: MatTimeSelectionModel<S, T>,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    super(elementRef);
  }

  ngOnInit() {
    this._animationState =
      this.timepicker.openAs === 'dialog' ? 'enter-dialog' : 'enter-dropdown';
  }

  /** Changes animation state while closing timepicker content. */
  startExitAnimation() {
    this._animationState = 'void';
    this._changeDetectorRef.markForCheck();
  }

  onToggleMode(mode: TimepickerMode): void {
    this.mode = mode;
  }

  _getSelected() {
    return this._model?.selection as unknown as T | null;
  }

  /** Applies the current pending selection to the global model. */
  _applyPendingSelection() {
    if (this._model !== this._globalModel) {
      this._globalModel.updateSelection(this._model.selection, this);
    }
  }

  /**
   * Assigns a new portal containing the timepicker actions.
   * @param portal Portal with the actions to be assigned.
   * @param forceRerender Whether a re-render of the portal should be triggered. This isn't
   * necessary if the portal is assigned during initialization, but it may be required if it's
   * added at a later point.
   */
  _assignActions(portal: TemplatePortal<any> | null, forceRerender: boolean) {
    // If we have actions, clone the model so that we have the ability to cancel the selection,
    // otherwise update the global model directly. Note that we want to assign this as soon as
    // possible, but `_actionsPortal` isn't available in the constructor so we do it in `ngOnInit`.
    this._model = portal ? this._globalModel.clone() : this._globalModel;
    const defaultPortal = new ComponentPortal(MatTimepickerDefaultActions);
    this._actionsPortal = portal || defaultPortal;

    if (forceRerender) {
      this._changeDetectorRef.detectChanges();
    }
  }
}
