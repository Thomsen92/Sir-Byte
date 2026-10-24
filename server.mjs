import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.glb':'model/gltf-binary','.mp3':'audio/mpeg'};
http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)) { res.writeHead(403); res.end(); return; }
    const info=await stat(file); if(!info.isFile()) throw new Error('Not a file');
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}); res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173,'127.0.0.1',()=>console.log('Sir Byte: http://127.0.0.1:4173'));
