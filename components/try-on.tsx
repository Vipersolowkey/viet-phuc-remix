"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, Download, Eraser, ImagePlus, LoaderCircle, Paintbrush, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { colors, garments, type Selection } from "@/lib/remix";
import { loadMockup, renderMockup } from "@/lib/mockup";
import { tryonErrors, uploadError } from "@/lib/try-on";

type Photo = { image: HTMLImageElement; blob: Blob; width: number; height: number; url: string; sample?: boolean };
async function preparePhoto(file: File): Promise<Photo> {
  const problem=uploadError(file); if(problem) throw new Error(problem);
  const url=URL.createObjectURL(file); const image=new Image(); image.src=url;
  try {
    await image.decode();
    if(image.naturalWidth*image.naturalHeight>24_000_000 || Math.min(image.naturalWidth,image.naturalHeight)<128) throw new Error("Chọn ảnh rõ, ít nhất 128 px và tối đa 24 megapixel.");
    const scale=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement("canvas");canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    const ctx=canvas.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await canvasBlob(canvas,"image/jpeg"); const preparedUrl=URL.createObjectURL(blob); const preparedImage=new Image();preparedImage.src=preparedUrl;
    try { await preparedImage.decode(); } catch(error) { URL.revokeObjectURL(preparedUrl); throw error; }
    return {image:preparedImage,blob,width:canvas.width,height:canvas.height,url:preparedUrl};
  } finally { URL.revokeObjectURL(url); }
}
function canvasBlob(canvas:HTMLCanvasElement,type="image/png") { return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Chưa đọc được ảnh. Hãy chọn lại.")),type,.9)); }

export function TryOn({ selection, onBack, active }: {selection:Selection;onBack:()=>void;active:boolean}) {
  const [photo,setPhoto]=useState<Photo|null>(null),[custom,setCustom]=useState<Photo|null>(null);
  const [reference,setReference]=useState<{blob:Blob;url:string}|null>(null);
  const [result,setResult]=useState(""),[mode,setMode]=useState<"result"|"original">("result");
  const [service,setService]=useState({ready:false,state:"checking"}),[checking,setChecking]=useState(false);
  const [busy,setBusy]=useState(false),[preparing,setPreparing]=useState(false),[consent,setConsent]=useState(false),[error,setError]=useState("");
  const [brush,setBrush]=useState(36),[erase,setErase]=useState(false),[maskCount,setMaskCount]=useState(0);
  const [rect,setRect]=useState({x:25,y:20,w:50,h:65});
  const base=useRef<HTMLCanvasElement>(null), overlay=useRef<HTMLCanvasElement>(null),mask=useRef<HTMLCanvasElement|null>(null);
  const personInput=useRef<HTMLInputElement>(null),garmentInput=useRef<HTMLInputElement>(null);
  const drawing=useRef<{x:number;y:number}|null>(null),controller=useRef<AbortController|null>(null),version=useRef(0),inputVersion=useRef(0),mounted=useRef(true);
  const garment=garments.find(g=>g.id===selection.garment)!,color=colors.find(c=>c.id===selection.color)!;
  const cloth=custom ?? reference;

  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;version.current++;controller.current?.abort();};},[]);
  useEffect(()=>()=>{if(photo)URL.revokeObjectURL(photo.url);},[photo]);
  useEffect(()=>()=>{if(custom)URL.revokeObjectURL(custom.url);},[custom]);
  useEffect(()=>()=>{if(reference)URL.revokeObjectURL(reference.url);},[reference]);
  useEffect(()=>()=>{if(result)URL.revokeObjectURL(result);},[result]);
  async function checkService() {
    setChecking(true);
    try {const response=await fetch("/api/try-on",{signal:AbortSignal.timeout(6000)});const body=await response.json() as {ready?:boolean;state?:string};if(mounted.current)setService({ready:response.ok && body.ready===true,state:body.state??"model_unavailable"});}
    catch{if(mounted.current)setService({ready:false,state:"model_unavailable"});}
    finally{if(mounted.current)setChecking(false);}
  }
  useEffect(()=>{if(active)void checkService();},[active]);
  useEffect(()=>{
    let canceled=false;
    invalidate();setReference(null);
    loadMockup(selection.garment).then(async image=>{
      const tinted=renderMockup(image,selection),canvas=document.createElement("canvas");canvas.width=tinted.width;canvas.height=tinted.height;
      const ctx=canvas.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(tinted,0,0);
      const blob=await canvasBlob(canvas); if(!canceled)setReference({blob,url:URL.createObjectURL(blob)});
    }).catch(()=>{if(!canceled)setError("Chưa tải được mẫu áo. Bạn có thể dùng ảnh áo riêng.");});
    return()=>{canceled=true;};
  },[selection.garment,selection.color,selection.harmony]);
  useEffect(()=>{
    if(!photo || !base.current || !overlay.current)return;
    for(const canvas of [base.current,overlay.current]){canvas.width=photo.width;canvas.height=photo.height;}
    base.current.getContext("2d")!.drawImage(photo.image,0,0);
    mask.current=document.createElement("canvas");mask.current.width=photo.width;mask.current.height=photo.height;
    const ctx=mask.current.getContext("2d")!;ctx.fillStyle="#000";ctx.fillRect(0,0,photo.width,photo.height);
    setMaskCount(0);drawing.current=null;repaint();
  },[photo]);
  function invalidate(){version.current++;controller.current?.abort();controller.current=null;setBusy(false);setResult("");setError("");}
  async function upload(file:File|undefined,kind:"person"|"garment",sample=false){
    if(!file)return;invalidate();const current=++inputVersion.current;setPreparing(true);
    try {const next=await preparePhoto(file);if(!mounted.current || current!==inputVersion.current){URL.revokeObjectURL(next.url);return;}if(kind==="person"){next.sample=sample;setPhoto(next);setConsent(false);}else setCustom(next);}
    catch(e){if(current===inputVersion.current)setError(e instanceof Error?e.message:"Chưa đọc được ảnh.");}
    finally{if(mounted.current && current===inputVersion.current)setPreparing(false);}
  }
  function repaint(){
    if(!mask.current || !overlay.current)return;
    const ctx=overlay.current.getContext("2d")!,source=mask.current.getContext("2d")!.getImageData(0,0,mask.current.width,mask.current.height);let count=0;
    for(let i=0;i<source.data.length;i+=4){const alpha=source.data[i];if(alpha>127)count++;source.data[i]=127;source.data[i+1]=41;source.data[i+2]=61;source.data[i+3]=Math.round(alpha*.48);}
    ctx.putImageData(source,0,0);setMaskCount(count);
  }
  function point(event:PointerEvent<HTMLCanvasElement>){const bounds=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-bounds.left)*event.currentTarget.width/bounds.width,y:(event.clientY-bounds.top)*event.currentTarget.height/bounds.height};}
  function stroke(from:{x:number;y:number},to:{x:number;y:number}){const ctx=mask.current!.getContext("2d")!;ctx.strokeStyle=erase?"#000":"#fff";ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=brush*mask.current!.width/384;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.beginPath();ctx.arc(to.x,to.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();repaint();}
  function pointerDown(event:PointerEvent<HTMLCanvasElement>){if(busy||!mask.current)return;invalidate();event.currentTarget.setPointerCapture(event.pointerId);const p=point(event);drawing.current=p;stroke(p,p);}
  function pointerMove(event:PointerEvent<HTMLCanvasElement>){if(!drawing.current||busy)return;const next=point(event);stroke(drawing.current,next);drawing.current=next;}
  function pointerEnd(){drawing.current=null;}
  function clearMask(){if(!mask.current)return;invalidate();const ctx=mask.current.getContext("2d")!;ctx.fillStyle="#000";ctx.fillRect(0,0,mask.current.width,mask.current.height);repaint();}
  function fillRectangle(){if(!mask.current)return;clearMask();const ctx=mask.current.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(rect.x/100*mask.current.width,rect.y/100*mask.current.height,Math.min(rect.w,100-rect.x)/100*mask.current.width,Math.min(rect.h,100-rect.y)/100*mask.current.height);repaint();}
  function fillSample(){if(!mask.current||!photo?.sample)return;clearMask();const ctx=mask.current.getContext("2d")!,w=mask.current.width,h=mask.current.height;const points=[[.39,.18],[.61,.18],[.72,.20],[.75,.50],[.71,.575],[.73,.89],[.27,.89],[.29,.575],[.25,.50],[.28,.20]];ctx.fillStyle="#fff";ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();ctx.fill();ctx.fillStyle="#000";for(const [x,y,rx,ry] of [[.3475,.5445,.0295,.0345],[.642,.5445,.032,.0345]]){ctx.beginPath();ctx.ellipse(x*w,y*h,rx*w,ry*h,0,0,Math.PI*2);ctx.fill();}repaint();}
  async function generate(){
    if(!photo || !cloth || !mask.current || !consent || busy || !service.ready)return;
    const coverage=maskCount/(photo.width*photo.height);if(coverage<.002||coverage>.8){setError("Tô một vùng áo vừa đủ, không phủ toàn bộ ảnh.");return;}
    invalidate();const current=version.current;const abort=new AbortController();controller.current=abort;setBusy(true);
    try{
      const form=new FormData();form.set("person",photo.blob,"person.jpg");form.set("garment",cloth.blob,"garment.png");form.set("mask",await canvasBlob(mask.current),"mask.png");form.set("consent","true");
      const response=await fetch("/api/try-on",{method:"POST",body:form,signal:AbortSignal.any([abort.signal,AbortSignal.timeout(185000)])});
      if(!response.ok){const body=await response.json().catch(()=>({})) as {error?:string};if(response.status===401)throw new Error("Đăng nhập để thử đồ bằng ảnh.");throw new Error(tryonErrors[body.error??""]??tryonErrors.inference_failed);}
      if(!response.headers.get("content-type")?.startsWith("image/png"))throw new Error(tryonErrors.inference_failed);
      const blob=await response.blob();const url=URL.createObjectURL(blob);const image=new Image();image.src=url;
      try{await image.decode();}catch{URL.revokeObjectURL(url);throw new Error(tryonErrors.inference_failed);}
      if(!mounted.current || current!==version.current){URL.revokeObjectURL(url);return;}setResult(url);setMode("result");toast.success("Ảnh thử đồ đã sẵn sàng.");
    }catch(e){if(current===version.current && mounted.current && !abort.signal.aborted)setError(e instanceof DOMException?tryonErrors.timeout:e instanceof Error?e.message:tryonErrors.inference_failed);}
    finally{if(current===version.current && mounted.current){setBusy(false);controller.current=null;}}
  }
  function removePhotos(){inputVersion.current++;invalidate();setPhoto(null);setCustom(null);setConsent(false);setMaskCount(0);mask.current=null;setPreparing(false);}
  async function useSample(){const current=++inputVersion.current;setPreparing(true);setError("");try{const response=await fetch("/tryon-person-sample.png");if(!response.ok)throw new Error();const blob=await response.blob();if(!mounted.current||current!==inputVersion.current)return;await upload(new File([blob],"anh-mau.png",{type:"image/png"}),"person",true);}catch{if(current===inputVersion.current)setError("Chưa tải được ảnh mẫu. Hãy chọn ảnh của bạn.");}finally{if(mounted.current&&current===inputVersion.current)setPreparing(false);}}
  function download(){if(!result)return;const a=document.createElement("a");a.href=result;a.download=`viet-phuc-try-on-${selection.garment}.png`;a.click();}

  return <div className="tryon-page">
    <button className="text-button subpage-back" onClick={onBack}><ArrowLeft size={16}/>Về Studio phối đồ</button>
    <div className="page-intro compact-intro"><div><span className="eyebrow">THỬ MỘT NÉT VIỆT MỚI</span><h1>Việt phục trên ảnh của bạn.</h1><p>Chọn ảnh, tô vùng áo và thử trang phục bằng CatVTON.</p></div><span className="outline-pill">CatVTON</span></div>
    <div className="tryon-grid">
      <section className="tryon-controls" aria-label="Chuẩn bị ảnh thử đồ">
        <div className="section-heading"><h2>01 · Ảnh của bạn</h2>{photo&&<button className="icon-button" onClick={removePhotos} disabled={busy} aria-label="Xóa ảnh thử đồ"><Trash2 size={17}/></button>}</div>
        <input ref={personInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Tải ảnh người" disabled={busy||preparing} onChange={e=>{void upload(e.target.files?.[0],"person");e.target.value="";}}/>
        <button className="tryon-upload" onClick={()=>personInput.current?.click()} disabled={busy||preparing}><ImagePlus size={24}/><strong>{preparing?"Đang chuẩn bị ảnh…":photo?"Đổi ảnh của bạn":"Chọn ảnh của bạn"}</strong><span>Đứng thẳng, thấy rõ từ đầu đến chân · JPG, PNG, WebP ≤ 10 MB</span></button>
        {!photo&&<button className="text-button" disabled={busy||preparing} onClick={()=>void useSample()}>Thử bằng ảnh mẫu</button>}
        <div className="tryon-field"><h2>02 · Trang phục muốn thử</h2><div className="tryon-cloth">{cloth?<img src={cloth.url} alt={custom?"Ảnh áo bạn đã chọn":`Mẫu ${garment.name} màu ${color.name}`}/>:<LoaderCircle className="spin" size={22}/>}<div><strong>{custom?"Ảnh áo riêng":garment.name}</strong><p>{custom?"Dùng kiểu dáng và màu trong ảnh áo.":color.name}</p><span className="input-hint">{custom?"Ảnh áo rõ, chụp chính diện.":"Mẫu minh họa từ bộ phối đang chọn."}</span></div></div>
        <input ref={garmentInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Tải ảnh trang phục" disabled={busy||preparing} onChange={e=>{void upload(e.target.files?.[0],"garment");e.target.value="";}}/>
        <div className="product-actions"><button className="secondary-button" onClick={()=>garmentInput.current?.click()} disabled={busy||preparing}>Dùng ảnh áo riêng</button>{custom&&<button className="text-button" disabled={busy} onClick={()=>{invalidate();setCustom(null);}}>Dùng mẫu bộ phối</button>}</div></div>
        <fieldset className="tryon-field" disabled={!photo||busy}><legend>03 · Tô vùng cần thay</legend><p className="input-hint">Tô hết áo cũ, cả vai và tay áo. Giữ mặt, tóc và bàn tay ngoài vùng tô.</p>
        {photo?.sample&&<button type="button" className="secondary-button" onClick={fillSample}>Chọn vùng áo cho ảnh mẫu</button>}
        <div className="tryon-tools"><button type="button" className={!erase?"active":""} aria-pressed={!erase} onClick={()=>setErase(false)}><Paintbrush size={16}/>Tô áo</button><button type="button" className={erase?"active":""} aria-pressed={erase} onClick={()=>setErase(true)}><Eraser size={16}/>Tẩy</button><button type="button" onClick={clearMask}><RotateCcw size={16}/>Xóa vùng</button></div>
        <label className="tryon-range">Cỡ cọ <span>{brush}</span><input aria-label="Cỡ cọ" type="range" min={10} max={90} value={brush} onChange={e=>setBrush(Number(e.target.value))}/></label>
        <details className="tryon-rectangle"><summary>Chọn vùng bằng thanh trượt</summary>{([['x','Vị trí ngang'],['y','Vị trí dọc'],['w','Chiều rộng'],['h','Chiều cao']] as const).map(([key,label])=><label key={key} className="tryon-range">{label}<span>{rect[key]}%</span><input aria-label={label} type="range" min={key==='w'||key==='h'?5:0} max={key==='w'||key==='h'?90:95} value={rect[key]} onChange={e=>setRect({...rect,[key]:Number(e.target.value)})}/></label>)}<button type="button" className="secondary-button" onClick={fillRectangle}>Áp dụng vùng chọn</button></details></fieldset>
        <label className="tryon-consent"><input type="checkbox" checked={consent} disabled={!photo||busy} onChange={e=>setConsent(e.target.checked)}/><span>Tôi có quyền sử dụng ảnh và đồng ý gửi ảnh đến máy xử lý CatVTON để thử đồ.</span></label>
        <button className="primary-button tryon-generate" onClick={generate} disabled={!photo||!cloth||!maskCount||!consent||busy||preparing||!service.ready}>{busy?<LoaderCircle size={18} className="spin"/>:<Paintbrush size={18}/>} {busy?"Đang thử trang phục…":"Thử đồ trên ảnh"}</button>
        <p role="status" className="input-hint">{busy?"Có thể mất vài phút. Bạn có thể hủy nếu muốn chỉnh lại ảnh.":checking?"Đang kiểm tra máy thử đồ…":service.ready?"Sẵn sàng thử đồ.":service.state==="login_required"?"Đăng nhập để thử đồ.":tryonErrors[service.state]??tryonErrors.model_unavailable}</p>
        {!service.ready&&!checking&&<button className="text-button" onClick={()=>void checkService()}>Kiểm tra lại</button>}
        {busy&&<button className="text-button" onClick={invalidate}>Hủy chờ kết quả</button>}
        {error&&<p className="tryon-error" role="alert">{error}</p>}
        <p className="tryon-privacy"><ShieldCheck size={16}/>Ảnh không được lưu vào lookbook. Xóa ảnh khi thử xong.</p>
      </section>
      <section className="tryon-workspace" aria-label="Ảnh và kết quả thử đồ">
        <div className="section-heading"><h2>{result?"Ảnh thử đồ của bạn":"Chọn vùng trang phục"}</h2>{result&&<button className="text-button" onClick={download}><Download size={16}/>Tải PNG</button>}</div>
        {result&&<div className="tryon-result-tabs" role="group" aria-label="So sánh ảnh thử đồ"><button aria-pressed={mode==="original"} onClick={()=>setMode("original")}>Ảnh gốc</button><button aria-pressed={mode==="result"} onClick={()=>setMode("result")}>Kết quả CatVTON</button></div>}
        {photo?<><div className="tryon-canvas-stage" style={{aspectRatio:`${photo.width}/${photo.height}`}}>
          <canvas ref={base} className="tryon-base" role="img" aria-label="Ảnh gốc để chọn vùng áo"/>
          <canvas ref={overlay} className="tryon-mask" role="img" aria-label="Vùng áo được tô để thay trang phục" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} style={{visibility:result?"hidden":"visible"}}/>
          {result&&<img className="tryon-output" src={mode==="original"?photo.url:result} alt={mode==="original"?"Ảnh gốc của bạn":"Kết quả thử trang phục bằng CatVTON"}/>}
          {busy&&<div className="tryon-processing"><LoaderCircle size={26} className="spin"/><strong>CatVTON đang thử áo…</strong></div>}
        </div>{result&&<button className="text-button" onClick={()=>{invalidate();setMode("result");}}>Chỉnh vùng áo và thử lại</button>}</>:<div className="tryon-empty"><div className="tryon-person" aria-hidden="true"><svg viewBox="0 0 200 320"><circle cx="100" cy="42" r="24"/><path d="M68 82 Q100 66 132 82 L152 195 L129 201 L116 137 L122 289 L99 289 L98 205 L91 289 L68 289 L76 137 L64 201 L44 195Z"/></svg></div><h3>Một tấm ảnh, một bộ phối mới.</h3><p>Tải ảnh để bắt đầu. Vùng bạn tô sẽ được thay bằng trang phục đã chọn.</p></div>}
        <p className="tryon-caption">Ảnh AI mang tính tham khảo, có thể khác độ vừa và chi tiết áo thực tế. Try-on thử trang phục; phụ kiện chưa được ghép thêm.</p>
        <details className="tryon-cultural"><summary>Nét Việt cần giữ</summary><p>{garment.signature}</p><p>{garment.advice}</p><a href={garment.source.url} target="_blank" rel="noreferrer">Đọc tại {garment.source.name}</a></details>
      </section>
    </div>
  </div>;
}
