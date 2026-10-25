// Fixture aislada: nunca consulta ni modifica APIs o datos reales.
const created=new Date().toISOString();
const rows=[
 {reference:'JC-20261025-DE000001',kind:'order',name:'Marca de ejemplo',service:'Desarrollo web',plan:'Básico',price:261,status:'in_progress',content:'DATOS FICTICIOS. Web corporativa de 3 páginas para una marca de ejemplo.',assignee:'Equipo web'},
 {reference:'JC-20261025-DE000002',kind:'order',name:'Proyecto de muestra',service:'Diseño gráfico',plan:'Pro',price:130.5,status:'waiting_client',content:'DATOS FICTICIOS. Campaña visual; falta recibir los textos aprobados.',assignee:'Equipo de diseño'},
 {reference:'JC-DE000003',kind:'ticket',name:'Cliente de demostración',service:'Soporte de un proyecto',plan:'',price:null,status:'received',content:'DATOS FICTICIOS. Consulta sobre una entrega de muestra.',assignee:''}
].map(e=>({email:'cliente@example.com',phone:'',company:'Empresa ficticia',coupon:'',recipient:'support@jeycee.shop',mail_status:'sent',due_date:null,created_at:created,updated_at:created,version:1,...e}));
const threads=new Map(rows.map(e=>[e.reference,[{id:crypto.randomUUID(),author:'system',visibility:'public',body:'Solicitud ficticia para explorar el portal.',status:e.status,created_at:created}]]));
export async function demoRequest(action,params={},data={}){
 if(action==='list'){let filtered=rows.filter(e=>(!params.kind||e.kind===params.kind)&&(!params.status||e.status===params.status)&&(!params.search||[e.reference,e.name,e.service].join(' ').toLowerCase().includes(params.search.toLowerCase())));return {entries:structuredClone(filtered),stats:{orders:2,tickets:1,active:rows.filter(e=>!['completed','cancelled'].includes(e.status)).length,waiting:rows.filter(e=>e.status==='waiting_client').length},hasMore:false};}
 const e=rows.find(e=>e.reference===params.reference);if(!e)throw Error('Solicitud de ejemplo no encontrada.');
 if(action==='detail')return {entry:structuredClone(e),messages:structuredClone(threads.get(e.reference))};
 if(data.version!==e.version)throw Error('Recarga la solicitud de ejemplo.');
 if(action==='update'){e.status=data.status;e.assignee=data.assignee;e.due_date=data.dueDate||null;threads.get(e.reference).push({id:crypto.randomUUID(),author:'system',visibility:'public',body:data.message||'Estado actualizado en la demostración.',status:e.status,created_at:new Date().toISOString()});}
 if(['reply','note'].includes(action))threads.get(e.reference).push({id:crypto.randomUUID(),author:'staff',visibility:action==='note'?'internal':'public',body:data.message,created_at:new Date().toISOString()});
 e.version++;e.updated_at=new Date().toISOString();return {entry:structuredClone(e),notification:'not_requested'};
}
