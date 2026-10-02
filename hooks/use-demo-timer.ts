"use client";

import { useEffect, useState } from "react";

type TimerState = {
  running: boolean;
  baseSeconds: number;
  startedAt: number | null;
};

const defaults: TimerState = {
  running: true,
  baseSeconds: 8067,
  startedAt: null,
};

const keys = {
  running: "binso.timer.running",
  base: "binso.timer.baseSeconds",
  started: "binso.timer.startedAt",
} as const;

function readTimerState(): TimerState {
  if(typeof window==="undefined") return defaults;
  const running=window.localStorage.getItem(keys.running)!=="false";
  const base=Number(window.localStorage.getItem(keys.base)??String(defaults.baseSeconds));
  let started=Number(window.localStorage.getItem(keys.started)??"0")||null;

  if(running&&!started){
    started=Date.now();
    window.localStorage.setItem(keys.started,String(started));
  }

  return {
    running,
    baseSeconds:Number.isFinite(base)?base:defaults.baseSeconds,
    startedAt:running?started:null,
  };
}

function writeTimerState(state:TimerState) {
  window.localStorage.setItem(keys.running,String(state.running));
  window.localStorage.setItem(keys.base,String(state.baseSeconds));
  if(state.startedAt) window.localStorage.setItem(keys.started,String(state.startedAt));
  else window.localStorage.removeItem(keys.started);
  window.dispatchEvent(new CustomEvent("binso-timer-change"));
}

export function useDemoTimer() {
  const [state,setState]=useState<TimerState>(defaults);
  const [now,setNow]=useState(0);

  useEffect(()=>{
    const sync=()=>{
      const next=readTimerState();
      queueMicrotask(()=>{
        setState(next);
        setNow(Date.now());
      });
    };
    sync();
    window.addEventListener("binso-timer-change",sync);
    window.addEventListener("storage",sync);
    return()=>{
      window.removeEventListener("binso-timer-change",sync);
      window.removeEventListener("storage",sync);
    };
  },[]);

  useEffect(()=>{
    if(!state.running) return;
    const id=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>window.clearInterval(id);
  },[state.running]);

  const seconds=state.baseSeconds+(state.running&&state.startedAt?Math.max(0,Math.floor((now-state.startedAt)/1000)):0);

  const apply=(next:TimerState)=>{
    setState(next);
    setNow(Date.now());
    writeTimerState(next);
  };

  const pause=()=>{
    apply({running:false,baseSeconds:seconds,startedAt:null});
  };

  const resume=()=>{
    apply({running:true,baseSeconds:state.baseSeconds,startedAt:Date.now()});
  };

  const stop=()=>{
    apply({running:false,baseSeconds:seconds,startedAt:null});
  };

  const restart=()=>{
    apply({running:true,baseSeconds:0,startedAt:Date.now()});
  };

  const formatted=[Math.floor(seconds/3600),Math.floor((seconds%3600)/60),seconds%60].map(value=>String(value).padStart(2,"0")).join(":");

  return {
    running:state.running,
    seconds,
    formatted,
    pause,
    resume,
    stop,
    restart,
  };
}
