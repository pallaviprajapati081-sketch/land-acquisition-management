const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dataFile = path.join(__dirname, 'data', 'demo_data.json');
const readData = () => JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const json = (res, status, value) => { res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'}); res.end(JSON.stringify(value)); };
const stats = (d) => {
  const paid = d.compensation.filter(x => x.paymentStatus === 'Paid');
  const acquired = d.parcels.filter(x => ['Acquired','Possession completed'].includes(x.acquisitionStatus));
  const alerts = d.cases.filter(x => x.issue || x.overdueDays);
  return { projects:d.projects.length, states:d.states.length, parcels:d.parcels.length, cases:d.cases.length,
    requiredArea:+d.projects.reduce((a,x)=>a+x.requiredArea,0).toFixed(2), acquiredArea:+d.projects.reduce((a,x)=>a+x.acquiredArea,0).toFixed(2),
    paidAmount:+paid.reduce((a,x)=>a+x.awardAmount,0).toFixed(2), pendingAmount:+d.compensation.filter(x=>x.paymentStatus==='Pending').reduce((a,x)=>a+x.pendingAmount,0).toFixed(2),
    possessionCompleted:d.parcels.filter(x=>x.possessionStatus==='Completed').length, alerts:alerts.length, families:d.families.length,
    stageBreakdown:Object.fromEntries([...new Set(d.cases.map(x=>x.stage))].map(s=>[s,d.cases.filter(x=>x.stage===s).length])),
    statusBreakdown:Object.fromEntries([...new Set(d.parcels.map(x=>x.acquisitionStatus))].map(s=>[s,d.parcels.filter(x=>x.acquisitionStatus===s).length])) };
};
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost'); const d = readData();
  if (url.pathname === '/api/stats') return json(res,200,stats(d));
  if (url.pathname === '/api/data') return json(res,200,d);
  if (url.pathname === '/api/projects') return json(res,200,d.projects);
  if (url.pathname === '/api/parcels') return json(res,200,d.parcels);
  if (url.pathname === '/api/cases') return json(res,200,d.cases);
  if (url.pathname === '/api/documents/placeholder') { res.writeHead(200, {'Content-Type':'text/plain','Content-Disposition':'attachment; filename="synthetic-document.txt"'}); return res.end('SYNTHETIC DEMONSTRATION DOCUMENT\nNot for legal or administrative use.'); }
  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  const candidate = path.normalize(path.join(root,'public',file));
  if (!candidate.startsWith(path.join(root,'public'))) return json(res,403,{error:'Forbidden'});
  fs.readFile(candidate,(err,body)=> { if(err) return json(res,404,{error:'Not found'}); res.writeHead(200,{'Content-Type':mime[path.extname(candidate)]||'application/octet-stream'}); res.end(body); });
}).listen(process.env.PORT || 4173, () => console.log('NLAMS demo running at http://localhost:4173'));
