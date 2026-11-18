// Keep native range interaction light; commit expensive analysis/storage after release.
export function bindInputUpdates(root,commit,{delay=120,changeRequestsCommit=false}={}){
 const controller=new AbortController(),options={signal:controller.signal};
 const view=root.ownerDocument.defaultView;
 let timer=0,pending=false,dragging=null,destroyed=false;
 const clear=()=>{view.clearTimeout(timer);timer=0;};
 function flush(){
  clear();if(!pending||destroyed)return;
  pending=false;if(root.isConnected)commit();
 }
 function schedule(){
  if(destroyed)return;pending=true;clear();
  if(dragging===null)timer=view.setTimeout(flush,delay);
 }
 root.addEventListener('pointerdown',event=>{
  if(!event.target.matches('input[type="range"]'))return;
  dragging=event.pointerId;clear();
 },options);
 const release=event=>{if(dragging===null||event.pointerId!==dragging)return;dragging=null;flush();};
 view.addEventListener('pointerup',release,options);
 view.addEventListener('pointercancel',release,options);
 root.addEventListener('change',event=>{dragging=null;if(changeRequestsCommit&&event.target.matches('select'))schedule();flush();},options);
 root.addEventListener('focusout',()=>{if(dragging===null)flush();},options);
 view.addEventListener('blur',()=>{dragging=null;flush();},options);
 view.addEventListener('pagehide',flush,options);
 return {schedule,flush,destroy(){if(destroyed)return;flush();destroyed=true;clear();controller.abort();}};
}

// Lightweight previews run at most once per display frame, independently of the
// deferred expensive analysis/storage work, including while a pointer is down.
export function bindFrameUpdates(root,render){
 const view=root.ownerDocument.defaultView;let frame=null,disposed=false;
 return {
  schedule(){if(disposed||frame!==null)return;frame=view.requestAnimationFrame(()=>{frame=null;if(!disposed&&root.isConnected)render();});},
  destroy(){disposed=true;if(frame!==null)view.cancelAnimationFrame(frame);frame=null;}
 };
}
