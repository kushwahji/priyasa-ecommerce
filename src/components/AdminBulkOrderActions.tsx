'use client';
import {useState} from 'react';

const statuses=['CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURN_REQUESTED'];

export default function AdminBulkOrderActions(){
 const [status,setStatus]=useState('PROCESSING');
 const [busy,setBusy]=useState(false);
 const [msg,setMsg]=useState('');
 async function run(){
  const ids=Array.from(document.querySelectorAll<HTMLInputElement>('input[data-admin-order-select]:checked')).map(x=>x.value);
  if(!ids.length){setMsg('Select at least one order');return;}
  if(!confirm(`Update ${ids.length} selected order${ids.length===1?'':'s'} to ${status.replaceAll('_',' ')}?`))return;
  setBusy(true);setMsg('Updating…');
  try{
   const r=await fetch('/api/admin/orders/bulk-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderIds:ids,status})});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||'Bulk update failed');
   setMsg(`${d.updated} updated${d.failed?.length?`; ${d.failed.length} failed`:''}`);
   setTimeout(()=>location.reload(),700);
  }catch(e){setMsg(e instanceof Error?e.message:'Bulk update failed');}finally{setBusy(false);}
 }
 return <div className="admin-bulk-bar">
  <div><strong>Bulk operations</strong><span className="muted"> Select orders using the checkboxes below.</span></div>
  <div className="admin-bulk-controls"><select className="input" value={status} onChange={e=>setStatus(e.target.value)} disabled={busy}>{statuses.map(x=><option key={x}>{x}</option>)}</select><button className="button dark-button" type="button" onClick={run} disabled={busy}>{busy?'Updating…':'Apply to selected'}</button>{msg&&<small className="muted">{msg}</small>}</div>
 </div>
}
