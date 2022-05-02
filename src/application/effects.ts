import { EMPTY, interval, merge, MonoTypeOperatorFunction, Observable, of, Subject } from 'rxjs';
import { filter, mapTo, mergeMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { Action, actionMessage, actionNext, actionPrev, actionRestart, actionTimer, actionTimerEnd, actionUpdate } from './actions';
import { DELAY, INTERVAL, Slide, State } from './types';

function ofType<T extends Action>(type: Action['type']): MonoTypeOperatorFunction<T> {
    return filter(a => type === a.type);
}

export function createEffects(
    actions$: Observable<Action>, 
    state$: Observable<State>, 
): Observable<Action> {
    const timerEnd$ = new Subject<typeof actionTimerEnd>();
    const timerEffect$ = interval(INTERVAL).pipe(
        takeUntil(timerEnd$),
        mapTo(actionTimer())
    );

    const changeSlideEffect$ = timerEffect$.pipe(
        withLatestFrom(state$),
        mergeMap(([a, s]) => {
            if (s.index + 1 >= s.stories.length && s.progress >= DELAY) {
                timerEnd$.next(() => actionTimerEnd());
                timerEnd$.complete()
                return of(actionTimerEnd())
            }
            return s.progress >= DELAY ? of(actionNext()) : EMPTY
        }),
    );
    
    const messageEffect$ = actions$.pipe(
        ofType<ReturnType<typeof actionMessage>>('message'),
        mergeMap(a => {
            switch (a.action) {
                case 'go-prev':
                    return of(actionPrev());
                case 'go-next':
                    return of(actionNext());
                case 'restart':
                    return of(actionRestart());
                case 'update':
                    const data: Partial<Slide> = JSON.parse(a.params);
                    return of(actionUpdate(data));
                default:
                    return EMPTY;
            }
        })
    )
    
    return merge(timerEffect$, changeSlideEffect$, messageEffect$);
}