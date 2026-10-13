import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"https://amirrivazak66-beep.github.io","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:cors});
const validUsername=(s:string)=>/^[a-z0-9._-]{2,40}$/.test(s);

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply(405,{error:"method_not_allowed"});
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return reply(503,{error:"not_configured"});
 const authorization=req.headers.get("Authorization")||"";
 if(!authorization.startsWith("Bearer "))return reply(401,{error:"unauthorized"});
 const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
 const {data:authData,error:authError}=await caller.auth.getUser();
 if(authError||!authData.user)return reply(401,{error:"unauthorized"});
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:profile}=await admin.from("profiles").select("role").eq("id",authData.user.id).maybeSingle();
 if(!profile)return reply(403,{error:"profile_missing"});
 let body:{action?:unknown;username?:unknown;display_name?:unknown;role?:unknown;user_id?:unknown;new_password?:unknown};
 try{body=await req.json();}catch{return reply(400,{error:"invalid_request"});}
 const action=typeof body.action==="string"?body.action:"";

 if(action==="change_password"){
   const password=typeof body.new_password==="string"?body.new_password:"";
   if(password.length<10||password.length>128)return reply(400,{error:"password_policy"});
   const {error:updateError}=await admin.auth.admin.updateUserById(authData.user.id,{password});
   if(updateError)return reply(400,{error:"password_update_failed"});
   const {error:profileError}=await admin.from("profiles").update({must_change_password:false}).eq("id",authData.user.id);
   if(profileError)return reply(500,{error:"profile_update_failed"});
   return reply(200,{ok:true});
 }
 if(profile.role!=="manager")return reply(403,{error:"forbidden"});

 if(action==="create"){
   const username=typeof body.username==="string"?body.username.trim().toLowerCase():"";
   const displayName=typeof body.display_name==="string"?body.display_name.trim():"";
   const role=body.role==="manager"?"manager":"sales";
   if(!validUsername(username)||!displayName)return reply(400,{error:"invalid_user_data"});
   const temporaryPassword=crypto.randomUUID().replaceAll("-","")+"Aa1!";
   const {data:created,error:createError}=await admin.auth.admin.createUser({email:`${username}@auth.anbox.invalid`,password:temporaryPassword,email_confirm:true,user_metadata:{username}});
   if(createError||!created.user)return reply(409,{error:"user_creation_failed"});
   const {error:profileError}=await admin.from("profiles").insert({id:created.user.id,username,display_name:displayName,role,must_change_password:true});
   if(profileError){await admin.auth.admin.deleteUser(created.user.id);return reply(500,{error:"profile_creation_failed"});}
   return reply(200,{username,display_name:displayName,role,temporary_password:temporaryPassword,must_change_password:true});
 }
 if(action==="reset_password"){
   const userId=typeof body.user_id==="string"?body.user_id:"";
   if(!userId)return reply(400,{error:"invalid_user"});
   const {data:target}=await admin.from("profiles").select("username").eq("id",userId).maybeSingle();
   if(!target)return reply(404,{error:"user_not_found"});
   const temporaryPassword=crypto.randomUUID().replaceAll("-","")+"Bb2!";
   const {error:updateError}=await admin.auth.admin.updateUserById(userId,{password:temporaryPassword});
   if(updateError)return reply(500,{error:"password_reset_failed"});
   const {error:flagError}=await admin.from("profiles").update({must_change_password:true}).eq("id",userId);
   if(flagError)return reply(500,{error:"profile_update_failed"});
   return reply(200,{username:target.username,temporary_password:temporaryPassword,must_change_password:true});
 }
 return reply(400,{error:"invalid_action"});
});
