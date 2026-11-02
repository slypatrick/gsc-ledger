const WS_ICONS=['layers','heart','home','briefcase','building','bank','book','graduation','globe','star','gift','cart','car','coffee','leaf','medical','music','flag','bulb','plane','wallet','users','shield','pie','spark'];
function gscCreatePdf(report){
const W=595,H=842,ML=45,RIGHT=550,MAXY=777;
 const lang=report.lang==='fr'?'fr':'en';
 const tr=(en,fr)=>lang==='fr'?fr:en;
 const dark='#153d32',green='#297752',pale='#eaf1ea',ink='#23392e',muted='#6c8073',line='#dde6dd',white='#ffffff',amber='#a77735';
 const colors=(hex)=>{let h=hex.replace('#','');return [0,2,4].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(3)).join(' ');};
 const rgb=(hex,stroke=false)=>colors(hex)+(stroke?' RG':' rg');
 let pages=[],ops=[],pageNo=0,y=0;
 function cmd(s){ops.push(s);}
 function rect(x,top,w,h,color){cmd(rgb(color)+'\n'+[x,H-top-h,w,h].join(' ')+' re f');}
 function rule(x1,top1,x2,top2,color=line,weight=.7){cmd(rgb(color,true)+'\n'+weight+' w '+x1+' '+(H-top1)+' m '+x2+' '+(H-top2)+' l S');}
 function safe(s){const extra={8216:39,8217:39,8220:34,8221:34,8211:45,8212:45,8230:46,8364:128,338:140,339:156,352:138,353:154,376:159,160:32};let out='';for(const c of String(s??'')){let v=c.codePointAt(0);v=extra[v]??v;if(v===40||v===41||v===92){out+='\\'+String.fromCharCode(v);}else if(v>126&&v<=255||v===128||v===140||v===156||v===138||v===154||v===159){out+='\\'+v.toString(8).padStart(3,'0');}else if(v>=32&&v<=126){out+=String.fromCharCode(v);}else if(v===10){out+=' ';}else if(v<32){out+=' ';}else{out+='?';}}return out;}
 function shorten(s,max){let v=String(s??'').replace(/\s+/g,' ').trim();return v.length>max?v.slice(0,Math.max(1,max-3))+'...':v;}
 function text(x,top,s,size=10,bold=false,color=ink){cmd(rgb(color)+'\nBT /'+(bold?'F2':'F1')+' '+size+' Tf 1 0 0 1 '+x+' '+(H-top-size)+' Tm ('+safe(s)+') Tj ET');}
 function rightText(x,top,s,size=10,bold=false,color=ink){let width=String(s).length*size*(bold?.54:.49);text(x-width,top,s,size,bold,color);}
 function page(heading){if(ops.length)pages.push(ops.join('\n'));ops=[];pageNo++;rect(0,0,W,88,dark);rect(ML,24,30,30,'#2d7f59');text(ML+5,32,'GSC',10,true,white);text(ML+42,24,'GSC LEDGER',16,true,white);text(ML+42,48,heading,9,false,'#c7ddcf');rightText(RIGHT,34,report.group.currency,10,true,'#cee4d4');rule(ML,800,RIGHT,800,line,.8);text(ML,807,tr('GSC Ledger | Internal report','GSC Ledger | Rapport interne'),8,false,muted);rightText(RIGHT,807,tr('Page ','Page ')+pageNo,8,false,muted);y=115;}
 function ensure(amount,heading){if(y+amount>MAXY)page(heading||tr('TRANSACTION REGISTER','REGISTRE DES OPERATIONS'));}
 function heading(s){ensure(35);text(ML,y,s,13,true,dark);y+=25;rule(ML,y,RIGHT,y,line,1);y+=15;}
 function metric(x,top,w,label,value){rect(x,top,w,89,pale);text(x+13,top+13,label,9,false,muted);text(x+13,top+39,value,value.length>19?12:value.length>16?14:18,true,dark);}
 function money(c){const n=(Number(c)||0)/100;return new Intl.NumberFormat(lang==='fr'?'fr-FR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' '+report.group.currency;}
 const expense=report.expenses;
 const counts={},totals={};
 for(const s of ['paid','approved','pending','rejected','draft']){counts[s]=0;totals[s]=0;}
 const cat=new Map();
 for(const e of expense){counts[e.status]=(counts[e.status]||0)+1;totals[e.status]=(totals[e.status]||0)+e.amount_cents;if(e.status==='paid')cat.set(e.category,(cat.get(e.category)||0)+e.amount_cents);}
 const paid=totals.paid,allPaid=counts.paid,rows=[...cat.entries()].sort((a,b)=>b[1]-a[1]),selected=rows.slice(0,7);
 if(rows.length>7)selected.push([tr('Other categories','Autres categories'),rows.slice(7).reduce((s,x)=>s+x[1],0)]);
 page(tr('FINANCIAL REPORT','RAPPORT FINANCIER'));
 text(ML,y,report.group.name,21,true,dark);y+=33;
 text(ML,y,tr('Period','Periode')+': '+report.from+'  -  '+report.to,10,false,muted);y+=19;
 text(ML,y,tr('Generated','Genere le')+': '+report.generated.replace('T',' ').slice(0,16)+' UTC',9,false,muted);y+=28;
 rect(ML,y,505,37,pale);
 text(ML+12,y+10,tr('Report scope','Perimetre')+': '+(report.status==='all'?tr('All statuses','Tous les statuts'):report.status.toUpperCase()),10,true,dark);
 rightText(RIGHT-12,y+10,report.privateInfo?tr('RESTRICTED DETAILS','DONNEES CONFIDENTIELLES'):tr('STANDARD VIEW','VUE STANDARD'),8,true,green);
 y+=58;
 heading(tr('01   EXECUTIVE SUMMARY','01   SYNTHESE FINANCIERE'));
 metric(ML,y,159,tr('Confirmed spending','Depenses payees'),money(paid));
 metric(ML+171,y,159,tr('Approved / unpaid','Approuvees / non payees'),money(totals.approved));
 metric(ML+342,y,163,tr('Pending review','En attente de validation'),money(totals.pending));
 y+=106;
 text(ML,y,tr('Transactions paid','Operations payees')+': '+allPaid,9,false,muted);
 text(ML+250,y,tr('Rejected / excluded','Refusees / exclues')+': '+counts.rejected,9,false,muted);
 y+=35;
 heading(tr('02   SPENDING BY CATEGORY','02   DEPENSES PAR CATEGORIE'));
 if(!paid){text(ML,y,tr('No confirmed payments for the selected period.','Aucun paiement confirme sur la periode selectionnee.'),11,false,muted);y+=33;}
 for(const [name,value] of selected){ensure(36,tr('SPENDING BY CATEGORY','DEPENSES PAR CATEGORIE'));text(ML,y,shorten(name,34),9,false,ink);rightText(RIGHT,y,money(value),9,true,ink);y+=16;rect(ML,y,505,7,pale);rect(ML,y,Math.max(2,505*value/paid),7,green);y+=24;}
 y+=16;
 heading(tr('03   FINANCIAL CONTROL','03   CONTROLE FINANCIER'));
 const controlRows=[[tr('Paid and included in spending','Payees et comptabilisees'),counts.paid,totals.paid],[tr('Approved, payment not confirmed','Approuvees, paiement non confirme'),counts.approved,totals.approved],[tr('Pending approval','En attente de validation'),counts.pending,totals.pending],[tr('Rejected (excluded)','Refusees (exclues)'),counts.rejected,totals.rejected]];
 for(let i=0;i<controlRows.length;i++){ensure(24);if(i%2===0)rect(ML,y,505,23,'#f3f7f2');text(ML+9,y+5,controlRows[i][0],9);rightText(ML+354,y+5,String(controlRows[i][1]),9,true);rightText(RIGHT-9,y+5,money(controlRows[i][2]),9,true);y+=23;}
 y+=15;ensure(55);text(ML,y,tr('Accounting note','Note comptable'),10,true,dark);y+=16;
 text(ML,y,tr('Only paid entries contribute to confirmed spending. Other stages are tracked separately.','Seules les depenses payees sont incluses. Les autres statuts sont suivis separement.'),8,false,muted);y+=15;
 text(ML,y,tr('This report is based on recorded entries; it is not a bank reconciliation.','Ce rapport reprend les ecritures saisies; il ne remplace pas un rapprochement bancaire.'),8,false,muted);

 y+=31;
 heading(tr('04   TREASURY POSITION','04   SITUATION DE TRESORERIE'));
 const ta=report.treasuryAccounts||[],funds=ta.reduce((n,a)=>n+Number(a.balance_cents||0),0);
 text(ML,y,tr('Available funds as of ','Fonds disponibles au ')+report.to,10,false,muted);y+=21;
 text(ML,y,money(funds),21,true,dark);y+=34;
 if(!ta.length){text(ML,y,tr('Treasury is not configured for this workspace.','La tresorerie n est pas configuree pour cet espace.'),10,false,muted);y+=27;}
 for(let i=0;i<ta.length;i++){ensure(26,tr('TREASURY POSITION (CONT.)','TRESORERIE (SUITE)'));if(i%2===0)rect(ML,y,505,23,'#f3f7f2');text(ML+8,y+5,shorten(ta[i].name,54),9);rightText(RIGHT-8,y+5,money(ta[i].balance_cents),9,true,dark);y+=23;}
 y+=15;
 ensure(24);text(ML,y,tr('Balances are based on recorded treasury entries through period end.','Soldes etablis selon les mouvements enregistres jusqu a la fin de periode.'),8,false,muted);

 page(tr('TRANSACTION REGISTER','REGISTRE DES OPERATIONS'));
 text(ML,y,tr('05   DETAILED TRANSACTIONS','05   DETAIL DES OPERATIONS'),14,true,dark);y+=27;
 text(ML,y,tr('Transactions within the requested date range, ordered by date.','Operations de la periode selectionnee, classees par date.'),9,false,muted);y+=24;
 function tableHead(){rect(ML,y,505,27,dark);text(ML+8,y+8,tr('DATE','DATE'),8,true,white);text(ML+79,y+8,tr('DESCRIPTION','LIBELLE'),8,true,white);text(ML+335,y+8,tr('STATUS','STATUT'),8,true,white);rightText(RIGHT-7,y+8,tr('AMOUNT','MONTANT'),8,true,white);y+=28;}
 tableHead();
 if(!expense.length){text(ML+10,y+24,tr('No transactions match the selected filters.','Aucune operation pour les filtres selectionnes.'),10,false,muted);y+=60;}
 let idx=0;
 for(const e of expense){
  const rh=report.privateInfo&&e.beneficiary?47:33;
  if(y+rh>MAXY){page(tr('TRANSACTION REGISTER (CONT.)','REGISTRE DES OPERATIONS (SUITE)'));tableHead();}
  if(idx%2===0)rect(ML,y,505,rh,'#f3f7f2');
  text(ML+8,y+7,e.expense_date,8,false,muted);
  text(ML+79,y+5,shorten(e.title,40),9,true,ink);
  text(ML+79,y+19,shorten(e.category,32),7,false,muted);
  text(ML+335,y+9,(lang==='fr'?({paid:'PAYE',approved:'APPROUVE',pending:'EN ATTENTE',rejected:'REFUSE',draft:'BROUILLON'}[e.status]||e.status):e.status.toUpperCase()),8,true,e.status==='paid'?green:amber);
  rightText(RIGHT-7,y+7,money(e.amount_cents),9,true,dark);
  if(report.privateInfo&&e.beneficiary)text(ML+79,y+33,tr('Payee: ','Beneficiaire : ')+shorten(e.beneficiary,56),8,false,muted);
  y+=rh;
  rule(ML,y,RIGHT,y,line,.4);idx++;
 }
 y+=22;
 if(y>MAXY-130)page(tr('REPORT NOTES','NOTES DU RAPPORT'));
 heading(tr('06   REPORT INFORMATION','06   INFORMATIONS DU RAPPORT'));
 text(ML,y,tr('Workspace','Espace')+': '+shorten(report.group.name,64),9);y+=17;
 text(ML,y,tr('Currency','Devise')+': '+report.group.currency,9);y+=17;
 text(ML,y,tr('Records listed','Operations listees')+': '+expense.length,9);y+=17;
 text(ML,y,tr('Report generated by an authenticated workspace member.','Rapport genere par un membre authentifie de cet espace.'),9,false,muted);y+=17;
 text(ML,y,report.privateInfo?tr('Restricted: contains recipient details. Handle securely.','Confidentiel : contient les beneficiaires. A proteger.'):tr('Sensitive recipient details are excluded from this export.','Les donnees sensibles des beneficiaires sont masquees.'),9,false,muted);
 if(ops.length)pages.push(ops.join('\n'));
 const objs=[null,'<< /Type /Catalog /Pages 2 0 R >>',null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 const kids=[];
 for(let i=0;i<pages.length;i++){const pi=5+i*2,si=pi+1;kids.push(pi+' 0 R');objs[pi]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+si+' 0 R >>';objs[si]='<< /Length '+pages[i].length+' >>\nstream\n'+pages[i]+'\nendstream';}
 objs[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>';
 let pdf='%PDF-1.4\n',offsets=[0];
 for(let i=1;i<objs.length;i++){offsets[i]=pdf.length;pdf+=i+' 0 obj\n'+objs[i]+'\nendobj\n';}
 const xref=pdf.length;pdf+='xref\n0 '+objs.length+'\n0000000000 65535 f \n';
 for(let i=1;i<objs.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 pdf+='trailer\n<< /Size '+objs.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
 const out=new Uint8Array(pdf.length);for(let i=0;i<pdf.length;i++)out[i]=pdf.charCodeAt(i)&255;
 return out;
}


const id=()=>crypto.randomUUID(),iso=()=>new Date().toISOString(),tx=(v,n=200)=>String(v??'').trim().slice(0,n);
const R=(v,s=200,h={})=>new Response(JSON.stringify(v),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...h}});
const E=(m,s=400)=>R({error:m},s),Q=(d,s,...a)=>d.prepare(s).bind(...a),one=(d,s,...a)=>Q(d,s,...a).first(),many=async(d,s,...a)=>(await Q(d,s,...a).all()).results||[];
const hex=a=>Array.from(new Uint8Array(a),v=>v.toString(16).padStart(2,'0')).join(''),rnd=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const H=async t=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)));
const P=async(t,s)=>{const encoder=new TextEncoder();let input=encoder.encode(t);for(let round=0;round<2;round++){const k=await crypto.subtle.importKey('raw',input,'PBKDF2',false,['deriveBits']);input=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(s+':'+round),iterations:100000,hash:'SHA-256'},k,256));}return hex(input);};
const eq=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return !v;};
const audit=(d,g,u,a,t,x,meta={})=>Q(d,'INSERT INTO audit(id,group_id,actor_id,action,entity_type,entity_id,detail) VALUES(?,?,?,?,?,?,?)',id(),g,u,a,t,x,JSON.stringify(meta));
const rights={viewer:1,editor:2,controller:3,owner:4},acl=async(d,u,g,r='viewer')=>{let m=await one(d,'SELECT role FROM memberships WHERE group_id=? AND user_id=?',g,u);return m&&rights[m.role]>=rights[r]?m:null;};
const cash=x=>{let a=Number(x);return Number.isFinite(a)&&a>0&&a<1e9?Math.round(a*100):null;};
const goodDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x+'T00:00:00Z'));
const read=async r=>{if(Number(r.headers.get('content-length'))>5e4)throw Error('Too large');let t=await r.text();if(t.length>5e4)throw Error('Too large');return JSON.parse(t);};
const ck=(v,max=1209600)=>'ml_session='+v+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+max;
const start=async(d,u)=>{let t=rnd();await Q(d,'INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)',await H(t),u,new Date(Date.now()+1209600000).toISOString()).run();return R({ok:true},200,{'set-cookie':ck(t)});};
const me=async(d,req)=>{let c=(req.headers.get('cookie')||'').match(/(?:^|;\s*)ml_session=([a-f0-9]{64})/);return c?one(d,'SELECT u.id,u.email,u.name FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.id=? AND s.expires_at>?',await H(c[1]),iso()):null;};
const accept=async(d,v,u)=>{let m=await one(d,'SELECT role FROM memberships WHERE group_id=? AND user_id=?',v.group_id,u);let batch=[Q(d,'UPDATE invitations SET accepted_at=CURRENT_TIMESTAMP WHERE id=?',v.id),audit(d,v.group_id,u,'invitation.accepted','membership',u,{role:v.role})];if(!m)batch.unshift(Q(d,'INSERT INTO memberships(group_id,user_id,role) VALUES(?,?,?)',v.group_id,u,v.role));await d.batch(batch);};
const advance=(v,f)=>{if(f==='once')return null;let d=new Date(v+'T12:00:00Z');if(f==='weekly')d.setUTCDate(d.getUTCDate()+7);else{let day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+(f==='quarterly'?3:1));d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));}return d.toISOString().slice(0,10);};
export default {async fetch(req,env){
const d=env.DB,u=new URL(req.url),p=u.pathname;
if(p==='/'||p==='/index.html'){let x=await one(d,"SELECT content FROM app_assets WHERE name='index'");return new Response(x?.content||'<h1>Mercy Ledger setup</h1>',{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store','x-frame-options':'DENY','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}});}

if(['/app-icon-512.png','/app-icon-192.png','/apple-touch-icon.png','/favicon.ico'].includes(p)){
const key={'/app-icon-512.png':'gsc-icon-512','/app-icon-192.png':'gsc-icon-192','/apple-touch-icon.png':'gsc-icon-180','/favicon.ico':'gsc-icon-48'}[p];
const asset=await one(d,'SELECT content FROM app_assets WHERE name=?',key);
if(!asset)return new Response('Image unavailable',{status:404});
const bin=Uint8Array.from(atob(asset.content),c=>c.charCodeAt(0));
return new Response(bin,{headers:{'content-type':'image/png','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});
}
if(p==='/manifest.webmanifest'){
const asset=await one(d,"SELECT content FROM app_assets WHERE name='gsc-manifest'");
return asset?new Response(asset.content,{headers:{'content-type':'application/manifest+json;charset=utf-8','cache-control':'public,max-age=3600','x-content-type-options':'nosniff'}}):new Response('Not found',{status:404});
}
if(!p.startsWith('/api/'))return E('Not found',404);
if(req.method==='POST'&&req.headers.get('origin')!==u.origin)return E('Forbidden origin',403);
try{
if(p==='/api/bootstrap'&&req.method==='GET'){let n=await one(d,'SELECT COUNT(*) n FROM users');return R({needsSetup:!n.n});}
if(p==='/api/invite/lookup'&&req.method==='GET'){let t=u.searchParams.get('token')||'';let x=t&&t.length<130?await one(d,'SELECT i.email,i.role,i.expires_at,i.accepted_at,g.name group_name FROM invitations i JOIN groups g ON g.id=i.group_id WHERE i.token_hash=?',await H(t)):null;return x&&!x.accepted_at&&x.expires_at>iso()?R(x):E('Invitation unavailable',404);}
if(p==='/api/auth/signup'&&req.method==='POST'){
let b=await read(req),email=tx(b.email).toLowerCase(),name=tx(b.name,80),pw=String(b.password||'');
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!name||pw.length<12||pw.length>200)return E('Use a valid email, name and password of at least 12 characters');
if(await one(d,'SELECT id FROM users WHERE email=?',email))return E('Email already registered',409);
let n=await one(d,'SELECT COUNT(*) n FROM users'),v=null;
if(!n.n){let key=await one(d,"SELECT value FROM app_settings WHERE key='setup_token'");if(!eq(String(b.setupKey||'').toUpperCase(),key?.value||''))return E('Setup key invalid',403);}
else{let t=String(b.inviteToken||'');v=t?await one(d,'SELECT * FROM invitations WHERE token_hash=? AND accepted_at IS NULL AND expires_at>?',await H(t),iso()):null;if(!v||v.email.toLowerCase()!==email)return E('Invitation required for this address',403);}
let sid=id(),salt=rnd();await Q(d,'INSERT INTO users(id,email,name,salt,password_hash) VALUES(?,?,?,?,?)',sid,email,name,salt,await P(pw,salt)).run();
if(!n.n){let gid=id();await d.batch([Q(d,'INSERT INTO groups(id,name,description,icon,color,visibility,currency,created_by) VALUES(?,?,?,?,?,?,?,?)',gid,'Mercy Ministry','Care, support and accountable giving','heart','#164b3d','private','TND',sid),Q(d,'INSERT INTO memberships(group_id,user_id,role) VALUES(?,?,?)',gid,sid,'owner'),audit(d,gid,sid,'group.created','group',gid,{name:'Mercy Ministry'}),Q(d,"DELETE FROM app_settings WHERE key='setup_token'")]);}
else await accept(d,v,sid);return start(d,sid);
}
if(p==='/api/auth/login'&&req.method==='POST'){
let b=await read(req),email=tx(b.email).toLowerCase(),v=await one(d,'SELECT * FROM login_attempts WHERE email=?',email);
if(v?.locked_until&&v.locked_until>iso())return E('Too many attempts. Try later.',429);
let account=await one(d,'SELECT * FROM users WHERE email=?',email),valid=account?eq(await P(String(b.password||''),account.salt),account.password_hash):false;
if(!valid){let n=(v?.failures||0)+1,lock=n>=5?new Date(Date.now()+900000).toISOString():null;await Q(d,'INSERT INTO login_attempts(email,failures,locked_until) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET failures=excluded.failures,locked_until=excluded.locked_until',email,lock?0:n,lock).run();return E('Invalid credentials',401);}
await Q(d,'DELETE FROM login_attempts WHERE email=?',email).run();return start(d,account.id);
}
let user=await me(d,req);if(!user)return E('Sign in required',401);
if(p==='/api/me'&&req.method==='GET')return R({user});

if(p==='/api/onboarding'&&req.method==='GET'){
 const pref=await one(d,'SELECT onboarding_version FROM user_preferences WHERE user_id=?',user.id);
 return R({version:1,completed:(pref?.onboarding_version||0)>=1});
}
if(p==='/api/onboarding/complete'&&req.method==='POST'){
 await Q(d,"INSERT INTO user_preferences(user_id,onboarding_version,completed_at) VALUES(?,1,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET onboarding_version=MAX(onboarding_version,1),completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP)",user.id).run();
 return R({ok:true,version:1});
}

if(p==='/api/auth/logout'&&req.method==='POST'){let c=(req.headers.get('cookie')||'').match(/ml_session=([a-f0-9]{64})/);if(c)await Q(d,'DELETE FROM sessions WHERE id=?',await H(c[1])).run();return R({ok:true},200,{'set-cookie':ck('',0)});}
if(p==='/api/invite/accept'&&req.method==='POST'){let b=await read(req),v=await one(d,'SELECT * FROM invitations WHERE token_hash=? AND accepted_at IS NULL AND expires_at>?',await H(String(b.token||'')),iso());if(!v||v.email.toLowerCase()!==user.email.toLowerCase())return E('Invite not valid for this account',403);await accept(d,v,user.id);return R({ok:true});}

if(p==='/api/report/pdf'&&req.method==='GET'){
 const gid=u.searchParams.get('group_id')||'',filter=u.searchParams.get('status')||'all',lang=u.searchParams.get('lang')||'en';
 const from=u.searchParams.get('from')||'2020-01-01',to=u.searchParams.get('to')||iso().slice(0,10);
 const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'));
 if(!validDate(from)||!validDate(to)||from>to)return E('Invalid report dates',400);
 if(!['all','paid','pending','approved','rejected'].includes(filter))return E('Invalid report status',400);
 const membership=await acl(d,user.id,gid,'viewer');if(!membership)return E('Workspace access required',403);
 const groupRecord=await one(d,'SELECT id,name,currency FROM groups WHERE id=?',gid);if(!groupRecord)return E('Workspace not found',404);
 const includePrivate=u.searchParams.get('private')==='1'&&rights[membership.role]>=rights.controller;
 let sql="SELECT e.id,e.title,e.category,e.amount_cents,e.expense_date,e.method,e.status"+(includePrivate?",e.beneficiary":"")+" FROM expenses e WHERE e.group_id=? AND e.expense_date>=? AND e.expense_date<=?";
 let params=[gid,from,to];
 if(filter!=='all'){sql+=" AND e.status=?";params.push(filter);}
 sql+=" ORDER BY e.expense_date ASC,e.created_at ASC LIMIT 1001";
 const entries=await many(d,sql,...params);
 if(entries.length>1000)return E('Too many entries for one report. Narrow your date range.',400);
 const treasuryAccounts=await many(d,'SELECT a.name,a.type,COALESCE((SELECT SUM(t.delta_cents) FROM treasury_entries t WHERE t.account_id=a.id AND t.entry_date<=?),0) AS balance_cents FROM treasury_accounts a WHERE a.group_id=? ORDER BY a.name',to,gid);
 const pdf=gscCreatePdf({group:groupRecord,expenses:entries,treasuryAccounts,lang,from,to,status:filter,privateInfo:includePrivate,generated:iso()});
 const filename='gsc-ledger-'+from+'-'+to+'.pdf';
 return new Response(pdf,{status:200,headers:{'content-type':'application/pdf','content-disposition':'attachment; filename="'+filename+'"','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
}

if(p==='/api/data'&&req.method==='GET'){
let groups=await many(d,'SELECT g.*,m.role FROM groups g JOIN memberships m ON g.id=m.group_id WHERE m.user_id=? ORDER BY g.created_at',user.id);
let [expenses,requests,commitments,events,members]=await Promise.all([
many(d,'SELECT e.*,x.name creator FROM expenses e JOIN memberships m ON e.group_id=m.group_id AND m.user_id=? LEFT JOIN users x ON x.id=e.created_by ORDER BY e.expense_date DESC LIMIT 3000',user.id),
many(d,'SELECT r.* FROM requests r JOIN memberships m ON r.group_id=m.group_id AND m.user_id=? ORDER BY r.created_at DESC LIMIT 1000',user.id),
many(d,'SELECT c.* FROM commitments c JOIN memberships m ON c.group_id=m.group_id AND m.user_id=? ORDER BY c.next_due LIMIT 1000',user.id),
many(d,'SELECT a.*,x.name actor FROM audit a JOIN memberships m ON a.group_id=m.group_id AND m.user_id=? LEFT JOIN users x ON x.id=a.actor_id ORDER BY a.created_at DESC LIMIT 500',user.id),
many(d,'SELECT m.group_id,m.role,x.id,x.name,x.email FROM memberships m JOIN users x ON x.id=m.user_id WHERE m.group_id IN (SELECT group_id FROM memberships WHERE user_id=?)',user.id)
]);
let roles=Object.fromEntries(groups.map(g=>[g.id,g.role]));
expenses=expenses.map(x=>roles[x.group_id]==='viewer'?{...x,beneficiary:'',notes:'',receipt_url:'',reference:'',created_by:null}:x);
requests=requests.map(x=>roles[x.group_id]==='viewer'?{...x,beneficiary:'',notes:''}:x);
commitments=commitments.map(x=>roles[x.group_id]==='viewer'?{...x,beneficiary:'',notes:''}:x);
events=events.map(x=>roles[x.group_id]==='viewer'?{...x,detail:'{}',actor_id:null}:x);
members=members.filter(x=>rights[roles[x.group_id]]>=3||x.id===user.id).map(x=>rights[roles[x.group_id]]>=3?x:{...x,email:''});

const [treasuryAccounts,treasuryEntries,treasuryTotals]=await Promise.all([
 many(d,'SELECT a.*,COALESCE((SELECT SUM(t.delta_cents) FROM treasury_entries t WHERE t.account_id=a.id),0) AS balance_cents FROM treasury_accounts a JOIN memberships m ON a.group_id=m.group_id AND m.user_id=? ORDER BY a.created_at,a.name',user.id),
 many(d,'SELECT t.*,a.name AS account_name FROM treasury_entries t JOIN treasury_accounts a ON a.id=t.account_id JOIN memberships m ON m.group_id=t.group_id AND m.user_id=? ORDER BY t.created_at DESC,t.id DESC LIMIT 1000',user.id),
 many(d,'SELECT t.group_id,t.kind,COUNT(*) AS entry_count,SUM(t.delta_cents) AS total_cents FROM treasury_entries t JOIN memberships m ON m.group_id=t.group_id AND m.user_id=? GROUP BY t.group_id,t.kind',user.id)
]);
const treasuryEntriesFiltered=treasuryEntries.map(x=>roles[x.group_id]==='viewer'?{...x,counterparty:'',notes:'',created_by:null}:x);
return R({user,groups,expenses,requests,commitments,audit:events,members,treasuryAccounts,treasuryEntries:treasuryEntriesFiltered,treasuryTotals});

}
if(req.method!=='POST')return E('Not found',404);
let b=await read(req),group=tx(b.group_id,80);
if(p==='/api/groups'){
let name=tx(b.name,80),cur=tx(b.currency,3).toUpperCase(),v=b.visibility==='team'?'team':'private';if(!name||!['TND','USD','EUR','CAD','GBP'].includes(cur))return E('Invalid group');
let gid=id();await d.batch([Q(d,'INSERT INTO groups(id,name,description,icon,color,visibility,currency,created_by) VALUES(?,?,?,?,?,?,?,?)',gid,name,tx(b.description,300),WS_ICONS.includes(b.icon)?b.icon:'layers','#164b3d',v,cur,user.id),Q(d,'INSERT INTO memberships(group_id,user_id,role) VALUES(?,?,?)',gid,user.id,'owner'),audit(d,gid,user.id,'group.created','group',gid,{name,visibility:v})]);return R({ok:true,id:gid});
}
if(p==='/api/group/update'){
if(!await acl(d,user.id,group,'owner'))return E('Owner required',403);let name=tx(b.name,80),v=b.visibility==='team'?'team':'private';if(!name)return E('Name required');
await d.batch([Q(d,'UPDATE groups SET name=?,description=?,visibility=?,icon=? WHERE id=?',name,tx(b.description,300),v,WS_ICONS.includes(b.icon)?b.icon:(await one(d,'SELECT icon FROM groups WHERE id=?',group))?.icon||'layers',group),audit(d,group,user.id,'group.updated','group',group,{name,visibility:v})]);return R({ok:true});
}
if(p==='/api/invite/create'){
if(!await acl(d,user.id,group,'owner'))return E('Owner required',403);let email=tx(b.email).toLowerCase(),role=tx(b.role,20);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['controller','editor','viewer'].includes(role))return E('Invalid invitation');
if(await one(d,'SELECT 1 n FROM memberships m JOIN users x ON x.id=m.user_id WHERE m.group_id=? AND x.email=?',group,email))return E('Already a member');
let iid=id(),t=rnd(),expiry=new Date(Date.now()+604800000).toISOString();await d.batch([Q(d,'INSERT INTO invitations(id,token_hash,group_id,email,role,invited_by,expires_at) VALUES(?,?,?,?,?,?,?)',iid,await H(t),group,email,role,user.id,expiry),audit(d,group,user.id,'invitation.created','invitation',iid,{email,role})]);return R({ok:true,token:t,expires_at:expiry});
}
if(p==='/api/membership/update'){
if(!await acl(d,user.id,group,'owner'))return E('Owner required',403);let target=tx(b.user_id,80),role=tx(b.role,20),old=await one(d,'SELECT role FROM memberships WHERE group_id=? AND user_id=?',group,target);
if(target===user.id||!old||old.role==='owner'||!['controller','editor','viewer'].includes(role))return E('Role change forbidden');
await d.batch([Q(d,'UPDATE memberships SET role=? WHERE group_id=? AND user_id=?',role,group,target),audit(d,group,user.id,'membership.changed','membership',target,{from:old.role,to:role})]);return R({ok:true});
}

if(p==='/api/treasury/account/create'){
 const group=tx(b.group_id,80);
 if(!await acl(d,user.id,group,'controller'))return E('Controller role required',403);
 const name=tx(b.name,90),type=tx(b.type,20),opening=b.opening===undefined||b.opening===''?0:Number(b.opening);
 if(!name||!['cash','bank','wallet','other'].includes(type)||!Number.isFinite(opening)||opening<0||opening>1e9)return E('Invalid account details');
 const cents=Math.round(opening*100),accountId=id(),op=id(),dt=iso().slice(0,10);
 const existing=await one(d,'SELECT id FROM treasury_accounts WHERE group_id=? AND name=?',group,name);
 if(existing)return E('An account with this name already exists',409);
 const steps=[Q(d,'INSERT INTO treasury_accounts(id,group_id,name,type,created_by) VALUES(?,?,?,?,?)',accountId,group,name,type,user.id)];
 if(cents>0)steps.push(Q(d,'INSERT INTO treasury_entries(id,group_id,account_id,kind,delta_cents,entry_date,title,operation_id,created_by) VALUES(?,?,?,?,?,?,?,?,?)',id(),group,accountId,'opening',cents,dt,'Opening balance',op,user.id));
 steps.push(audit(d,group,user.id,'treasury.account.created','treasury_account',accountId,{name,type,opening_cents:cents}));
 await d.batch(steps);return R({ok:true,id:accountId});
}
if(p==='/api/treasury/entry/create'){
 const group=tx(b.group_id,80);
 if(!await acl(d,user.id,group,'controller'))return E('Controller role required',403);
 const kind=tx(b.kind,20),accountId=tx(b.account_id,80),name=tx(b.title,120),date=tx(b.entry_date,10),amount=cash(b.amount);
 const counterparty=tx(b.counterparty,120),notes=tx(b.notes,600);
 if(!['deposit','withdrawal'].includes(kind)||!name||!amount||!goodDate(date))return E('Invalid treasury transaction');
 const account=await one(d,'SELECT * FROM treasury_accounts WHERE group_id=? AND id=? AND active=1',group,accountId);
 if(!account)return E('Account unavailable',404);
 const delta=kind==='withdrawal'?-amount:amount,entryId=id(),operationId=tx(b.operation_id,80)||id();
 await d.batch([
 Q(d,'INSERT INTO treasury_entries(id,group_id,account_id,kind,delta_cents,entry_date,title,counterparty,notes,operation_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)',entryId,group,accountId,kind,delta,date,name,counterparty,notes,operationId,user.id),
 audit(d,group,user.id,'treasury.'+kind,'treasury_entry',entryId,{account:account.name,amount_cents:amount,title:name})
 ]);return R({ok:true,id:entryId});
}
if(p==='/api/treasury/transfer'){
 const group=tx(b.group_id,80),from=tx(b.from_account_id,80),to=tx(b.to_account_id,80),date=tx(b.entry_date,10),amount=cash(b.amount);
 if(!await acl(d,user.id,group,'controller'))return E('Controller role required',403);
 if(!from||!to||from===to||!amount||!goodDate(date))return E('Invalid transfer');
 const accounts=await many(d,'SELECT id,name FROM treasury_accounts WHERE group_id=? AND active=1 AND id IN (?,?)',group,from,to);
 if(accounts.length!==2)return E('Both accounts must belong to this workspace',403);
 const byId=Object.fromEntries(accounts.map(a=>[a.id,a.name]));
 const transfer=id(),op=tx(b.operation_id,80)||id(),note=tx(b.notes,600);
 const title='Transfer: '+byId[from]+' to '+byId[to];
 await d.batch([
 Q(d,'INSERT INTO treasury_entries(id,group_id,account_id,kind,delta_cents,entry_date,title,notes,transfer_id,operation_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)',id(),group,from,'transfer_out',-amount,date,title,note,transfer,op,user.id),
 Q(d,'INSERT INTO treasury_entries(id,group_id,account_id,kind,delta_cents,entry_date,title,notes,transfer_id,operation_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)',id(),group,to,'transfer_in',amount,date,title,note,transfer,op,user.id),
 audit(d,group,user.id,'treasury.transfer','treasury_transfer',transfer,{from:byId[from],to:byId[to],amount_cents:amount})
 ]);return R({ok:true,id:transfer});
}

if(p==='/api/expense/create'){
if(!await acl(d,user.id,group,'editor'))return E('Editor required',403);let title=tx(b.title,120),amt=cash(b.amount),dt=tx(b.expense_date,10),receipt=tx(b.receipt_url,500);
if(!title||!amt||!goodDate(dt))return E('Valid title, amount and date required');if(receipt&&!/^https?:\/\//i.test(receipt))return E('Receipt must be URL');
let g=await one(d,'SELECT currency FROM groups WHERE id=?',group),x=id(),cat=tx(b.category,50)||'Other';
await d.batch([Q(d,"INSERT INTO expenses(id,group_id,title,beneficiary,category,amount_cents,currency,expense_date,method,status,reference,notes,receipt_url,created_by) VALUES(?,?,?,?,?,?,?,?,?,'pending',?,?,?,?)",x,group,title,tx(b.beneficiary,120),cat,amt,g.currency,dt,tx(b.method,30)||'Cash',tx(b.reference,180),tx(b.notes,1000),receipt,user.id),audit(d,group,user.id,'expense.submitted','expense',x,{title,amount_cents:amt,expense_date:dt,category:cat})]);return R({ok:true,id:x});
}
if(p==='/api/expense/status'){
let x=tx(b.id,80),status=tx(b.status,20),e=await one(d,'SELECT * FROM expenses WHERE id=?',x);if(!e||!await acl(d,user.id,e.group_id,'controller'))return E('Controller required',403);
if(!((e.status==='pending'&&['approved','rejected'].includes(status))||(e.status==='approved'&&status==='paid')))return E('Invalid approval transition');
if(status==='approved'&&e.created_by===user.id&&!await acl(d,user.id,e.group_id,'owner'))return E('Cannot approve your own expense',403);
let batch=[Q(d,"UPDATE expenses SET status=?,approved_by=CASE WHEN ?='approved' THEN ? ELSE approved_by END,approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?",status,status,user.id,status,x,e.status),audit(d,e.group_id,user.id,'expense.'+status,'expense',x,{from:e.status,selfApproval:e.created_by===user.id})];
if(status==='paid'&&e.reference.startsWith('request:'))batch.push(Q(d,"UPDATE requests SET status='funded' WHERE id=? AND status='approved'",e.reference.slice(8)));
if(status==='paid'&&e.reference.startsWith('commitment:')){let parts=e.reference.split(':'),c=await one(d,'SELECT * FROM commitments WHERE id=?',parts[1]);if(c&&c.next_due===parts[2]){let next=advance(c.next_due,c.frequency);batch.push(Q(d,'UPDATE commitments SET next_due=?,active=? WHERE id=?',next||c.next_due,next?1:0,c.id));}}

if(status==='paid'){
 const availableAccounts=await many(d,'SELECT id FROM treasury_accounts WHERE group_id=? AND active=1',e.group_id);
 if(availableAccounts.length){
  const accountId=tx(b.account_id,80);
  if(!accountId||!availableAccounts.some(a=>a.id===accountId))return E('Choose a treasury account for this payment',400);
  const already=await one(d,'SELECT id FROM treasury_entries WHERE linked_expense_id=?',e.id);
  if(already)return E('Expense is already posted to treasury',409);
  const amount=Number(e.amount_cents),entryId=id();
  batch.push(Q(d,'INSERT INTO treasury_entries(id,group_id,account_id,kind,delta_cents,entry_date,title,counterparty,notes,linked_expense_id,operation_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',entryId,e.group_id,accountId,'expense',-amount,iso().slice(0,10),e.title,e.beneficiary,'Linked to approved expense '+e.id,e.id,id(),user.id));
  batch.push(audit(d,e.group_id,user.id,'treasury.expense.paid','treasury_entry',entryId,{expense_id:e.id,amount_cents:amount,account_id:accountId}));
 }
}
await d.batch(batch);return R({ok:true});
}
if(p==='/api/request/create'){
if(!await acl(d,user.id,group,'editor'))return E('Editor required',403);let title=tx(b.title,120),due=tx(b.due_date,10),x=id();if(!title||(due&&!goodDate(due)))return E('Invalid request');
let n=cash(b.amount)||0,priority=['low','normal','high','urgent'].includes(b.priority)?b.priority:'normal';
await d.batch([Q(d,"INSERT INTO requests(id,group_id,title,beneficiary,amount_cents,priority,status,notes,due_date,created_by) VALUES(?,?,?,?,?,?,'waiting',?,?,?)",x,group,title,tx(b.beneficiary,120),n,priority,tx(b.notes,1000),due||null,user.id),audit(d,group,user.id,'request.created','request',x,{title,amount_cents:n,priority})]);return R({ok:true,id:x});
}
if(p==='/api/request/status'){
let x=tx(b.id,80),status=tx(b.status,20),r=await one(d,'SELECT * FROM requests WHERE id=?',x);if(!r||!await acl(d,user.id,r.group_id,'controller'))return E('Controller required',403);
if(r.status!=='waiting'||!['approved','rejected'].includes(status))return E('Invalid request status');
await d.batch([Q(d,'UPDATE requests SET status=? WHERE id=? AND status=?',status,x,'waiting'),audit(d,r.group_id,user.id,'request.'+status,'request',x,{title:r.title})]);return R({ok:true});
}
if(p==='/api/commitment/create'){
if(!await acl(d,user.id,group,'editor'))return E('Editor required',403);let title=tx(b.title,120),n=cash(b.amount),due=tx(b.next_due,10),freq=tx(b.frequency,20),x=id();
if(!title||!n||!goodDate(due)||!['weekly','monthly','quarterly','once'].includes(freq))return E('Invalid recurring obligation');
await d.batch([Q(d,'INSERT INTO commitments(id,group_id,title,beneficiary,category,amount_cents,frequency,next_due,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)',x,group,title,tx(b.beneficiary,120),tx(b.category,50)||'Support',n,freq,due,tx(b.notes,1000),user.id),audit(d,group,user.id,'commitment.created','commitment',x,{title,amount_cents:n,frequency:freq,next_due:due})]);return R({ok:true,id:x});
}
if(p==='/api/commitment/stop'){
let c=await one(d,'SELECT * FROM commitments WHERE id=?',tx(b.id,80));if(!c||!await acl(d,user.id,c.group_id,'controller'))return E('Controller required',403);
await d.batch([Q(d,'UPDATE commitments SET active=0 WHERE id=?',c.id),audit(d,c.group_id,user.id,'commitment.stopped','commitment',c.id)]);return R({ok:true});
}
return E('Unknown action',404);
}catch(e){console.log(JSON.stringify({path:p,error:String(e)}));return E('Unable to complete request',500);}
}};
