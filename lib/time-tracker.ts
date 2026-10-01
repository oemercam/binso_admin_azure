export type TimeTrackerState="running"|"paused";
export type TimeTracker={
  state:TimeTrackerState;
  startedAt:string;
  activeSince:string|null;
  accumulatedSeconds:number;
  projectId:string;
  projectLabel:string;
  activity:string;
  billable:boolean;
  updatedAt:string;
};
export function trackerElapsedSeconds(tracker:TimeTracker|null,now=Date.now()){
  if(!tracker)return 0;
  const active=tracker.state==="running"&&tracker.activeSince?Math.max(0,Math.floor((now-new Date(tracker.activeSince).getTime())/1000)):0;
  return Math.max(0,tracker.accumulatedSeconds+active);
}
export function formatTrackerDuration(seconds:number){
  const value=Math.max(0,Math.floor(seconds));
  const h=String(Math.floor(value/3600)).padStart(2,"0");
  const m=String(Math.floor((value%3600)/60)).padStart(2,"0");
  const s=String(value%60).padStart(2,"0");
  return `${h}:${m}:${s}`;
}
