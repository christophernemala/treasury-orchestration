export const API_ROOT=`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api`;
const ROOT=API_ROOT;
export const getToken=()=>localStorage.getItem('treasury_token');
export const setToken=(v:string)=>localStorage.setItem('treasury_token',v);
export const clearToken=()=>localStorage.removeItem('treasury_token');
export async function api<T>(path:string,init:RequestInit={}):Promise<T>{
  const res=await fetch(ROOT+path,{...init,headers:{'Content-Type':'application/json',...(getToken()?{Authorization:`Bearer ${getToken()}`}:{...{}}),...init.headers}});
  if(!res.ok){const body=await res.json().catch(()=>({error:'Request failed'}));throw new Error(typeof body.error==='object'?body.error.message:(body.error||'Request failed'))}
  if(res.status===204)return undefined as T;return res.json();
}
export async function downloadCsv(){const res=await fetch(ROOT+'/reports/transactions.csv',{headers:{Authorization:`Bearer ${getToken()}`}});if(!res.ok)throw new Error('Export failed');const url=URL.createObjectURL(await res.blob());const a=document.createElement('a');a.href=url;a.download='treasury-transactions.csv';a.click();URL.revokeObjectURL(url)}
