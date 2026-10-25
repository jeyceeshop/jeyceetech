export const serviceStatuses=[
 {id:'received',label:'Solicitud recibida',hint:'El equipo revisará el alcance y los próximos pasos.'},
 {id:'confirmed',label:'Confirmado',hint:'El equipo ha confirmado la solicitud.'},
 {id:'in_progress',label:'En proceso',hint:'Estamos trabajando en tu servicio.'},
 {id:'waiting_client',label:'Esperando al cliente',hint:'Revisa los mensajes: necesitamos tu información o aprobación.'},
 {id:'in_review',label:'En revisión',hint:'La entrega está en revisión.'},
 {id:'completed',label:'Finalizado',hint:'El equipo ha marcado el servicio como finalizado.'},
 {id:'cancelled',label:'Cancelado',hint:'Consulta el historial o contacta al equipo para más información.'}
];
export const statusFor=id=>serviceStatuses.find(s=>s.id===id)||serviceStatuses[0];
export const portalReferencePattern=/^(?:\d{4,8}|JC-\d{4,8}|JC-(?:\d{8}-)?(?:[A-F0-9]{8}|[A-F0-9]{24}))$/;
export const orderReferencePattern=/^(?:\d{4,8}|JC-\d{4,8}|JC-\d{8}-(?:[A-F0-9]{8}|[A-F0-9]{24}))$/;
export const displayReference=reference=>String(reference||'').replace(/^JC-(\d{8})$/,(_,digits)=>'JC-'+String(Number(digits)).padStart(4,'0'));
export const storageReference=reference=>/^(?:JC-)?\d{4,8}$/.test(reference)?'JC-'+reference.replace(/^JC-/,'').padStart(8,'0'):reference;
export const referenceNeedsContact=reference=>/^JC-\d{8}$/.test(storageReference(reference));
export const referenceHasConversation=reference=>referenceNeedsContact(reference)||/^JC-(?:\d{8}-)?[A-F0-9]{24}$/.test(reference);
