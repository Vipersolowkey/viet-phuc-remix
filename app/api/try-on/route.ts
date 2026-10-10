import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { boundedBody, imageSignature, imageTypes, MAX_PREPARED_BYTES, tryonEndpoint } from "@/lib/try-on";
export const dynamic = "force-dynamic";
const reply = (body: object, status = 200) => Response.json(body, {status, headers:{"Cache-Control":"no-store"}});
function config() {
  const url = tryonEndpoint(env.TRYON_API_URL, import.meta.env.DEV);
  return url && env.TRYON_API_KEY && env.TRYON_API_KEY.length >= 32 ? {url,key:env.TRYON_API_KEY} : null;
}
export async function GET() {
  const service = config();
  if (!service) return reply({ready:false,state:"not_configured",model:"CatVTON"});
  if (!await getChatGPTUser()) return reply({ready:false,state:"login_required"},401);
  try {
    const response = await fetch(`${service.url}/health`, {headers:{Authorization:`Bearer ${service.key}`}, signal:AbortSignal.timeout(4000), redirect:"manual"});
    const body = await response.json() as {ready?:unknown;model?:unknown;state?:unknown};
    return reply({ready:response.ok && body.ready===true && body.model==="CatVTON",state:body.ready===true && response.ok && body.model==="CatVTON" ? "ready" : "model_unavailable",model:"CatVTON"});
  } catch { return reply({ready:false,state:"model_unavailable",model:"CatVTON"}); }
}
export async function POST(request: Request) {
  const origin=request.headers.get("origin");
  if (origin && origin!==new URL(request.url).origin) return reply({error:"origin_rejected"},403);
  const user=await getChatGPTUser();
  if (!user) return reply({error:"login_required"},401);
  const service=config();
  if (!service) return reply({error:"not_configured"},503);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return reply({error:"invalid_image"},400);
  let form: FormData;
  try {
    const body=await boundedBody(request);
    form=await new Response(body,{headers:{"content-type":request.headers.get("content-type")!}}).formData();
    if (form.get("consent")!=="true") return reply({error:"consent_required"},400);
    for (const name of ["person","garment","mask"]) {
      const image=form.get(name);
      if (!(image instanceof File) || !image.size || image.size>MAX_PREPARED_BYTES || !imageTypes.includes(image.type) || !imageSignature(new Uint8Array(await image.slice(0,12).arrayBuffer()),image.type)) return reply({error:"invalid_image"},400);
    }
  } catch(error) { return reply({error:error instanceof Error && error.message==="input_too_large" ? "input_too_large" : "invalid_image"}, error instanceof Error && error.message==="input_too_large" ? 413 : 400); }
  const userHash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(user.userId)))].map(b=>b.toString(16).padStart(2,"0")).join("");
  const upstream=new FormData();
  for (const name of ["person","garment","mask"]) upstream.set(name,form.get(name) as File,`${name}.png`);
  try {
    const response=await fetch(`${service.url}/try-on`,{method:"POST",headers:{Authorization:`Bearer ${service.key}`,"X-Tryon-User":userHash},body:upstream,signal:AbortSignal.timeout(180000),redirect:"manual"});
    if (!response.ok) {
      const error=await response.json().catch(()=>({error:"inference_failed"})) as {error?:string};
      const known=["busy","rate_limited","invalid_image","input_too_large","model_unavailable","output_rejected"];
      return reply({error:known.includes(error.error ?? "") ? error.error : "inference_failed"},response.status===429 ? 429 : response.status===400 ? 400 : response.status===422 ? 422 : 502);
    }
    if (!response.headers.get("content-type")?.startsWith("image/png")) return reply({error:"inference_failed"},502);
    const output=await boundedBody(new Request("https://output.invalid",{method:"POST",body:response.body,duplex:"half"} as RequestInit),MAX_PREPARED_BYTES);
    if (!imageSignature(output,"image/png")) return reply({error:"inference_failed"},502);
    return new Response(output,{headers:{"Content-Type":"image/png","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  } catch (error) { return reply({error:error instanceof DOMException && error.name==="TimeoutError" ? "timeout" : "inference_failed"},502); }
}
