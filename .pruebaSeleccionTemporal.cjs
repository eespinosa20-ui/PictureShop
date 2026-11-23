const a = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
require("@next/env").loadEnvConfig(process.cwd());
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "pictureshop-seleccion-"));
const url = "http://127.0.0.1:4320";
const servidor = spawn(process.execPath, ["node_modules/next/dist/bin/next","start","-p","4320","-H","127.0.0.1"], {stdio:"ignore",windowsHide:true});
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless","--disable-gpu","--no-first-run","--remote-debugging-port=0","--user-data-dir="+perfil,"about:blank"], {stdio:"ignore",windowsHide:true});
const pausa = ms => new Promise(resolve => setTimeout(resolve,ms));
async function esperar(paso, fn) {
  for(let i=0;i<80;i++){
    try { const dato=await fn(); if(dato)return dato; } catch {}
    await pausa(100);
  }
  throw Error("No se pudo verificar: "+paso);
}
const ids = new Map([[1,new Set()],[2,new Set([99])]]);
const evento = {idEvento:1,nombreEvento:"Evento de prueba",costoFoto:"10.00",nombreFotografo:"Autor",fechaCreacion:"2026-11-22"};
const fotos = [1,2,3].map(idFoto=>({idFoto,idEvento:1,nombreFoto:"Fotografía "+idFoto,fechaPublicacion:"2026-11-22"}));
const cambios = [];
let falloEn = -1;
const carrito = idEvento => ({idEvento,nombreEvento:evento.nombreEvento,cantidad:ids.get(idEvento).size,fotos:[...ids.get(idEvento)].map(idFoto=>({idFoto,idEvento}))});

