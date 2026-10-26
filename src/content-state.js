// Only published, public site information is stored here. Never credentials or customer data.
export let managedContent=null;
export let managedVersion=0;
export function setManagedState(document,version){managedContent=document;managedVersion=version;}
