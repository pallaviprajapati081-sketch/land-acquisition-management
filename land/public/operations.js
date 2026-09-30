const demoRoles = [
  ['Central Ministry', 'central@gov.in'],
  ['State Government', 'state@gov.in'],
  ['District Administration', 'district@gov.in'],
  ['Land Acquisition Officer', 'officer@gov.in'],
  ['Project Implementing Agency', 'agency@gov.in'],
  ['Field Officer', 'field@gov.in'],
  ['Administrator', 'admin@gov.in']
];
const readStore = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(`nlams-${key}`)) || fallback; }
  catch { return fallback; }
};
const writeStore = (key, value) => localStorage.setItem(`nlams-${key}`, JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateToday = () => new Date().toISOString().slice(0, 10);
const projectName = id => db.projects.find(project => project.id === id)?.name || 'Unlinked record';
const fmtArea = value => `${num(value)} ha`;
function restoreLocalRecords(data, stats) {
  data.projects.push(...readStore('projects'));
  data.parcels.push(...readStore('parcels'));
  data.landRecords.push(...readStore('landRecords'));
  stats.projects=data.projects.length;
  stats.parcels=data.parcels.length;
  stats.requiredArea=+data.projects.reduce((total,item)=>total+item.requiredArea,0).toFixed(2);
  stats.acquiredArea=+data.projects.reduce((total,item)=>total+item.acquiredArea,0).toFixed(2);
  stats.statusBreakdown=Object.fromEntries([...new Set(data.parcels.map(item=>item.acquisitionStatus))].map(status=>[status,data.parcels.filter(item=>item.acquisitionStatus===status).length]));
}

function loginPage() {
  return `<main class="login-screen"><section class="login-panel"><div class="login-brand"><div class="login-emblem">NL</div><div><b>Government of India</b><small>LAND ACQUISITION & MANAGEMENT</small></div></div><div class="eyebrow">SMART INDIA HACKATHON 2026 · SIH26016</div><h1>National Land Acquisition &amp; Management System</h1><p class="login-subtitle">Real-Time Digital Monitoring &amp; Decision Support Platform</p><form id="loginForm"><label>Demo role<select name="role" id="loginRole">${demoRoles.map(([role])=>`<option>${role}</option>`).join('')}</select></label><label>Official email<input name="email" id="loginEmail" type="email" value="central@gov.in" required autocomplete="username"/></label><label>Password<input name="password" type="password" value="demo123" required autocomplete="current-password"/></label><p id="loginError" class="form-error" role="alert"></p><button class="button primary full" type="submit">Sign in to demo portal</button></form><div class="demo-credentials"><b>Presentation access</b><span>Choose any role · password <code>demo123</code></span><small>All accounts and records are synthetic demo data.</small></div></section><aside class="login-aside"><div class="login-aside-inner"><span class="eyebrow">NATIONAL OPERATIONS · DEMO MODE</span><h2>One connected view of the acquisition lifecycle.</h2><p>Monitor project progress, parcel verification, compensation, possession and family resettlement from proposal through completion.</p><div class="login-flow">${['Proposal','Survey','Notification','Award','Compensation','Possession','R&R'].map((stage,index)=>`<span class="${index<3?'done':''}">${stage}</span>`).join('')}</div><div class="login-disclaimer">Prototype for Smart India Hackathon 2026<br/>All information shown is synthetic and is not authoritative government data.</div></div></aside></main>`;
}
function bindLogin() {
  const form = document.querySelector('#loginForm');
  if (!form) return;
  const roleSelect = document.querySelector('#loginRole');
  const email = document.querySelector('#loginEmail');
  roleSelect.onchange = () => { email.value = demoRoles.find(([role]) => role === roleSelect.value)[1]; };
  form.onsubmit = event => {
    event.preventDefault();
    const role = roleSelect.value;
    const record = demoRoles.find(item => item[0] === role);
    if (form.elements.password.value !== 'demo123' || email.value.trim().toLowerCase() !== record[1]) {
      document.querySelector('#loginError').textContent = 'Use the displayed demo email for this role and password demo123.';
      return;
    }
    sessionStorage.setItem('nlamsSession', JSON.stringify({role, email: record[1]}));
    current = 'dashboard';
    render();
  };
}

const workflowStages = ['Project proposal','Document submission','Initial scrutiny','Land survey','Verification','Approval','Notification','Objection / claims','Award','Compensation assessment','Compensation disbursement','Possession','Rehabilitation & resettlement','Project completion'];
function workflowPage() {
  const statusFor = index => index < 3 ? 'Completed' : index === 3 ? 'In progress' : index < 8 ? 'Pending' : 'In progress';
  const stages = workflowStages.map((stage,index) => {
    const related = db.cases.filter(item => index < 4 ? index === 0 || item.stage.toLowerCase().includes(['','document','scrutiny','survey'][index]) : item.stage.toLowerCase().includes(stage.split(' ')[0].toLowerCase()));
    const delayed = related.filter(item => item.overdueDays > 0).length;
    const state = statusFor(index);
    return `<article class="workflow-card"><div class="workflow-index">${String(index+1).padStart(2,'0')}</div><div class="workflow-info"><div class="workflow-heading"><h2>${stage}</h2>${badge(state,state==='Completed'?'good':state==='Pending'?'warn':'')}</div><p>${related.length ? `${related.length} linked cases` : 'Stage-level queue awaits linked cases'} · ${delayed} overdue</p><div class="workflow-meta"><span>Responsible authority</span><b>${index<4?'District Acquisition Office':index<9?'State Nodal Authority':'Project Implementing Agency'}</b></div></div><button class="button quiet" data-page="${index<4?'cases':index<9?'projects':'compensation'}">View records</button></article>`;
  }).join('');
  return shell(`${title('End-to-end process','Acquisition workflow',`<span class="env">14 STAGES · LIVE DEMO DATA</span>`)}<div class="notice">Stage totals are calculated from synthetic case records. This prototype does not advance a legal or administrative workflow.</div><div class="workflow-list">${stages}</div>`,'Acquisition workflow');
}

function fieldPage() {
  const submissions = readStore('verifications');
  return shell(`${title('Mobile operations','Field verification',`<span class="env">${submissions.length} LOCAL SUBMISSIONS</span>`)}<div class="notice">Use synthetic parcel records only. GPS and photo details are saved in this browser for demonstration; no device location or files are uploaded.</div><div class="field-layout"><article class="card"><div class="card-head"><div><h2>New verification</h2><span class="muted">Field submission · synthetic data only</span></div></div><form id="verificationForm" class="ops-form"><label>Project<select name="projectId" id="verificationProject" required>${db.projects.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.district)}</option>`).join('')}</select></label><label>Parcel<select name="parcelId" id="verificationParcel" required></select></label><div class="form-columns"><label>Survey / Khasra no.<input name="surveyNo" required/></label><label>Village<input name="village" required/></label><label>Land area (ha)<input name="area" type="number" step="0.01" min="0.01" required/></label><label>Land type<select name="landType"><option>Agricultural</option><option>Residential</option><option>Commercial</option><option>Forest</option><option>Government</option><option>Industrial</option></select></label><label>GPS coordinates<input name="coordinates" placeholder="Latitude, longitude" pattern="-?[0-9.]+,\\s*-?[0-9.]+" required/></label><label>Owner verification<select name="ownerStatus"><option>Verified</option><option>Pending</option><option>Mismatch identified</option></select></label><label>Document verification<select name="documentStatus"><option>Verified</option><option>Pending</option><option>Mismatch identified</option></select></label><label>Site condition<select name="siteCondition"><option>As described</option><option>Occupied</option><option>Access restricted</option><option>Disputed boundary</option></select></label></div><label>Photo reference<input name="photo" type="file" accept="image/*"/><small class="muted">File name only is retained; no file is uploaded.</small></label><label>Remarks<textarea name="remarks" rows="3" maxlength="500" placeholder="Field observations"></textarea></label><div class="form-actions"><button class="button" type="button" data-verification="Draft">Save draft</button><button class="button primary" type="submit">Submit verification</button></div></form></article><article class="card"><div class="card-head"><div><h2>Submission register</h2><span class="muted">Browser-local field entries</span></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Reference</th><th>Project / parcel</th><th>Submitted</th><th>Status</th></tr></thead><tbody>${submissions.slice().reverse().map(item=>`<tr><td><strong>${esc(item.id)}</strong><small>${esc(item.village)} · ${esc(item.surveyNo)}</small></td><td>${esc(projectName(item.projectId))}<small>${esc(item.parcelId)}</small></td><td>${esc(item.createdAt)}</td><td>${badge(esc(item.status),item.status==='Submitted'?'good':'warn')}</td></tr>`).join('') || '<tr><td colspan="4" class="empty-row">No field submissions saved in this browser.</td></tr>'}</tbody></table></div></article></div>`,'Field verification');
}

function riskRecords() {
  return db.projects.map(project => {
    const cases = db.cases.filter(item => item.projectId === project.id);
    const caseIds = new Set(cases.map(item => item.id));
    const overdue = cases.reduce((max,item)=>Math.max(max,item.overdueDays||0),0);
    const pendingPayments = db.compensation.filter(item=>caseIds.has(item.caseId)&&['Pending','Processing','Failed'].includes(item.paymentStatus)).length;
    const parcels = db.parcels.filter(item=>item.projectId===project.id);
    const possessionPending = parcels.filter(item=>item.possessionStatus!=='Completed').length;
    const documents = db.documents.filter(item=>caseIds.has(item.caseId));
    const missingDocs = documents.filter(item=>item.status.toLowerCase().includes('pending')).length;
    const families = db.families.filter(item=>item.projectId===project.id);
    const rrCompletion = families.length ? Math.round(families.filter(item=>item.status.toLowerCase().includes('completed')||item.status.toLowerCase().includes('resettled')).length/families.length*100) : 100;
    const factors=[]; let score=0;
    if(overdue>90){score+=4;factors.push(`${overdue} days overdue`)}else if(overdue>0){score+=2;factors.push(`${overdue} days overdue`)}
    if(pendingPayments>0){score+=pendingPayments>3?3:1;factors.push(`${pendingPayments} compensation actions pending`)}
    if(possessionPending>Math.ceil(parcels.length*.6)){score+=2;factors.push(`${possessionPending} parcels awaiting possession`)}
    if(rrCompletion<50&&project.progress>55){score+=3;factors.push(`R&R completion ${rrCompletion}%`)}
    if(missingDocs){score+=1;factors.push(`${missingDocs} documents awaiting review`)}
    const level=score>=7?'Critical':score>=5?'High':score>=3?'Medium':'Low';
    return {project,level,score,overdue,pendingPayments,possessionPending,rrCompletion,factors,attention:level==='Critical'?'Immediate district and state review':level==='High'?'Escalate to state nodal officer':level==='Medium'?'Review at next monthly monitoring':'Continue routine monitoring'};
  }).sort((a,b)=>b.score-a.score);
}
function riskPage() {
  const risks=riskRecords();
  return shell(`${title('Decision support','Project risk monitoring',`<span class="env">TRANSPARENT RULE-BASED SCORING</span>`)}<div class="notice">Risk scores are explanatory prototype rules, not a predictive ML model. High risk: delay &gt; 90 days; multiple pending factors increase priority. Every factor is shown per project.</div><div class="metrics">${metric('Critical',num(risks.filter(x=>x.level==='Critical').length),'Multiple elevated factors')}${metric('High risk',num(risks.filter(x=>x.level==='High').length),'Requires escalation')}${metric('Overdue cases',num(db.cases.filter(x=>x.overdueDays>0).length),'Derived from case SLAs')}${metric('Pending payment records',num(db.compensation.filter(x=>['Pending','Processing','Failed'].includes(x.paymentStatus)).length),'Connected compensation records')}</div><article class="card table-wrap"><table class="table"><thead><tr><th>Project</th><th>Risk</th><th>Risk factors</th><th>Delay</th><th>Pending actions</th><th>Suggested attention</th></tr></thead><tbody>${risks.filter(item=>item.score>0).slice(0,35).map(item=>`<tr><td><strong>${esc(item.project.name)}</strong><small>${esc(item.project.state)} · ${esc(item.project.district)}</small></td><td>${badge(item.level,item.level==='Critical'||item.level==='High'?'red':item.level==='Medium'?'warn':'good')}</td><td>${item.factors.map(esc).join('<br/>')||'No elevated factors'}</td><td>${item.overdue?`${num(item.overdue)} days`:'—'}</td><td>${item.pendingPayments+item.possessionPending}</td><td>${esc(item.attention)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty-row">No elevated risk factors in this dataset.</td></tr>'}</tbody></table></article>`,'Risk monitoring');
}

function alertRecords() {
  const records=db.notifications.map(item=>{
    const linked=db.cases.find(c=>c.id===item.caseId);
    return {id:item.id,project:linked?.project||item.caseId,type:item.message,priority:item.severity==='critical'?'High':item.severity==='warning'?'Medium':'Low',created:item.date,due:linked?.overdueDays?`${linked.overdueDays}d overdue`:'Within SLA',status:readStore('alertState',{})[item.id]||(item.read?'Read':'Unread')};
  });
  db.cases.filter(item=>item.issue||item.overdueDays>0).forEach(item=>records.push({id:`SLA-${item.id}`,project:item.project,type:item.issue||'Timeline exceeded',priority:item.overdueDays>90?'Critical':'High',created:item.createdAt,due:`${item.overdueDays} days overdue`,status:readStore('alertState',{})[`SLA-${item.id}`]||'Open'}));
  db.compensation.filter(item=>item.paymentStatus==='Pending').slice(0,25).forEach(item=>records.push({id:`PAY-${item.id}`,project:item.beneficiary,type:'Compensation pending',priority:'Medium',created:item.paymentDate||dateToday(),due:'Action required',status:readStore('alertState',{})[`PAY-${item.id}`]||'Open'}));
  return records;
}
function alertsPage() {
  const items=alertRecords();
  return shell(`${title('Operational exceptions','Alerts & notifications',`<span class="env">${items.filter(item=>item.status==='Unread'||item.status==='Open').length} ACTIONABLE</span>`)}<div class="filters"><select class="select" id="alertFilter"><option value="">All priorities and statuses</option><option>Critical</option><option>High</option><option>Medium</option><option>Unread</option><option>Open</option></select><button class="button" id="markAllRead">Mark all read</button></div><article class="card table-wrap"><table class="table"><thead><tr><th>Alert</th><th>Project / record</th><th>Type</th><th>Priority</th><th>Created</th><th>Due</th><th>Status / action</th></tr></thead><tbody id="alertRows">${alertRows(items)}</tbody></table></article>`,'Alerts');
}
function alertRows(items) {
  return items.map(item=>`<tr><td><strong>${esc(item.id)}</strong></td><td>${esc(item.project)}</td><td>${esc(item.type)}</td><td>${badge(esc(item.priority),item.priority==='Critical'||item.priority==='High'?'red':item.priority==='Medium'?'warn':'')}</td><td>${esc(item.created)}</td><td>${esc(item.due)}</td><td>${badge(esc(item.status),item.status==='Open'||item.status==='Unread'?'warn':'good')} <button class="button mini-button" data-alert-id="${esc(item.id)}">${item.status==='Open'?'Resolve':'Mark read'}</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty-row">No alerts match this filter.</td></tr>';
}

function reportRows(type, state='', query='') {
  let projects=db.projects.filter(item=>(!state||item.state===state)&&(!query||`${item.name} ${item.district} ${item.id}`.toLowerCase().includes(query.toLowerCase())));
  if(type==='Delayed projects') projects=projects.filter(project=>db.cases.some(item=>item.projectId===project.id&&item.overdueDays>0));
  if(type==='Compensation position') return db.compensation.filter(item=>projects.some(project=>db.cases.some(c=>c.projectId===project.id&&c.id===item.caseId))).slice(0,250).map(item=>[item.id,item.beneficiary,item.caseId,item.assessmentAmount,item.awardAmount,item.paymentStatus]);
  if(type==='R&R progress') return db.families.filter(item=>projects.some(project=>project.id===item.projectId)).map(item=>[item.id,projectName(item.projectId),item.caseId,item.members,item.status]);
  return projects.map(item=>[item.id,item.name,item.state,item.district,item.type,item.requiredArea,item.acquiredArea,item.progress,item.stage]);
}
function reportsPage() {
  const states=[...new Set(db.projects.map(item=>item.state))].sort();
  return shell(`${title('Monitoring information system','Reports & MIS',`<button class="button" id="printReport">Print report</button>`)}<div class="notice">Reports are generated from the active synthetic dataset. Choose a report and filters, then export the visible result as CSV.</div><article class="card report-controls"><label>Report type<select class="select" id="reportType"><option>Project progress</option><option>Delayed projects</option><option>Compensation position</option><option>R&amp;R progress</option></select></label><label>State<select class="select" id="reportState"><option value="">All states</option>${states.map(item=>`<option>${esc(item)}</option>`).join('')}</select></label><label>Search<input class="select" id="reportQuery" placeholder="Project, district or ID"/></label><button class="button primary" id="generateReport">Generate report</button><button class="button" id="exportReport">Export CSV</button></article><div id="reportSummary" class="report-summary"></div><article class="card table-wrap"><table class="table"><thead id="reportHead"></thead><tbody id="reportBody"></tbody></table></article>`,'Reports & MIS');
}
function renderReport() {
  const type=document.querySelector('#reportType').value;
  const rows=reportRows(type,document.querySelector('#reportState').value,document.querySelector('#reportQuery').value);
  const headers=type==='Compensation position'?['Record','Beneficiary','Case','Assessed amount','Award amount','Payment status']:type==='R&R progress'?['Family reference','Project','Case','Members','Status']:['Project ID','Project','State','District','Project type','Required ha','Acquired ha','Progress','Current stage'];
  document.querySelector('#reportHead').innerHTML=`<tr>${headers.map(head=>`<th>${head}</th>`).join('')}</tr>`;
  document.querySelector('#reportBody').innerHTML=rows.map(row=>`<tr>${row.map((cell,index)=>`<td>${index===0?`<strong>${esc(cell)}</strong>`:esc(cell)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${headers.length}" class="empty-row">No records match the selected filters.</td></tr>`;
  document.querySelector('#reportSummary').innerHTML=`<div class="report-chip"><b>${num(rows.length)}</b><span>records</span></div><div class="report-chip"><b>${esc(type)}</b><span>generated ${dateToday()}</span></div>`;
  window.currentReport={headers,rows};
}

function auditPage() {
  const entries=db.audits.slice().reverse().slice(0,120);
  return shell(`${title('Traceability','Audit trail',`<span class="env">${num(db.audits.length)} SEEDED EVENTS</span>`)}<div class="notice">Seeded audit events are synthetic. Browser-local changes appear in the active session only and are not a protected or tamper-proof audit log.</div><article class="card table-wrap"><table class="table"><thead><tr><th>Timestamp</th><th>User / role</th><th>Action</th><th>Module</th><th>Record</th><th>Source</th></tr></thead><tbody>${entries.map(item=>{const linked=db.cases.find(c=>c.id===item.caseId);return `<tr><td>${esc(item.date)}</td><td><strong>${esc(item.actor)}</strong><small>Demo account</small></td><td>${esc(item.event)}</td><td>Acquisition workflow</td><td>${esc(item.caseId)}</td><td>Browser demo · synthetic</td></tr>`}).join('')}</tbody></table></article>`,'Audit trail');
}

function adminPage() {
  const users=readStore('users',demoRoles.map(([role,email],index)=>({id:`USR-${String(index+1).padStart(3,'0')}`,role,email,name:role,active:true})));
  return shell(`${title('Platform configuration','Administration',`<span class="env">LOCAL DEMO SETTINGS</span>`)}<div class="notice">Changes on this page are stored in this browser only. This prototype has no server-side identity, access-control, or configuration service.</div><div class="admin-layout"><article class="card"><div class="card-head"><div><h2>Demo users</h2><span class="muted">Manage presentation identities</span></div></div><form class="ops-form inline-form" id="userForm"><label>Display name<input name="name" required maxlength="80"/></label><label>Email<input name="email" type="email" required/></label><label>Role<select name="role">${demoRoles.map(([role])=>`<option>${role}</option>`).join('')}</select></label><button class="button primary" type="submit">Add user</button></form><div class="table-wrap"><table class="table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>${users.map(user=>`<tr><td><strong>${esc(user.name)}</strong><small>${esc(user.email)}</small></td><td>${esc(user.role)}</td><td>${badge(user.active?'Active':'Inactive',user.active?'good':'warn')}</td><td><button class="button mini-button" data-user-toggle="${esc(user.id)}">${user.active?'Deactivate':'Activate'}</button></td></tr>`).join('')}</tbody></table></div></article><article class="card"><div class="card-head"><div><h2>Workflow configuration</h2><span class="muted">Reference stages · 14 configured</span></div></div>${workflowStages.map((stage,index)=>`<div class="config-row"><span>${String(index+1).padStart(2,'0')}</span><b>${esc(stage)}</b><small>${index<4?'District Administration':index<9?'State Government':'Implementing Agency'}</small></div>`).join('')}</article></div>`,'Administration');
}

function projectDetail() {
  const project=db.projects.find(item=>item.id===window.selectedProjectId)||db.projects[0];
  const cases=db.cases.filter(item=>item.projectId===project.id);
  const parcels=db.parcels.filter(item=>item.projectId===project.id);
  const caseIds=new Set(cases.map(item=>item.id));
  const payments=db.compensation.filter(item=>caseIds.has(item.caseId));
  return shell(`${title('Project record',esc(project.name),`<button class="button" data-page="projects">Back to projects</button>`)}<div class="notice">${esc(project.id)} · ${esc(project.state)} / ${esc(project.district)} · Synthetic portfolio record</div><div class="project-detail-grid"><article class="card project-overview"><div class="card-head"><div><h2>Project overview</h2><span class="muted">${esc(project.type)} · ${esc(project.ministry)}</span></div>${badge(esc(project.stage))}</div><div class="detail-metrics"><div><small>Required land</small><b>${fmtArea(project.requiredArea)}</b></div><div><small>Acquired land</small><b>${fmtArea(project.acquiredArea)}</b></div><div><small>Acquisition progress</small><b>${project.progress}%</b></div><div><small>Parcel records</small><b>${num(parcels.length)}</b></div><div><small>Affected families</small><b>${num(project.affectedFamilies)}</b></div><div><small>Compensation awards</small><b>${money(project.compensationAmount)}</b></div></div><div class="bar"><i style="width:${project.progress}%"></i></div><div class="project-actions"><button class="button" data-project-map="${project.id}">Locate on GIS</button><button class="button" data-project-cases="${project.id}">View workflow cases (${cases.length})</button></div></article><article class="card"><div class="card-head"><div><h2>Lifecycle timeline</h2><span class="muted">Current stage: ${esc(project.stage)}</span></div></div><div class="detail-timeline">${[...cases].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).slice(0,7).map((item,index)=>`<div class="timeline-entry"><i class="${item.overdueDays?'alert-dot':''}"></i><div><b>${esc(item.stage)}</b><small>${esc(item.createdAt)} · ${esc(item.id)}</small></div>${badge(item.overdueDays?`${item.overdueDays}d overdue`:'Recorded',item.overdueDays?'red':'good')}</div>`).join('')||'<p class="muted">No linked workflow cases.</p>'}</div></article><article class="card"><div class="card-head"><div><h2>Parcel register</h2><span class="muted">${parcels.length} linked records</span></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Parcel</th><th>Village</th><th>Area</th><th>Acquisition</th></tr></thead><tbody>${parcels.slice(0,12).map(item=>`<tr><td><strong>${esc(item.id)}</strong><small>Survey ${esc(item.surveyNo)}</small></td><td>${esc(item.village)}</td><td>${esc(item.area)} ha</td><td>${badge(esc(item.acquisitionStatus))}</td></tr>`).join('')}</tbody></table></div></article><article class="card"><div class="card-head"><div><h2>Compensation position</h2><span class="muted">Linked award records</span></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Beneficiary</th><th>Award amount</th><th>Payment status</th></tr></thead><tbody>${payments.slice(0,12).map(item=>`<tr><td>${esc(item.beneficiary)}</td><td>${money(item.awardAmount)}</td><td>${badge(esc(item.paymentStatus),item.paymentStatus==='Paid'?'good':'warn')}</td></tr>`).join('')}</tbody></table></div></article></div>`,'Project details');
}

function architecturePage() {
  const layers=[['Users & roles','Seven demo personas enter through a browser-local role selector. Identity is illustrative only.'],['Web application','Responsive single-page interface with client-side page routing and interactive SVG analytics.'],['Node.js demo API','Local HTTP service provides synthetic project, parcel, case, and aggregate records.'],['Operational views','Workflow queues, field form, alerts, reports and transparent rule-based risk scoring.'],['JSON dataset','Generated seed data connects projects, parcels, beneficiaries, compensation, documents and audit events.']];
  return shell(`${title('SIH judge briefing','System architecture',`<span class="env">DEMO PROTOTYPE</span>`)}<div class="notice">This workspace currently runs a dependency-free browser frontend and Node.js API. It does not implement the requested React, FastAPI, PostgreSQL, JWT, or production RBAC stack.</div><div class="architecture-flow">${layers.map((item,index)=>`<article class="card architecture-layer"><span class="workflow-index">0${index+1}</span><div><h2>${esc(item[0])}</h2><p>${esc(item[1])}</p></div></article>`).join('<div class="architecture-arrow" aria-hidden="true">↓</div>')}</div><div class="card integration-note"><h2>External connections</h2><p>Land records, cadastral boundaries, payment rails, and government portals are not connected. All maps and records in this prototype are synthetic.</p></div>`,'System architecture');
}

function bindOperations() {
  const session=JSON.parse(sessionStorage.getItem('nlamsSession')||'{}');
  const top=document.querySelector('.top > div:last-child');
  if(top&&!top.querySelector('.top-actions')) {
    const actions=document.createElement('div');
    actions.className='top-actions';
    const unread=alertRecords().filter(item=>item.status==='Unread'||item.status==='Open').length;
    actions.innerHTML=`<label class="global-search-label"><span class="sr-only">Search across projects, parcels and documents</span><input id="globalSearch" type="search" placeholder="Search projects, parcels…" autocomplete="off"/></label><button class="top-icon" id="notificationButton" aria-label="Open alerts">♧<i>${unread}</i></button><span class="role-chip">${esc(session.role||'Demo')}</span><button class="top-icon logout-button" id="logoutButton">Sign out</button><div id="globalResults" class="global-results" hidden></div>`;
    top.replaceChildren(actions);
  }
  const search=document.querySelector('#globalSearch');
  if(search) search.oninput=()=>{
    const query=search.value.trim().toLowerCase(), panel=document.querySelector('#globalResults');
    if(query.length<2){panel.hidden=true;return;}
    const results=[
      ...db.projects.filter(item=>`${item.name} ${item.id} ${item.district} ${item.state}`.toLowerCase().includes(query)).slice(0,5).map(item=>({type:'Project',label:item.name,meta:`${item.id} · ${item.district}, ${item.state}`,id:item.id,page:'project'})),
      ...db.parcels.filter(item=>`${item.id} ${item.surveyNo} ${item.village} ${item.owner}`.toLowerCase().includes(query)).slice(0,4).map(item=>({type:'Parcel',label:item.id,meta:`Survey ${item.surveyNo} · ${item.village}`,id:item.id,projectId:item.projectId,page:'map'})),
      ...db.documents.filter(item=>`${item.title} ${item.id}`.toLowerCase().includes(query)).slice(0,3).map(item=>({type:'Document',label:item.title,meta:item.id,id:item.id,page:'documents'}))
    ];
    panel.innerHTML=results.length?results.map(item=>`<button class="search-result" data-search-page="${item.page}" data-search-id="${esc(item.id)}"><b>${esc(item.type)}</b><span>${esc(item.label)}</span><small>${esc(item.meta)}</small></button>`).join(''):'<div class="search-empty">No matching records</div>';
    panel.hidden=false;
    panel.querySelectorAll('[data-search-page]').forEach(button=>button.onclick=()=>{current=button.dataset.searchPage;if(current==='project')window.selectedProjectId=button.dataset.searchId;else if(button.dataset.searchPage==='map'){const parcel=db.parcels.find(item=>item.id===button.dataset.searchId);gis.projectId=parcel?.projectId;gis.parcelId=parcel?.id;}render()});
  };
  document.querySelector('#logoutButton')?.addEventListener('click',()=>{sessionStorage.removeItem('nlamsSession');current='dashboard';render()});
  document.querySelector('#notificationButton')?.addEventListener('click',()=>{current='alerts';render()});
  document.querySelector('.title-row .button')?.addEventListener('click',event=>{if(event.currentTarget.textContent.includes('New demo project'))openRecordDialog('project')});
  if(current==='parcels'&&!document.querySelector('#addParcelButton')) {
    const button=document.createElement('button');button.className='button';button.id='addParcelButton';button.textContent='Add demo parcel';
    document.querySelector('.title-row')?.append(button);button.addEventListener('click',()=>openRecordDialog('parcel'));
  }
  document.querySelectorAll('#projectRows tr').forEach((row,index)=>{
    row.classList.add('clickable-row');
    row.querySelector('td:last-child')?.addEventListener('click',event=>{event.preventDefault();window.selectedProjectId=db.projects.filter(project=>!document.querySelector('#stateFilter')?.value||project.state===document.querySelector('#stateFilter').value)[index]?.id||db.projects[index]?.id;current='project';render()});
  });
  document.querySelector('#verificationProject')?.addEventListener('change',populateParcelOptions);
  if(document.querySelector('#verificationParcel')) populateParcelOptions();
  document.querySelector('#verificationParcel')?.addEventListener('change',()=>{
    const parcel=db.parcels.find(item=>item.id===document.querySelector('#verificationParcel').value);
    if(!parcel)return;
    const form=document.querySelector('#verificationForm');
    form.elements.surveyNo.value=parcel.surveyNo;form.elements.village.value=parcel.village;form.elements.area.value=parcel.area;form.elements.landType.value=parcel.landType;
    form.elements.coordinates.value=`${parcel.lat}, ${parcel.lng}`;
  });
  document.querySelectorAll('[data-verification]').forEach(button=>button.addEventListener('click',()=>saveVerification(button.dataset.verification)));
  document.querySelector('#verificationForm')?.addEventListener('submit',event=>{event.preventDefault();saveVerification('Submitted')});
  document.querySelector('#alertFilter')?.addEventListener('change',filterAlerts);
  document.querySelectorAll('[data-alert-id]').forEach(button=>button.addEventListener('click',()=>{
    const state=readStore('alertState',{}), id=button.dataset.alertId;
    state[id]=button.textContent==='Resolve'?'Resolved':'Read';writeStore('alertState',state);render();
  }));
  document.querySelector('#markAllRead')?.addEventListener('click',()=>{const state=readStore('alertState',{});alertRecords().forEach(item=>state[item.id]='Read');writeStore('alertState',state);render()});
  document.querySelector('#generateReport')?.addEventListener('click',renderReport);
  document.querySelector('#exportReport')?.addEventListener('click',()=>{
    renderReport();const report=window.currentReport;if(!report)return;
    const csv=[report.headers,...report.rows].map(row=>row.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    downloadText(`nlams-${document.querySelector('#reportType').value.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.csv`,csv,'text/csv');
  });
  document.querySelector('#printReport')?.addEventListener('click',()=>window.print());
  document.querySelector('#userForm')?.addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget,users=readStore('users',demoRoles.map(([role,email],index)=>({id:`USR-${String(index+1).padStart(3,'0')}`,role,email,name:role,active:true})));
    if(users.some(item=>item.email.toLowerCase()===form.elements.email.value.trim().toLowerCase())){toast('That demo email is already registered.');return;}
    users.push({id:`USR-${Date.now()}`,name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),role:form.elements.role.value,active:true});writeStore('users',users);render();
  });
  document.querySelectorAll('[data-user-toggle]').forEach(button=>button.addEventListener('click',()=>{
    const users=readStore('users',[]);const user=users.find(item=>item.id===button.dataset.userToggle);if(user)user.active=!user.active;writeStore('users',users);render();
  }));
  document.querySelector('[data-project-map]')?.addEventListener('click',()=>{gis.projectId=window.selectedProjectId;gis.parcelId=null;current='map';render()});
  document.querySelector('[data-project-cases]')?.addEventListener('click',()=>{current='cases';render()});
}
function openRecordDialog(type) {
  document.querySelector('#demoRecordDialog')?.remove();
  const isProject=type==='project';
  const projectOptions=db.projects.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
  const stateOptions=[...new Set(db.states.map(item=>item.name))].map(item=>`<option>${esc(item)}</option>`).join('');
  const dialog=document.createElement('div');dialog.className='ops-modal-backdrop';dialog.id='demoRecordDialog';
  dialog.innerHTML=`<section class="ops-modal" role="dialog" aria-modal="true" aria-labelledby="recordDialogTitle"><div class="card-head"><div><h2 id="recordDialogTitle">${isProject?'Create demo project':'Register demo parcel'}</h2><span class="muted">Synthetic record · saved in this browser</span></div><button type="button" class="top-icon" data-close-dialog aria-label="Close">×</button></div><form class="ops-form" id="recordForm">${isProject?`<label>Project name<input name="name" required maxlength="120"/></label><div class="form-columns"><label>State<select name="state">${stateOptions}</select></label><label>District<input name="district" required maxlength="80"/></label></div><div class="form-columns"><label>Project type<select name="type"><option>Highway</option><option>Railway</option><option>Industrial Corridor</option><option>Irrigation</option><option>Renewable Energy</option><option>Urban Development</option><option>Airport</option><option>Other Infrastructure</option></select></label><label>Required area (ha)<input name="requiredArea" type="number" min="0.01" step="0.01" required/></label></div><label>Target date<input name="targetDate" type="date" required/></label>`:`<label>Project<select name="projectId">${projectOptions}</select></label><div class="form-columns"><label>Survey / Khasra number<input name="surveyNo" required maxlength="40"/></label><label>Village<input name="village" required maxlength="80"/></label></div><div class="form-columns"><label>Area (ha)<input name="area" type="number" min="0.01" step="0.01" required/></label><label>Land type<select name="landType"><option>Agricultural</option><option>Residential</option><option>Commercial</option><option>Forest</option><option>Government</option><option>Industrial</option></select></label></div><label>Owner reference<input name="owner" required maxlength="80" value="Synthetic Demo Owner"/></label>`}<div class="form-actions"><button type="button" class="button" data-close-dialog>Cancel</button><button type="submit" class="button primary">Save demo record</button></div></form></section>`;
  document.body.append(dialog);
  dialog.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>dialog.remove()));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.remove()});
  dialog.querySelector('#recordForm').addEventListener('submit',event=>{event.preventDefault();const form=new FormData(event.currentTarget);if(isProject)saveProject(form);else saveParcel(form);dialog.remove();render();toast(`${isProject?'Project':'Parcel'} saved as a local demo record.`)});
}
function saveProject(form) {
  const state=db.states.find(item=>item.name===form.get('state'))||db.states[0],id=`DEMO-PRJ-${Date.now()}`,district=form.get('district').trim();
  const project={id,name:form.get('name').trim(),type:form.get('type'),ministry:'Ministry of Synthetic Infrastructure',agency:'Demo Implementing Agency',state:state.name,district,requiredArea:Number(form.get('requiredArea')),acquiredArea:0,parcelCount:0,affectedFamilies:0,compensationAmount:0,stage:'Proposal Submitted',startDate:dateToday(),targetDate:form.get('targetDate'),progress:0,authority:`${district} District Acquisition Office`,lat:state.lat,lng:state.lng,synthetic:true};
  db.projects.push(project);const saved=readStore('projects');saved.push(project);writeStore('projects',saved);
}
function saveParcel(form) {
  const project=db.projects.find(item=>item.id===form.get('projectId'))||db.projects[0],state=db.states.find(item=>item.name===project.state),id=`${state.code}-DEMO-${Date.now()}`,surveyNo=form.get('surveyNo').trim(),area=Number(form.get('area'));
  const parcel={id,surveyNo,state:project.state,district:project.district,taluka:`${project.district} Tehsil`,village:form.get('village').trim(),area,landType:form.get('landType'),ownershipType:'Individual',ownerId:`DEMO-OWN-${Date.now()}`,owner:form.get('owner').trim(),projectId:project.id,caseId:null,acquisitionStatus:'Proposed',compensationStatus:'Pending',rrStatus:'Verification pending',possessionStatus:'Pending',lat:project.lat,lng:project.lng,polygon:[[project.lat-.006,project.lng-.006],[project.lat-.006,project.lng+.006],[project.lat+.006,project.lng+.006],[project.lat+.006,project.lng-.006]],synthetic:true};
  const record={id:`LR-${id}`,parcelId:id,surveyNo,village:parcel.village,district:parcel.district,area,landType:parcel.landType,ownership:parcel.ownershipType,status:'Pending verification',synthetic:true};
  db.parcels.push(parcel);db.landRecords.push(record);project.parcelCount+=1;
  const parcels=readStore('parcels');parcels.push(parcel);writeStore('parcels',parcels);
  const records=readStore('landRecords');records.push(record);writeStore('landRecords',records);
}
function populateParcelOptions() {
  const projectId=document.querySelector('#verificationProject')?.value, selector=document.querySelector('#verificationParcel');
  if(!selector)return;
  selector.innerHTML=db.parcels.filter(item=>item.projectId===projectId).map(item=>`<option value="${esc(item.id)}">${esc(item.id)} · ${esc(item.village)}</option>`).join('');
}
function saveVerification(status) {
  const form=document.querySelector('#verificationForm');
  if(!form.reportValidity())return;
  const data=new FormData(form),items=readStore('verifications');
  items.push({id:`FV-${Date.now()}`,projectId:data.get('projectId'),parcelId:data.get('parcelId'),surveyNo:data.get('surveyNo'),village:data.get('village'),area:data.get('area'),landType:data.get('landType'),coordinates:data.get('coordinates'),ownerStatus:data.get('ownerStatus'),documentStatus:data.get('documentStatus'),siteCondition:data.get('siteCondition'),photoName:data.get('photo')?.name||'',remarks:data.get('remarks'),status,createdAt:dateToday()});
  writeStore('verifications',items);render();toast(`Verification ${status.toLowerCase()} in this browser.`);
}
function filterAlerts() {
  const filter=document.querySelector('#alertFilter').value;
  const items=alertRecords().filter(item=>!filter||item.priority===filter||item.status===filter);
  document.querySelector('#alertRows').innerHTML=alertRows(items);
  document.querySelectorAll('[data-alert-id]').forEach(button=>button.addEventListener('click',()=>{const state=readStore('alertState',{});state[button.dataset.alertId]=button.textContent==='Resolve'?'Resolved':'Read';writeStore('alertState',state);filterAlerts()}));
}
function downloadText(name,contents,type) {
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([contents],{type}));link.download=name;link.click();URL.revokeObjectURL(link.href);
}
function toast(message) {
  let node=document.querySelector('.ops-toast');if(!node){node=document.createElement('div');node.className='ops-toast';node.setAttribute('role','status');document.body.append(node);}node.textContent=message;node.classList.add('visible');window.setTimeout(()=>node.classList.remove('visible'),2400);
}