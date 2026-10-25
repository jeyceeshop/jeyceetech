const guards=new WeakMap();
export function createMathChallenge(){const values=crypto.getRandomValues(new Uint32Array(3));const a=3+values[0]%7,b=1+values[1]%a,operation=values[2]%2?'subtract':'add';return {a,b,operation,question:`${a} ${operation==='subtract'?'−':'+'} ${b}`};}
export function validMathAnswer(challenge,value){const text=String(value??'').trim();return !!challenge&&/^\d{1,2}$/.test(text)&&Number(text)===(challenge.operation==='subtract'?challenge.a-challenge.b:challenge.a+challenge.b);}
export function installAntiSpam(form,{challenge=null,refresh=null,requireServer=false,onStateChange=()=>{}}={}){
 if(guards.has(form))return guards.get(form);
 form.querySelectorAll('[data-antispam],.antispam-honeypot').forEach(el=>el.remove());
 let current=challenge||(requireServer?null:createMathChallenge()),state=current?'ready':'loading';
 const box=document.createElement('fieldset');box.className='antispam-box';box.dataset.antispam='';box.innerHTML='<legend>Verificación antispam</legend><div class="antispam-controls"><label><span class="antispam-question" aria-live="polite"></span><input name="antispam_answer" inputmode="numeric" autocomplete="off" required pattern="[0-9]{1,2}" maxlength="2" aria-label="Respuesta a la pregunta antispam"></label><button type="button" class="antispam-refresh">Otra pregunta</button></div><p class="antispam-help">Una cuenta sencilla para reducir envíos automáticos. Sin cookies ni seguimiento externo.</p><p class="antispam-error" role="alert" hidden></p>';
 const trap=document.createElement('div');trap.className='antispam-honeypot';trap.setAttribute('aria-hidden','true');trap.innerHTML='<label>Deja este campo vacío<input name="website" tabindex="-1" autocomplete="off"></label>';
 const submit=form.querySelector('[type=submit]');submit.before(box,trap);
 const input=box.querySelector('input'),error=box.querySelector('[role=alert]'),button=box.querySelector('button');
 function paint(){
  const ready=state==='ready'&&!!current;
  box.querySelector('.antispam-question').textContent=ready?`¿Cuánto es ${current.question}?`:state==='loading'?'Cargando verificación segura…':'La verificación no está disponible en este momento.';
  input.disabled=!ready;input.required=ready;input.value='';input.setCustomValidity('');input.removeAttribute('aria-invalid');
  input.setAttribute('aria-label',ready?'Respuesta: ¿Cuánto es '+current.question+'?':'Verificación antispam no disponible');
  button.disabled=state==='loading';button.textContent=state==='loading'?'Cargando…':state==='error'?'Reintentar validación':'Otra pregunta';error.hidden=true;
  onStateChange(state);
 }
 function fail(message,focus=true){if(!input.disabled)input.setAttribute('aria-invalid','true');error.textContent=message;error.hidden=false;if(focus&&!input.disabled)input.focus();}
 async function renew(){
  state='loading';paint();
  try{const next=refresh?await refresh():createMathChallenge();if(!next||requireServer&&!next.token)throw Error('No pudimos cargar la verificación del servidor. Reintenta en un momento.');current=next;state='ready';paint();return true;}
  catch(reason){current=null;state='error';paint();fail(reason?.message||'No pudimos cargar la verificación. Reintenta en un momento.',false);return false;}
 }
 form.addEventListener('submit',event=>{
  if(state!=='ready'||requireServer&&!current?.token){event.preventDefault();event.stopImmediatePropagation();fail(state==='loading'?'Espera a que cargue la verificación.':'No se pudo cargar la verificación del servidor. Pulsa Reintentar validación.',false);return;}
  if(trap.querySelector('input').value.trim()||!validMathAnswer(current,input.value)){event.preventDefault();event.stopImmediatePropagation();fail('Revisa la respuesta de la pregunta antispam e inténtalo de nuevo.');return;}
  error.hidden=true;
 },true);
 input.addEventListener('input',()=>{error.hidden=true;input.removeAttribute('aria-invalid');});button.addEventListener('click',()=>renew());
 form.addEventListener('reset',()=>{if(!requireServer&&!current?.token){current=createMathChallenge();state='ready';paint();}});
 paint();const guard={payload:()=>({token:current?.token||null,answer:input.value.trim()}),renew,ready:()=>state==='ready'&&(!requireServer||!!current?.token)};guards.set(form,guard);return guard;
}
