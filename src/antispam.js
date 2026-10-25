const guards=new WeakMap();
export function createMathChallenge(){const values=crypto.getRandomValues(new Uint32Array(3));const a=3+values[0]%7,b=1+values[1]%a,operation=values[2]%2?'subtract':'add';return {a,b,operation,question:`${a} ${operation==='subtract'?'−':'+'} ${b}`};}
export function validMathAnswer(challenge,value){const text=String(value??'').trim();return /^\d{1,2}$/.test(text)&&Number(text)===(challenge.operation==='subtract'?challenge.a-challenge.b:challenge.a+challenge.b);}
export function installAntiSpam(form,{challenge=null,refresh=null}={}){
 if(guards.has(form))return guards.get(form);
 // Cloned forms inherit markup, not event listeners or the original challenge state.
 form.querySelectorAll('[data-antispam],.antispam-honeypot').forEach(el=>el.remove());
 let current=challenge||createMathChallenge();
 const box=document.createElement('fieldset');box.className='antispam-box';box.dataset.antispam='';box.innerHTML='<legend>Verificación antispam</legend><div class="antispam-controls"><label><span class="antispam-question"></span><input name="antispam_answer" inputmode="numeric" autocomplete="off" required pattern="[0-9]{1,2}" maxlength="2" aria-label="Respuesta a la pregunta antispam"></label><button type="button" class="antispam-refresh">Otra pregunta</button></div><p class="antispam-help">Una cuenta sencilla para reducir envíos automáticos. Sin cookies ni seguimiento externo.</p><p class="antispam-error" role="alert" hidden></p>';
 const trap=document.createElement('div');trap.className='antispam-honeypot';trap.setAttribute('aria-hidden','true');trap.innerHTML='<label>Deja este campo vacío<input name="website" tabindex="-1" autocomplete="off"></label>';
 const submit=form.querySelector('[type=submit]');submit.before(box,trap);
 const input=box.querySelector('input'),error=box.querySelector('[role=alert]'),button=box.querySelector('button');
 function paint(){box.querySelector('.antispam-question').textContent=`¿Cuánto es ${current.question}?`;input.setAttribute('aria-label','Respuesta: ¿Cuánto es '+current.question+'?');input.value='';input.setCustomValidity('');error.hidden=true;}
 function fail(message){input.setAttribute('aria-invalid','true');error.textContent=message;error.hidden=false;input.focus();}
 async function renew(){button.disabled=true;try{current=refresh?await refresh():createMathChallenge();paint();return true;}catch{current={...current,token:null};fail('No pudimos renovar la pregunta. Intenta otra vez.');return false;}finally{button.disabled=false;}}
 form.addEventListener('submit',event=>{if(button.disabled){event.preventDefault();event.stopImmediatePropagation();fail('Espera a que cargue la pregunta.');return;}if(trap.querySelector('input').value.trim()||!validMathAnswer(current,input.value)){event.preventDefault();event.stopImmediatePropagation();fail('Revisa la respuesta de la pregunta antispam e inténtalo de nuevo.');return;}error.hidden=true;},true);
 input.addEventListener('input',()=>{error.hidden=true;input.removeAttribute('aria-invalid');});button.addEventListener('click',renew);
 form.addEventListener('reset',()=>{if(!current.token){current=createMathChallenge();paint();}});
 paint();const guard={payload:()=>({token:current.token||null,answer:input.value.trim()}),renew};guards.set(form,guard);return guard;
}
