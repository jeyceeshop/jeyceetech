import {briefProfile,normalizeServiceDetails} from './brief-schema.js';
export function installServiceBrief(form,getProduct){
 const box=form.querySelector('#service-brief'),drafts=new Map();let shown=null;
 function rawAnswers(){
  if(!shown)return {};const data=new FormData(form),profile=briefProfile(shown),answers={};
  for(const field of profile.fields)answers[field.id]=field.type==='multiple'?data.getAll('details_'+field.id):data.get('details_'+field.id)||'';
  return answers;
 }
 function update(){
  const product=getProduct();if(shown?.serviceSlug===product?.serviceSlug)return;
  if(shown)drafts.set(shown.serviceSlug,rawAnswers());shown=product;box.replaceChildren();box.hidden=!product;if(!product)return;
  const profile=briefProfile(product),saved=drafts.get(product.serviceSlug)||{};
  const eyebrow=document.createElement('span');eyebrow.className='eyebrow';eyebrow.textContent='EL BRIEF DE TU SERVICIO / '+product.serviceName;
  const heading=document.createElement('h3');heading.id='service-brief-title';heading.setAttribute('aria-live','polite');heading.textContent=profile.title;
  const intro=document.createElement('p');intro.className='service-brief-intro';intro.textContent=profile.intro;box.append(eyebrow,heading,intro);
  const mainBrief=form.elements.brief;if(mainBrief)mainBrief.placeholder=profile.placeholder+' No incluyas información confidencial.';
  for(const field of profile.fields){
   if(field.type==='multiple'){
    const group=document.createElement('fieldset');group.className='brief-choice-group';const legend=document.createElement('legend');legend.textContent=field.label+(field.required?' *':' (opcional)');group.append(legend);
    const items=document.createElement('div');items.className='brief-choice-options';
    for(const option of field.options){const label=document.createElement('label');label.className='checkbox brief-choice';const input=document.createElement('input');input.type='checkbox';input.name='details_'+field.id;input.value=option;input.checked=Array.isArray(saved[field.id])&&saved[field.id].includes(option);const text=document.createElement('span');text.textContent=option;label.append(input,text);items.append(label);}
    group.append(items);const note=document.createElement('p');note.className='form-note';note.textContent=field.required?'Selecciona al menos una opción. Si no estás seguro, elige orientación o por definir.':'Puedes elegir varias opciones.';group.append(note);
    if(field.required){const first=items.querySelector('input');const validity=()=>first.setCustomValidity(items.querySelector('input:checked')?'':'Selecciona al menos una opción en «'+field.label+'».');items.addEventListener('change',validity);validity();}
    box.append(group);
   }else{
    const label=document.createElement('label');label.textContent=field.label+(field.required?' *':' (opcional)');let input;
    if(field.type==='select'){
     input=document.createElement('select');const blank=document.createElement('option');blank.value='';blank.textContent=field.required?'Selecciona una opción':'Selecciona si lo tienes definido';input.append(blank);
     for(const option of field.options){const item=document.createElement('option');item.value=option;item.textContent=option;input.append(item);}
    }else{input=document.createElement(field.type==='url'?'input':'textarea');if(field.type==='url')input.type='url';else input.rows=3;input.maxLength=field.maxLength;input.placeholder=field.placeholder;}
    input.name='details_'+field.id;input.required=field.required===true;if(field.type==='text'&&field.required)input.minLength=2;input.value=typeof saved[field.id]==='string'?saved[field.id]:'';label.append(input);box.append(label);
   }
  }
  const note=document.createElement('p');note.className='form-note service-brief-note';note.textContent='Estas respuestas ayudan a cotizar. El alcance, calendario y precio final se confirman en la propuesta.';box.append(note);
 }
 update();return {update,payload(){const product=getProduct();return product?{briefVersion:1,serviceDetails:normalizeServiceDetails(product,rawAnswers())}:{};}};
}
