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
export const portalReferencePattern=/^JC-(?:\d{8}-)?(?:[A-F0-9]{8}|[A-F0-9]{24})$/;
export const orderReferencePattern=/^JC-\d{8}-(?:[A-F0-9]{8}|[A-F0-9]{24})$/;
export const referenceHasConversation=reference=>/^JC-(?:\d{8}-)?[A-F0-9]{24}$/.test(reference);
