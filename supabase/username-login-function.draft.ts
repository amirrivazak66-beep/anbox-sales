// Draft only. Do not deploy until rate limiting and provisioning are implemented.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return reply(405,{error:"method_not_allowed"});
 const url=Deno.env.get("SUPABASE_URL"), key=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!key) return reply(503,{error:"not_configured"});
 let b:{username?:unknown;password?:unknown}; try{b=await req.json();}catch{return reply(400,{error:"invalid_request"});}
 const username=typeof b.username==="string"?b.username.trim().toLowerCase():"", password=typeof b.password==="string"?b.password:"";
 if(!/^[a-z0-9._-]{2,40}$/.test(username)||!password||password.length>256)return reply(400,{error:"invalid_credentials"});
 try{const r=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify({email:`${username}@auth.anbox.invalid`,password})});const data=await r.json().catch(()=>({}));if(!r.ok)return reply(401,{error:"invalid_credentials"});return reply(200,data);}catch{return reply(503,{error:"auth_unavailable"});}
});