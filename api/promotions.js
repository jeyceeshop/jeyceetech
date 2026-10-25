// Endpoint retirado: no registra contactos ni envía correos.
export default function handler(req,res){res.setHeader('Cache-Control','no-store');return res.status(410).json({error:'Esta promoción ya no está disponible.'});}