(async()=>{
  const puerto = await esperar("Edge",()=>Number(fs.readFileSync(path.join(perfil,"DevToolsActivePort"),"utf8").split("\n")[0]));
  await esperar("Next",async()=> (await fetch(url+"/inicioSesion/cliente",{signal:AbortSignal.timeout(1000)})).ok);
  const targets = await(await fetch("http://127.0.0.1:"+puerto+"/json/list")).json();
  const ws = new WebSocket(targets.find(t=>t.type==="page").webSocketDebuggerUrl);
  await Promise.race([new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;}),pausa(4000).then(()=>{throw Error("CDP no disponible");})]);
  let id=0;
  const pendientes=new Map();
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{
    const actual=++id;
    const limite=setTimeout(()=>{pendientes.delete(actual);reject(Error(method));},6000);
    pendientes.set(actual,r=>{clearTimeout(limite);pendientes.delete(actual);if(r.error)reject(Error(r.error.message));else resolve(r.result);});
    ws.send(JSON.stringify({id:actual,method,params}));
  });
  ws.onmessage=({data})=>{
    const m=JSON.parse(data);
    pendientes.get(m.id)?.(m);
    if(m.method!=="Fetch.requestPaused")return;
    const {requestId,request}=m.params;
    const ruta=new URL(request.url).pathname;
    let body, responseCode=200;
    if(ruta==="/api/eventosCliente/1/fotos") body={evento,fotos};
    const detalle=ruta.match(/^\/api\/eventosCliente\/1\/fotos\/(\d+)$/);
    if(detalle)body={evento,foto:fotos[Number(detalle[1])-1],idFotoAnterior:null,idFotoSiguiente:2};
    const partes=ruta.match(/^\/api\/carrito\/(\d+)(?:\/fotos(?:\/(\d+))?)?$/);
    if(partes){
      const idEvento=Number(partes[1]);
      if(request.method==="GET")body={carrito:carrito(idEvento)};
      if(request.method==="POST"||request.method==="DELETE"){
        const idFoto=request.method==="POST"?JSON.parse(request.postData).idFoto:Number(partes[2]);
        cambios.push([request.method,idEvento,idFoto]);
        if(idFoto===falloEn){
          responseCode=500;body={mensaje:"Fallo simulado del carrito."};
        }else{
          if(request.method==="POST") ids.get(idEvento).add(idFoto);
          else ids.get(idEvento).delete(idFoto);
          body={carrito:carrito(idEvento)};
        }
      }
    }
    if(ruta==="/api/carrito")body={carrito:null};
    (body?cdp("Fetch.fulfillRequest",{requestId,responseCode,responseHeaders:[{name:"Content-Type",value:"application/json"}],body:Buffer.from(JSON.stringify(body)).toString("base64")}):cdp("Fetch.continueRequest",{requestId})).catch(e=>console.error(e.message));
  };
  const js = async expression => (await cdp("Runtime.evaluate",{expression,returnByValue:true})).result.value;
  const seleccionadas=()=>js('document.querySelectorAll(".botonCarritoPill[aria-pressed=true]").length');
  const esperarSeleccion=async n=>{
    try {
      await esperar("seleccion y contador "+n,async()=>await seleccionadas()===n&&await js('(document.querySelector(".badgeCarritoEncabezado")?.textContent??"0")==='+JSON.stringify(String(n))));
    } catch (e) {
      console.log({cambios,seleccionadas:await seleccionadas(),ruta:await js("location.href"),contador:await js('document.querySelector(".badgeCarritoEncabezado")?.textContent')});
      throw e;
    }
  };
  const foto=async indice=>{
    await esperar("boton habilitado",()=>js(`document.querySelectorAll(".botonCarritoPill")[${indice}]?.disabled===false`));
    return js(`document.querySelectorAll(".botonCarritoPill")[${indice}].click()`);
  };
  const masiva=texto=>js(`[...document.querySelectorAll("button")].find(b=>b.textContent.trim()===${JSON.stringify(texto)}).click()`);
  try {
    await cdp("Fetch.enable",{patterns:[{urlPattern:url+"/api/*"}]});
    const {SignJWT}=await import("jose");
    const token=await new SignJWT({tipoUsuario:"cliente"}).setProtectedHeader({alg:"HS256"}).setSubject("987654").setExpirationTime("5m").sign(new TextEncoder().encode(process.env.CLAVE_SESION));
    await cdp("Network.setCookie",{url,name:"sesionPictureShop",value:token,httpOnly:true});
    await cdp("Emulation.setDeviceMetricsOverride",{width:1366,height:768,deviceScaleFactor:1,mobile:false});
    await cdp("Page.navigate",{url:url+"/eventosCarpeta/1"});
    await esperar("botones de galeria",()=>js('document.querySelectorAll(".botonCarritoPill:not(:disabled)").length===3'));
    await foto(0); await esperarSeleccion(1);
    await foto(0); await esperarSeleccion(0);
    await foto(0); await esperarSeleccion(1);
    let inicio=cambios.length;
    await masiva("Seleccionar todas"); await esperarSeleccion(3);
    a.deepEqual(cambios.slice(inicio),[["POST",1,2],["POST",1,3]]);
    await masiva("Deseleccionar todas"); await esperarSeleccion(0);
    falloEn=2;
    await masiva("Seleccionar todas"); await esperarSeleccion(1);
    await esperar("aviso de fallo",()=>js('document.body.innerText.includes("Fallo simulado del carrito")'));
    falloEn=-1;
    await js('document.querySelector(".tarjetaFotoCliente").click()');
    await esperar("detalle seleccionado",()=>js('location.pathname==="/eventosFoto/1"&&document.querySelector(".botonCarritoPill")?.getAttribute("aria-pressed")==="true"'));
    await foto(0); await esperarSeleccion(0);
    await foto(0); await esperarSeleccion(1);
    await js(`document.querySelector('a[href="/eventosCarpeta/1"]').click()`);
    await esperar("regreso a galeria",()=>js('location.pathname==="/eventosCarpeta/1"&&document.querySelectorAll(".botonCarritoPill").length===3'));
    await esperarSeleccion(1);
    await cdp("Page.reload");
    await esperar("galeria recargada",()=>js('document.querySelectorAll(".botonCarritoPill:not(:disabled)").length===3'));
    await esperarSeleccion(1);
    a.deepEqual([...ids.get(2)],[99]);
    a.ok(cambios.every(([,idEvento])=>idEvento===1));
    console.log("OK: toggle doble, seleccion parcial y masiva, fallo parcial, contador, navegacion, recarga y evento independiente.");
  } finally {
    await cdp("Browser.close").catch(()=>{});
    ws.close();
  }
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>{edge.kill();servidor.kill();});
