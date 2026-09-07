const BASE_URL=(process.env.PRIYASA_API_BASE_URL||'https://api.priyasa.com').replace(/\/$/,'');

export async function priyasaApi(path:string, init:RequestInit={}){
  const headers=new Headers(init.headers);
  headers.set('Content-Type','application/json');
  const response=await fetch(`${BASE_URL}${path}`,{...init,headers,cache:'no-store'});
  const text=await response.text();
  let body:unknown=null; try{body=text?JSON.parse(text):null}catch{body={message:text};}
  return {response,body};
}

export function apiError(body:unknown,fallback:string){
  if(body&&typeof body==='object'){
    const x=body as {message?:unknown;data?:{message?:unknown};errors?:Record<string,string[]>};
    if(typeof x.message==='string')return x.message;
    if(typeof x.data?.message==='string')return x.data.message;
    const first=x.errors&&Object.values(x.errors)[0]?.[0]; if(first)return first;
  }
  return fallback;
}
