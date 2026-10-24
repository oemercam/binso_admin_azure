"use client";
import {LocalizedText} from '@/lib/client/locale';
import {Button} from './ui';

/** Presentation only; the time page retains its tracker, validation and persistence. */
export function TimerControls({formatted,running,seconds,busy,onToggle,onStop}:{formatted:string;running:boolean;seconds:number;busy:boolean;onToggle:()=>void;onStop:()=>void}){
 return <><div className={`timer-display ${running?'is-running':seconds>0?'is-paused':'is-ready'}`}><div><small><LocalizedText>{running?'Läuft':seconds>0?'Pausiert':'Bereit'}</LocalizedText></small><strong>{formatted}</strong></div></div><div className="timer-actions"><Button requiresWrite variant={running?'secondary':'primary'} disabled={busy} onClick={onToggle} icon={running?'pause':'clock'}><LocalizedText>{running?'Pause':seconds>0?'Fortsetzen':'Starten'}</LocalizedText></Button>{(running||seconds>0)&&<Button requiresWrite variant="danger" icon="stop" onClick={onStop} disabled={busy}><LocalizedText>{'Stoppen'}</LocalizedText></Button>}</div></>;
}
