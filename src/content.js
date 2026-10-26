import {services,plans} from './catalog.js';
import {premiumServices,products,tiersFor} from './premium.js';
import {pricing} from './pricing.js';
import {vacancies} from './careers.js';
import {defaultContent,serviceIds,planIds} from './content-defaults.js';
import {setManagedState} from './content-state.js';
const baseServices=structuredClone(services),basePremium=structuredClone(premiumServices);
export function applyContent(snapshot={version:0,content:defaultContent()}){
 const doc=snapshot.content||defaultContent();
 services.splice(0,services.length,...baseServices.map(base=>({...structuredClone(base),...structuredClone(doc.services[base.slug]),tiers:planIds.map(id=>[...doc.services[base.slug].plans[id].items])})));
 premiumServices.splice(0,premiumServices.length,...basePremium.map(base=>{const s=doc.services[base.slug];return {...structuredClone(base),...structuredClone(s),tiers:planIds.map(id=>[...s.plans[id].items]),planExclusions:Object.fromEntries(planIds.map(id=>[id,s.plans[id].exclusions]))};}));
 for(const id of serviceIds)pricing[id]=Object.fromEntries(planIds.map(plan=>[plan,doc.services[id].plans[plan].price]));
 plans.forEach(plan=>{plan.label=doc.planLabels[plan.id];plan.featured=doc.featuredPlan===plan.id;});
 vacancies.splice(0,vacancies.length,...doc.vacancies.filter(job=>job.active).map(job=>structuredClone(job)));
 products.splice(0,products.length,...premiumServices.flatMap(tiersFor));setManagedState(doc,snapshot.version||0);return snapshot;
}
export async function initializeContent(path){
 const embedded=document.querySelector('#published-content');if(embedded){const snapshot=JSON.parse(embedded.textContent);applyContent(snapshot);return snapshot;}
 if(path.startsWith('/admin'))return applyContent({version:0,content:defaultContent()});
 try{const response=await fetch('/api/content',{cache:'no-store',headers:{Accept:'application/json'}});if(response.status===404)return applyContent({version:0,content:defaultContent()});const snapshot=await response.json();if(!response.ok)throw Error(snapshot.error||'No pudimos actualizar la información del sitio.');return applyContent(snapshot);}
 catch(error){applyContent({version:0,content:defaultContent()});return {version:0,unavailable:true,error:error.message};}
}
