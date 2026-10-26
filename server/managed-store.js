// Only public catalog data and authenticated proposal operations use these methods.
export function managedStore({request,rpc}){
 const optional=async operation=>{try{return await operation();}catch(error){if(error.portalCode==='PORTAL_DATABASE_SETUP_REQUIRED')return null;throw error;}};
 async function result(name,args){const data=await rpc(name,args);if(!data){const error=Error('No encontramos la propuesta.');error.status=404;throw error;}for(const [key,message] of Object.entries({conflict:'Otro cambio actualizó este registro. Recarga antes de continuar.',locked:'La solicitud ya tiene una propuesta aceptada. Se conserva el acuerdo original.',expired:'La propuesta venció. Prepara una nueva versión.'}))if(data[key]){const error=Error(message);error.status=409;throw error;}return data;}
 return {
  async getContent(){const rows=await optional(()=>request('site_content?id=eq.main&select=*&limit=1'));return rows?.[0]||{version:0,setupRequired:true};},
  async publishContent(version,document){return result('portal_publish_content',{p_version:version,p_document:document});},
  async quotes(reference){return await optional(()=>request('portal_quotes?entry_reference=eq.'+encodeURIComponent(reference)+'&select=*&order=created_at.desc&limit=100'))||[];},
  async saveQuote(reference,data){return result('portal_save_quote',{p_reference:reference,p_id:data.id,p_version:data.version,p_document:data.document,p_hash:data.hash,p_name:data.staffName,p_role:data.staffRole});},
  async sendQuote(reference,data){return result('portal_send_quote',{p_reference:reference,p_id:data.id,p_version:data.version,p_name:data.staffName,p_role:data.staffRole});},
  async withdrawQuote(reference,data){return result('portal_withdraw_quote',{p_reference:reference,p_id:data.id,p_version:data.version});},
  async decideQuote(reference,data){return result('portal_decide_quote',{p_reference:reference,p_id:data.id,p_version:data.version,p_decision:data.decision,p_name:data.name,p_note:data.note||''});},
  async quoteMail(id,status){return request('portal_quotes?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{mail_status:status},prefer:'return=minimal'});}
 };
}
