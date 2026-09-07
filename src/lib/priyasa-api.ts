const BASE_URL=(process.env.PRIYASA_API_BASE_URL||'https://api.priyasa.com').replace(/\/$/,'');
const API_TOKEN=process.env.PRIYASA_API_TOKEN?.trim();

export async function priyasaApi(path:string, init:RequestInit={}){
  const normalizedPath=path.startsWith('/')?path:`/${path}`;
  const headers=new Headers(init.headers);
  headers.set('Content-Type','application/json');
  headers.set('Accept','application/json');
  headers.set('User-Agent','Priyasa-Web/1.0');
  if(API_TOKEN) headers.set('Authorization',`Bearer ${API_TOKEN}`);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(`${BASE_URL}${normalizedPath}`,{...init,headers,cache:'no-store',signal:init.signal||controller.signal});
    const text=await response.text();
    let body:unknown=null;
    try{body=text?JSON.parse(text):null}catch{body={message:text};}
    return {response,body};
  }finally{clearTimeout(timeout);}
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
