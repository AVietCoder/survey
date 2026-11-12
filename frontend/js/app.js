/* brainst0rm — frontend (giữ nguyên giao diện, dữ liệu lấy từ API thật) */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(message,type)=>{
 const text=String(message??'');
 const tone=type||(/(chưa|không thể|vui lòng|phải|chọn ít nhất|lỗi)/i.test(text)?'error':/^Đã /.test(text)?'success':'info');
 return window.BrainstormUI.toast(text,tone);
};
const confirmAction=(message,title='Xóa khảo sát?',action='Xóa khảo sát')=>new Promise(resolve=>{
 const dialog=document.createElement('dialog');
 dialog.className='confirm-dialog';
 dialog.innerHTML=`<div class="dialog-content"><span class="chip c-bad">Không thể hoàn tác</span><h2>${esc(title)}</h2><p></p><div class="dialog-actions"><button class="btn" type="button" data-choice="cancel">Giữ lại</button><button class="btn danger" type="button" data-choice="confirm">${esc(action)}</button></div></div>`;
 $('.dialog-content p',dialog).textContent=message;
 const finish=approved=>{dialog.close();dialog.remove();resolve(approved)};
 dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false)});
 dialog.addEventListener('click',e=>{if(e.target===dialog)finish(false)});
 $('[data-choice=cancel]',dialog).onclick=()=>finish(false);
 $('[data-choice=confirm]',dialog).onclick=()=>finish(true);
 document.body.append(dialog);
 dialog.showModal()
});
const setButtonLoading=(button,label)=>{
 if(!button)return()=>{};
 const previous=button.innerHTML;
 button.disabled=true;
 button.classList.add('is-loading');
 button.setAttribute('aria-busy','true');
 button.innerHTML=`<span class="spinner" aria-hidden="true"></span>${label}`;
 return()=>{button.disabled=false;button.classList.remove('is-loading');button.removeAttribute('aria-busy');button.innerHTML=previous};
};
async function api(method,path,body){
 const r=await fetch('/api'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const j=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status==401&&me){me=null;location.hash='#/login'}throw Object.assign(new Error(j.error||'Có lỗi xảy ra'),{status:r.status})}
 return j}
const ic={home:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',research:'<circle cx="8" cy="8" r="4"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M16 3.5a4 4 0 0 1 0 9M18 15a5 5 0 0 1 4 5v1"/>',shield:'<path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
 file:'<path d="M5 4.75h9l5 5v9.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M14 4.75v5h5M8 14h8M8 17h5"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="M20 6 9 17l-5-5"/>',checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
 alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 inbox:'<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
 link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',note:'<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8 9h8M8 13h5"/>',activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',logout:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/>',layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
 tag:'<path d="M20 12.5 12.5 20a1.5 1.5 0 0 1-2.1 0L4 13.6V4h9.6l6.4 6.4a1.5 1.5 0 0 1 0 2.1z"/><circle cx="8.5" cy="8.5" r="1.5"/>',database:'<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
 bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',external:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
 printer:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>',trend:'<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',send:'<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',filter:'<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20"/>'};
const svg=(k,c='')=>`<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ic[k]||ic.file}</svg>`;
const credit=`<footer class="credit">Author • <a href="https://www.kaggle.com/noahkun" target="_blank" rel="noopener noreferrer">trviet</a></footer>`;
const kpi=(label,value,hint,icon='chart',tone='')=>`<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-ic ${tone}">${svg(icon)}</span></div><b>${value}</b><small>${hint}</small></div>`;
const SL={published:['Đang chạy','c-run'],draft:['Bản nháp','c-draft'],archived:['Lưu trữ','c-end']};
const fmt=s=>s==null?'—':Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const ago=d=>{const m=Math.round((Date.now()-new Date(d))/6e4);return m<1?'vừa xong':m<60?m+' phút trước':m<1440?Math.round(m/60)+' giờ trước':Math.round(m/1440)+' ngày trước'};
const app=()=>$('#app');
let me=null;

/* ---------- thư viện câu hỏi ---------- */
const types=[['single','◉','Một lựa chọn','Chọn một đáp án'],['mc','☑','Nhiều lựa chọn','Chọn nhiều đáp án'],['likert','5','Likert','Mức độ đồng ý'],['rating','★','Đánh giá sao','Nhanh, quen thuộc'],['slider','⟷','Thanh trượt','Cảm nhận liên tục'],['rank','≡','Xếp hạng','Sắp thứ tự ưu tiên'],['matrix','▦','Ma trận','Nhiều mục, một thang'],['image','▣','Chọn hình ảnh','Phản ứng trực giác'],['sd','◐','Ngữ nghĩa phân biệt','Hai cực đối lập'],['text','Aa','Văn bản ngắn','Một dòng'],['longtext','¶','Văn bản dài','Tự luận']];
const TN=Object.fromEntries(types.map(t=>[t[0],t[2]]));
const L=a=>a.map(label=>({label,value:label}));
const hasOpts=t=>['single','mc','rank','image','matrix'].includes(t);
let nid=0;
function mk(t){
 const text={single:'Bạn làm việc hiệu quả nhất vào lúc nào?',mc:'Bạn thường dùng những công cụ nào?',likert:'Tôi hài lòng với công việc hiện tại.',rating:'Bạn đánh giá buổi họp hôm nay thế nào?',slider:'Mức căng thẳng của bạn hôm nay?',rank:'Xếp hạng các yếu tố sau.',matrix:'Trong tuần qua, bạn cảm thấy…',image:'Khung cảnh nào giúp bạn tập trung nhất?',sd:'Văn hóa nhóm của bạn như thế nào?',text:'Bạn làm ở bộ phận nào?',longtext:'Điều gì sẽ cải thiện ngày làm việc của bạn?'}[t];
 const o={single:['Buổi sáng sớm','Giữa buổi sáng','Chiều muộn','Ban đêm'],mc:['Email','Chat','Họp video'],rank:['Tự do sắp xếp thời gian','Đồng nghiệp tốt','Mục đích rõ ràng','Thu nhập ổn định'],image:['Rừng sớm','Phố đêm','Bãi biển'],matrix:['Tập trung','Mệt mỏi','Hứng thú']}[t]||[];
 const s={likert:{lo:'Hoàn toàn không đồng ý',hi:'Hoàn toàn đồng ý'},slider:{lo:'Hoàn toàn bình tĩnh',hi:'Rất căng thẳng'},matrix:{cols:['Hiếm','Đôi khi','Thường']},sd:{pairs:[['Yên tĩnh','Ồn ào'],['Linh hoạt','Cứng nhắc'],['Gắn kết','Cô lập']]}}[t]||{};
 return{id:'new-'+(++nid),question_text:text,question_type:t,is_required:true,settings:s,options:L(o)}}

/* ---------- thân câu hỏi dùng chung (Builder, Preview, Survey) ---------- */
const col=["#D4D0FA","#B7B1F4","#FFE3A3","#FFD166","#C9F0DA","#9AD9B3"];
function body(q){
 const t=q.question_type,s=q.settings||{},o=q.options||[],v=x=>esc(x);
 if(t=='single'||t=='mc')return o.map(x=>`<button class="opt ${t=='mc'?'multi':''}" data-v="${v(x.label)}"><i></i>${v(x.label)}</button>`).join('');
 if(t=='likert')return `<div class="scale">${[1,2,3,4,5].map(n=>`<button data-v="${n}">${n}</button>`).join('')}</div><div class="ends"><span>${v(s.lo||'')}</span><span>${v(s.hi||'')}</span></div>`;
 if(t=='rating')return `<div class="stars">${[1,2,3,4,5].map(n=>`<button data-v="${n}" aria-label="${n} sao">★</button>`).join('')}</div>`;
 if(t=='slider')return `<input type="range" min="1" max="100" value="50"><div class="ends"><span>${v(s.lo||'')}</span><span>${v(s.hi||'')}</span></div>`;
 if(t=='rank')return o.map(x=>`<button class="rank" data-v="${v(x.label)}"><b></b>${v(x.label)}</button>`).join('')+'<div class="ends"><span>Chạm theo thứ tự ưu tiên</span></div>';
 if(t=='matrix'){const c=s.cols||[];return `<table class="mx"><tr><th></th>${c.map(h=>`<th>${v(h)}</th>`).join('')}</tr>${o.map(r=>`<tr><td>${v(r.label)}</td>${c.map(h=>`<td><input type="radio" name="${v(q.id)}__${v(r.label)}" value="${v(h)}"></td>`).join('')}</tr>`).join('')}</table>`}
 if(t=='image')return `<div class="imgs">${o.map((x,i)=>`<button class="img" data-v="${v(x.label)}"><div style="background:linear-gradient(135deg,${col[i*2%6]},${col[(i*2+1)%6]})"></div><span>${v(x.label)}</span></button>`).join('')}</div>`;
 if(t=='sd')return (s.pairs||[]).map(p=>`<div class="sd" data-k="${v(p.join('|'))}"><span>${v(p[0])}</span><div class="dots">${[1,2,3,4,5].map(n=>`<button data-v="${n}" aria-label="${n}"></button>`).join('')}</div><span>${v(p[1])}</span></div>`).join('');
 if(t=='longtext')return `<textarea placeholder="Chia sẻ bằng lời của bạn…"></textarea>`;
 return `<input class="in" type="text" placeholder="Câu trả lời của bạn" maxlength="300">`}
function wire(root,onPick){
 const setPressed=(b,on)=>b.setAttribute('aria-pressed',String(on));
 $$('.scale button,.stars button,.dots button,.opt,.img,.rank',root).forEach(b=>setPressed(b,b.classList.contains('on')));
 $$('.scale button,.stars button,.dots button',root).forEach(b=>b.onclick=()=>{const g=b.parentElement,i=[...g.children].indexOf(b);[...g.children].forEach((x,j)=>{const on=g.classList.contains('stars')?j<=i:j==i;x.classList.toggle('on',on);setPressed(x,on)});onPick&&onPick(b)});
 $$('.opt:not(.multi),.img',root).forEach(b=>b.onclick=()=>{$$('.opt.on:not(.multi),.img.on',b.parentElement).forEach(x=>{x.classList.remove('on');setPressed(x,false)});b.classList.add('on');setPressed(b,true);onPick&&onPick(b)});
 $$('.opt.multi',root).forEach(b=>b.onclick=()=>{b.classList.toggle('on');setPressed(b,b.classList.contains('on'));onPick&&onPick(b)});
 $$('input[type=range]',root).forEach(r=>r.oninput=()=>r.dataset.t=1);
 $$('.rank',root).forEach(b=>b.onclick=()=>{const sc=b.parentElement;
  if(b.classList.contains('on')){const k=+$('b',b).textContent;b.classList.remove('on');setPressed(b,false);$('b',b).textContent='';$$('.rank.on',sc).forEach(x=>{const m=+$('b',x).textContent;if(m>k)$('b',x).textContent=m-1})}
  else{b.classList.add('on');setPressed(b,true);$('b',b).textContent=$$('.rank.on',sc).length}onPick&&onPick(b)})}
function collect(q,root){
 const t=q.question_type;
 if(t=='single'||t=='image'){const b=$('.opt.on,.img.on',root);return b?b.dataset.v:undefined}
 if(t=='mc'){const a=$$('.opt.on',root).map(b=>b.dataset.v);return a.length?a:undefined}
 if(t=='likert'){const b=$('.scale .on',root);return b?+b.dataset.v:undefined}
 if(t=='rating')return $$('.stars .on',root).length||undefined;
 if(t=='slider'){const r=$('input[type=range]',root);return r.dataset.t?+r.value:undefined}
 if(t=='rank'){const a=$$('.rank.on',root).sort((x,y)=>+$('b',x).textContent-+$('b',y).textContent).map(b=>b.dataset.v);return a.length==q.options.length?a:undefined}
 if(t=='matrix'){const o={};$$('input:checked',root).forEach(i=>o[i.name.slice(String(q.id).length+2)]=i.value);return Object.keys(o).length==q.options.length?o:undefined}
 if(t=='sd'){const o={};$$('.sd',root).forEach(r=>{const b=$('.dots .on',r);if(b)o[r.dataset.k]=+b.dataset.v});return Object.keys(o).length==(q.settings.pairs||[]).length?o:undefined}
 return $('textarea,input[type=text]',root).value.trim()||undefined}

/* ---------- khung chung ---------- */
const nav=[['dashboard','Tổng quan','home'],['builder','Trình tạo','edit'],['analytics','Phân tích','chart'],['research','Nghiên cứu','research']];
function shell(r,html){
 const isAdmin=r=='admin';
 app().className='app page-'+r+(isAdmin?' admin-shell':'')+(r=='report'?' report-shell':'');
 const links=me?.is_admin?[...nav,['admin','Quản trị','shield']]:nav;
 const route=location.hash.replace(/^#\/?/,'').split('?')[0].split('/');
 const adminLabel=route[1]=='users'?'Tài khoản':route[1]=='surveys'?(route[2]?'Chi tiết khảo sát':'Khảo sát'):'Tổng quan';
 const searchEnabled=isAdmin&&(route[1]=='users'||route[1]=='surveys'&&(route.length<3||Boolean(route[2])));
 const searchAttribute=searchEnabled?(route[1]=='surveys'&&route[2]?'data-response-search':'data-admin-search'):'';
 const adminLinks=[['overview','Tổng quan'],['users','Tài khoản'],['surveys','Khảo sát']];
 const navigation=isAdmin?`<div class="admin-nav-group"><span class="admin-nav-label">Khảo sát</span><nav class="nav">${links.filter(([key])=>key!='admin').map(([key,label,icon])=>`<a href="#/${key}" class="${key==r?'on':''}" ${key==r?'aria-current="page"':''}><svg viewBox="0 0 24 24">${ic[icon]}</svg><span>${label}</span></a>`).join('')}</nav><span class="admin-nav-label">Quản trị</span><nav class="nav">${adminLinks.map(([key,label])=>`<a href="#/admin${key=='overview'?'':'/'+key}" class="${key===(route[1]||'overview')?'on':''}" ${key===(route[1]||'overview')?'aria-current="page"':''}><svg viewBox="0 0 24 24">${key=='overview'?ic.chart:key=='users'?'<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20"/>':'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>'}</svg><span>${label}</span></a>`).join('')}</nav></div>`:`<span class="nav-label">Không gian làm việc</span><nav class="nav" aria-label="Điều hướng chính">${links.map(([k,l,i])=>`<a href="#/${k}" class="${k==r?'on':''}" ${k==r?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${ic[i]}</svg><span>${l}</span></a>`).join('')}</nav>`;
 const profileInitial=esc((me.username||'?').slice(0,1).toUpperCase());
 const mainContent=isAdmin?`<div class="admin-topbar"><label class="admin-quick-search" ${searchEnabled?'':'hidden'}><span aria-hidden="true">⌕</span><input id="admin-quick-search" ${searchAttribute} type="search" placeholder="Tìm trong trang hiện tại" aria-label="Tìm trong danh sách hiện tại"></label><div class="admin-topbar-spacer"></div><a class="admin-top-link" href="#/admin/users">Tài khoản</a><a class="admin-top-link" href="#/admin/surveys">Khảo sát</a><div class="admin-profile"><span class="admin-avatar" aria-hidden="true">${profileInitial}</span><span>${esc(me.username)}<small>Quản trị viên</small></span></div></div>${html}<footer class="admin-footer"><span>brainst0rm · Quản trị hệ thống</span><span>Chỉ tài khoản có quyền quản trị được truy cập</span></footer>`:html;
 app().innerHTML=`<aside class="side"><div class="logo"><i></i><span class="brand-word">brainst0rm</span>${isAdmin?'<button type="button" class="admin-nav-toggle" id="admin-nav-toggle" aria-label="Thu gọn thanh điều hướng" aria-expanded="true">‹</button>':''}</div>${navigation}
 ${!isAdmin?`<div class="tip"><b>${svg('bulb')}Mẹo thiết kế</b>Nhóm 5–7 câu mỗi trang để giảm mệt mỏi nhận thức.</div>`:''}
 <div class="who"><span class="who-avatar" aria-hidden="true">${profileInitial}</span><span class="who-name"><span>${esc(me.username)}</span><small>${me.is_admin?'Quản trị viên':'Researcher'}</small></span><button id="out" type="button" aria-label="Đăng xuất" title="Đăng xuất">${svg('logout')}</button></div></aside><main class="workspace-main">${isAdmin?`<nav class="admin-breadcrumb" aria-label="Điều hướng đường dẫn"><a href="#/admin">Quản trị</a><span aria-hidden="true">/</span><span aria-current="page">${adminLabel}</span></nav>`:''}${mainContent}${credit}</main>`;
 if(isAdmin){
  $$('.admin-nav-group .nav a').forEach(link=>link.dataset.tooltip=$('span',link)?.textContent.trim()||'');
  const collapsed=localStorage.getItem('brainst0rm-admin-nav-collapsed')=='true';
  app().classList.toggle('nav-collapsed',collapsed);
  const toggle=$('#admin-nav-toggle');
  toggle.setAttribute('aria-expanded',String(!collapsed));
  toggle.setAttribute('aria-label',collapsed?'Mở rộng thanh điều hướng':'Thu gọn thanh điều hướng');
  toggle.textContent=collapsed?'›':'‹';
  if(matchMedia('(max-width: 760px)').matches){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Mở điều hướng');toggle.textContent='☰'}
  toggle.onclick=()=>{
   if(matchMedia('(max-width: 760px)').matches){const open=app().classList.toggle('mobile-nav-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Đóng điều hướng':'Mở điều hướng');toggle.textContent=open?'×':'☰';return}
   const next=app().classList.toggle('nav-collapsed');localStorage.setItem('brainst0rm-admin-nav-collapsed',String(next));toggle.setAttribute('aria-expanded',String(!next));toggle.setAttribute('aria-label',next?'Mở rộng thanh điều hướng':'Thu gọn thanh điều hướng');toggle.textContent=next?'›':'‹'
  };
  const quickSearch=$('#admin-quick-search');
  if(quickSearch)quickSearch.oninput=()=>{const search=$('[data-admin-search]')||$('[data-response-search]');if(search&&search!==quickSearch){search.value=quickSearch.value;search.dispatchEvent(new Event('input',{bubbles:true}))}};
 }
 $('#out').onclick=async()=>{await api('POST','/auth/logout').catch(()=>{});me=null;location.hash='#/login';render()}}
const loading=r=>{
 const content=`<div class="page-skeleton" role="status" aria-live="polite" aria-busy="true" aria-label="Đang tải nội dung">
  <div class="skeleton-head"><div class="skeleton-block skeleton-title"></div><div class="skeleton-block skeleton-action"></div></div>
  <div class="grid ${r=='admin'?'g3':'g4'}">${Array.from({length:r=='admin'?3:4},()=>'<div class="card kpi skeleton-card"><i class="skeleton-block"></i><b class="skeleton-block"></b><small class="skeleton-block"></small></div>').join('')}</div>
  ${r=='builder'?'<div class="skeleton-builder"><div class="card"><i class="skeleton-block"></i><i class="skeleton-block"></i><i class="skeleton-block"></i><i class="skeleton-block"></i></div><div class="card"><i class="skeleton-block"></i><i class="skeleton-block"></i></div></div>':r=='analytics'?'<div class="skeleton-builder"><div class="card skeleton-chart"><i class="skeleton-block"></i></div><div class="card skeleton-chart"><i class="skeleton-block"></i></div></div>':'<div class="skeleton-list"><i class="skeleton-block"></i><i class="skeleton-block"></i></div>'}
 </div>`;
 shell(r,content)
};
const fail=(r,e,retry)=>{
 shell(r,`<div class="error-state" role="alert"><div class="error-mark" aria-hidden="true">!</div><h2>Chưa thể tải nội dung</h2><p>${esc(e.message||'Đã xảy ra lỗi. Vui lòng thử lại.')}</p><div class="error-actions"><button class="btn pri" id="retry">Thử lại</button><a class="btn" href="#/dashboard">Về tổng quan</a></div></div>`);
 $('#retry').onclick=retry||(()=>render())
};
const emptyState=(title,description,action='',icon='file')=>`<section class="empty-state">
 <span class="empty-state-icon" aria-hidden="true">${svg(icon)}</span>
 <div><h3>${esc(title)}</h3><p>${esc(description)}</p>${action?`<div class="empty-state-actions">${action}</div>`:''}</div>
</section>`;

/* ---------- Đăng nhập / đăng ký ---------- */
function authView(){
 let mode='login';
 const draw=()=>{app().className='app bare';app().innerHTML=`<div class="auth">
 <aside class="auth-panel"><div class="logo"><i></i><span class="brand-word">brainst0rm</span></div>
  <div><h1>Khảo sát tâm lý, dữ liệu đáng tin cậy.</h1><p>Thiết kế khảo sát, sàng lọc chất lượng phản hồi và phân tích kết quả trong cùng một không gian nghiên cứu.</p>
  <ul class="auth-points"><li>${svg('check')}<span>11 dạng câu hỏi: Likert, ma trận, xếp hạng, ngữ nghĩa phân biệt…</span></li><li>${svg('check')}<span>Sàng lọc phản hồi: tốc độ, straight-lining, câu kiểm tra chú ý</span></li><li>${svg('check')}<span>Thống kê mô tả, bảng chéo, tương quan và Cronbach’s alpha</span></li></ul></div>
  <small>Nền tảng khảo sát hành vi · brainst0rm</small></aside>
 <main class="auth-main"><form class="card auth-card" id="auth-form" novalidate><h2>${mode=='login'?'Đăng nhập':'Tạo tài khoản'}</h2><p class="sub">${mode=='login'?'Chào mừng trở lại. Tiếp tục với nghiên cứu của bạn.':'Bắt đầu thiết kế khảo sát đầu tiên trong vài phút.'}</p>
 <label for="u">Username<input class="in" id="u" placeholder="ví dụ: user1234" autocomplete="username" maxlength="30" required></label>
 <label for="p">Mật khẩu<span class="pw-wrap"><input class="in" id="p" type="password" placeholder="Tối thiểu 8 ký tự" autocomplete="${mode=='login'?'current-password':'new-password'}" required><button type="button" class="pw-toggle" id="pw-toggle" aria-label="Hiện mật khẩu" aria-pressed="false">${svg('eye')}</button></span></label>
 <div class="err" id="e" role="alert"></div><button class="btn pri" id="go" type="submit">${mode=='login'?'Đăng nhập':'Đăng ký'}</button>
 <p class="auth-switch">${mode=='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <a href="#" id="sw">${mode=='login'?'Đăng ký':'Đăng nhập'}</a></p></form>${credit}</main></div>`;
  $('#sw').onclick=e=>{e.preventDefault();mode=mode=='login'?'reg':'login';draw()};
  $('#pw-toggle').onclick=()=>{const input=$('#p'),show=input.type=='password';input.type=show?'text':'password';$('#pw-toggle').setAttribute('aria-pressed',String(show));$('#pw-toggle').setAttribute('aria-label',show?'Ẩn mật khẩu':'Hiện mật khẩu')};
  const go=async()=>{const button=$('#go');if(button.disabled)return;const restore=setButtonLoading(button,mode=='login'?'Đang đăng nhập…':'Đang đăng ký…');try{$('#e').textContent='';$('#u').removeAttribute('aria-invalid');$('#p').removeAttribute('aria-invalid');const r=await api('POST',mode=='login'?'/auth/login':'/auth/register',{username:$('#u').value,password:$('#p').value});me=r.user;location.hash='#/dashboard';render()}catch(e){restore();$('#e').textContent=e.message;$('#u').setAttribute('aria-invalid','true');$('#p').setAttribute('aria-invalid','true')}};
  $('#auth-form').onsubmit=e=>{e.preventDefault();go()};$('#u').focus()};
 draw()}

/* ---------- Dashboard ---------- */
async function dashboardView(){
 loading('dashboard');
 try{const [o,l]=await Promise.all([api('GET','/analytics/overview'),api('GET','/surveys')]);let list=l.surveys,f='all',query='';
  const hour=new Date().getHours(),greeting=hour<11?'Chào buổi sáng':hour<14?'Chào buổi trưa':hour<18?'Chào buổi chiều':'Chào buổi tối';
  const count=status=>status=='all'?list.length:list.filter(s=>s.status==status).length,running=count('published');
  const kp=[['Tổng phản hồi',o.completed.toLocaleString('vi'),`Trên ${o.totalSurveys} khảo sát`,'inbox',''],['Tỷ lệ hoàn thành',o.completionRate+'%',`${o.completed}/${o.started} lượt bắt đầu`,'checkCircle','teal'],['Thời gian trung bình',fmt(o.avgDuration),'phút:giây mỗi phản hồi','clock','amber'],['Phản hồi bình thường',o.normalRate==null?'—':o.normalRate+'%',`${o.review.needs_review} chờ researcher đánh giá`,'shield','rose']];
  const onboarding=`<section class="card onboard"><div class="onboard-intro"><span class="empty-state-icon" aria-hidden="true">${svg('edit')}</span><h2>Bắt đầu khảo sát đầu tiên</h2><p>Thiết kế bảng hỏi, chia sẻ đường dẫn công khai và theo dõi chất lượng phản hồi ngay khi người tham gia trả lời.</p><button class="btn pri" type="button" data-create-survey>${svg('plus')}Tạo khảo sát mới</button></div>
   <ol class="onboard-steps"><li><b>1</b><div><strong>Thiết kế câu hỏi</strong><small>Chọn trong 11 dạng câu hỏi, kéo thả để sắp xếp và xem trước như người tham gia.</small></div></li><li><b>2</b><div><strong>Xuất bản và chia sẻ</strong><small>Mỗi khảo sát có một đường dẫn công khai; câu trả lời được ghi nhận ẩn danh.</small></div></li><li><b>3</b><div><strong>Sàng lọc và phân tích</strong><small>Đánh giá chất lượng phản hồi, xem thống kê mô tả, tương quan và xuất CSV/Excel.</small></div></li></ol></section>`;
  const listPanel=`<section class="panel"><div class="panel-head"><div><h2>Khảo sát của bạn</h2><p>Chọn một khảo sát để chỉnh sửa, hoặc mở số phản hồi để xem phân tích.</p></div>
   <div class="panel-tools"><label class="search-field">${svg('search')}<span class="sr-only">Tìm khảo sát</span><input type="search" id="survey-search" placeholder="Tìm theo tên khảo sát" autocomplete="off"></label>
   <div class="tabs" role="group" aria-label="Lọc khảo sát theo trạng thái">${[['all','Tất cả'],['published','Đang chạy'],['draft','Bản nháp'],['archived','Lưu trữ']].map((t,i)=>`<button type="button" data-f="${t[0]}" class="${i?'':'on'}" aria-pressed="${i?'false':'true'}">${t[1]}<span class="count">${count(t[0])}</span></button>`).join('')}</div></div></div>
   <div class="srow-head" aria-hidden="true"><span>Khảo sát</span><span>Trạng thái</span><span>Tỷ lệ hoàn thành</span><span>Phản hồi</span></div><div id="list"></div></section>`;
  shell('dashboard',`<div class="head"><div><span class="eyebrow">Tổng quan</span><h1>${greeting}, ${esc(me.username)}</h1><p>${list.length?`${running} khảo sát đang thu thập phản hồi · ${list.length} khảo sát tất cả.`:'Chưa có khảo sát nào. Hãy bắt đầu với khảo sát đầu tiên.'}</p></div><button class="btn pri" type="button" data-create-survey>${svg('plus')}Tạo khảo sát mới</button></div>
  <div class="grid g4">${kp.map(k=>kpi(...k)).join('')}</div>${list.length?listPanel:onboarding}`);
  const draw=()=>{const needle=query.toLocaleLowerCase('vi'),x=list.filter(s=>(f=='all'||s.status==f)&&s.title.toLocaleLowerCase('vi').includes(needle));
   $('#list').innerHTML=x.length?x.map(s=>`<div class="srow" data-id="${s.id}" role="group" tabindex="0" aria-label="Khảo sát ${esc(s.title)}, mở trình tạo">
    <div class="srow-main"><span class="srow-ic ${esc(s.status)}" aria-hidden="true">${svg('file')}</span><div><h3>${esc(s.title)}</h3><small>Cập nhật ${ago(s.updated_at)}</small></div></div>
    <div class="srow-status"><span class="chip ${SL[s.status][1]}">${SL[s.status][0]}</span></div>
    <div class="srow-progress"><div class="bar ${s.status=='published'?'t':''}"><i style="width:${s.completion_rate}%"></i></div><small>${s.completion_rate}%</small></div>
    <div class="srow-count"><a href="#/analytics/${s.id}" onclick="event.stopPropagation()" title="Xem phân tích"><b>${Number(s.response_count).toLocaleString('vi')}</b><small>phản hồi</small></a></div></div>`).join(''):emptyState(
    query?'Không tìm thấy khảo sát phù hợp':'Chưa có khảo sát trong trạng thái này',
    query?`Không có khảo sát nào khớp với “${query}”. Thử từ khóa khác hoặc xóa bộ lọc.`:'Thử chọn trạng thái khác để xem các khảo sát của bạn.',
    '<button class="btn" type="button" data-empty-reset>Xóa bộ lọc</button>',query?'search':'filter');
   const reset=$('[data-empty-reset]');if(reset)reset.onclick=()=>{query='';$('#survey-search').value='';$('[data-f="all"]').click()};
   $$('.srow').forEach(r=>{r.onclick=()=>location.hash='#/builder/'+r.dataset.id;r.onkeydown=e=>{if(e.key=='Enter'&&e.target===r){e.preventDefault();location.hash='#/builder/'+r.dataset.id}}})};
  if(list.length){
   draw();$$('.tabs button').forEach(b=>{b.onclick=()=>{f=b.dataset.f;$$('.tabs button').forEach(x=>{x.classList.toggle('on',x==b);x.setAttribute('aria-pressed',String(x==b))});draw()}});
   $('#survey-search').oninput=e=>{query=e.target.value.trim();draw()};
  }
  $$('[data-create-survey]').forEach(button=>button.onclick=async()=>{if(button.disabled)return;const restore=setButtonLoading(button,'Đang tạo…');try{const s=(await api('POST','/surveys',{title:'Khảo sát chưa đặt tên'})).survey;location.hash='#/builder/'+s.id}catch(e){restore();toast(e.message,'error')}});
 }catch(e){fail('dashboard',e,()=>dashboardView())}}

/* ---------- Research management ---------- */
const researchStatus={
 draft:['Bản nháp','c-draft'],active:['Đang thực hiện','c-run'],paused:['Tạm dừng','c-warn'],
 completed:['Hoàn thành','c-ok'],archived:['Lưu trữ','c-end']
};
const participantStatus={
 registered:'Đã đăng ký',active:'Đang tham gia',completed:'Đã hoàn thành',withdrawn:'Đã rút lui'
};
const researchAction={
 project_created:'Tạo nghiên cứu',project_updated:'Cập nhật nghiên cứu',
 member_added:'Thêm cộng tác viên',member_removed:'Gỡ cộng tác viên',
 survey_linked:'Liên kết khảo sát',survey_unlinked:'Gỡ liên kết khảo sát',note_added:'Thêm ghi chú',
 participant_added:'Tạo mã participant',participant_status_updated:'Cập nhật trạng thái participant',
 dataset_version_created:'Tạo phiên bản dataset'
};
const researchDate=value=>value?new Date(value).toLocaleString('vi-VN',{dateStyle:'medium',timeStyle:'short'}):'—';
async function researchView(projectId){
 loading('research');
 try{
  if(!projectId){
   const result=await api('GET','/research/projects?page=1');
   const projects=result.projects||[];
   shell('research',`<div class="head"><div><span class="eyebrow">Nghiên cứu</span><h1>Quản lý nghiên cứu</h1><p>Tổ chức nghiên cứu, khảo sát và cộng tác viên trong một không gian.</p></div></div>
    <div class="research-create card"><div><h2>Tạo nghiên cứu</h2><p class="research-muted">Bắt đầu một dự án nghiên cứu mới.</p></div>
     <form id="research-create-form"><label>Tên nghiên cứu<input class="in" name="title" maxlength="200" required placeholder="Ví dụ: Căng thẳng và thói quen ngủ"></label>
      <label>Mô tả<textarea name="description" maxlength="2000" rows="3" placeholder="Mục tiêu và phạm vi nghiên cứu"></textarea></label>
      <button class="btn pri" type="submit">${svg('plus')}Tạo nghiên cứu</button></form></div>
    <div class="research-project-list" id="research-project-list">${projects.length?projects.map(project=>`<a class="research-project-card card" href="#/research/${project.id}">
      <div class="research-card-top"><span class="chip ${researchStatus[project.status]?.[1]||'c-end'}">${researchStatus[project.status]?.[0]||esc(project.status)}</span><small>${project.role==='owner'?'Chủ sở hữu':'Cộng tác viên'}</small></div>
      <h2>${esc(project.title)}</h2><p>${esc(project.description||'Chưa có mô tả')}</p>
      <div class="research-card-meta"><span>${project.surveyCount} khảo sát liên kết</span><span>Cập nhật ${researchDate(project.updated_at)}</span></div></a>`).join(''):emptyState('Chưa có nghiên cứu','Tạo nghiên cứu đầu tiên bằng biểu mẫu bên trên để tổ chức khảo sát, cộng tác viên, participant và ghi chú trong cùng một nơi.','','research')}</div>
    ${result.total>projects.length?`<button class="btn research-load-more" id="research-load-more" data-page="1">Tải thêm nghiên cứu</button>`:''}`);
   const form=$('#research-create-form');
   form.onsubmit=async event=>{
    event.preventDefault();const button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang tạo…');
    try{const data=Object.fromEntries(new FormData(form));const created=await api('POST','/research/projects',data);location.hash='#/research/'+created.project.id}
    catch(error){restore();toast(error.message,'error')}
   };
   const more=$('#research-load-more');
   if(more)more.onclick=async()=>{
    const page=Number(more.dataset.page)+1,restore=setButtonLoading(more,'Đang tải…');
    try{const next=await api('GET',`/research/projects?page=${page}`);$('#research-project-list').insertAdjacentHTML('beforeend',next.projects.map(project=>`<a class="research-project-card card" href="#/research/${project.id}"><div class="research-card-top"><span class="chip ${researchStatus[project.status]?.[1]||'c-end'}">${researchStatus[project.status]?.[0]||esc(project.status)}</span><small>${project.role==='owner'?'Chủ sở hữu':'Cộng tác viên'}</small></div><h2>${esc(project.title)}</h2><p>${esc(project.description||'Chưa có mô tả')}</p><div class="research-card-meta"><span>${project.surveyCount} khảo sát liên kết</span><span>Cập nhật ${researchDate(project.updated_at)}</span></div></a>`).join(''));if((page*next.pageSize)>=next.total)more.remove();else{more.dataset.page=String(page);restore()}}
    catch(error){restore();toast(error.message,'error')}
   };
   return
  }
  const {project}=await api('GET',`/research/projects/${encodeURIComponent(projectId)}`);
  const canEdit=['owner','researcher'].includes(project.role),isOwner=project.role==='owner';
  const [surveyResult,participantResult]=await Promise.all([
   api('GET','/research/surveys'),api('GET',`/research/projects/${encodeURIComponent(projectId)}/participants?page=1`)
  ]);
  let participants=participantResult.participants||[];
  let participantPage=participantResult.page||1;
  const participantTotal=participantResult.total||0;
  const available=(surveyResult.surveys||[]).filter(survey=>!project.surveys.some(link=>link.id===survey.id));
  const renderParticipantRow=participant=>`<tr><td><code>${esc(participant.participant_code)}</code></td><td>${canEdit?`<label class="sr-only" for="participant-${participant.id}">Trạng thái participant ${esc(participant.participant_code)}</label><select class="sel research-participant-status" id="participant-${participant.id}" data-participant-id="${participant.id}" data-current-status="${participant.status}">${Object.entries(participantStatus).map(([status,label])=>`<option value="${status}" ${status===participant.status?'selected':''}>${label}</option>`).join('')}</select>`:`<span class="chip ${participant.status==='completed'?'c-ok':participant.status==='withdrawn'?'c-end':'c-warn'}">${participantStatus[participant.status]||esc(participant.status)}</span>`}</td><td>${researchDate(participant.created_at)}</td></tr>`;
  shell('research',`<div class="research-back"><a href="#/research">← Tất cả nghiên cứu</a><span class="role-badge">${project.role==='owner'?'Chủ sở hữu':project.role==='researcher'?'Researcher':'Reviewer'}</span></div>
   <div class="head research-detail-head"><div><span class="chip ${researchStatus[project.status]?.[1]||'c-end'}">${researchStatus[project.status]?.[0]||esc(project.status)}</span><h1>${esc(project.title)}</h1><p>${esc(project.description||'Chưa có mô tả')}</p></div>
    ${canEdit?`<label class="research-status-select">Trạng thái<select class="sel" id="research-status">${Object.entries(researchStatus).map(([key,[label]])=>`<option value="${key}" ${project.status===key?'selected':''}>${label}</option>`).join('')}</select></label>`:''}</div>
   <div class="research-overview grid g4">${[['Khảo sát liên kết',project.surveys.length,'Dữ liệu gốc không bị thay đổi','link',''],['Phản hồi hoàn tất',project.completedResponseCount,'Tổng thực từ các khảo sát liên kết','inbox','teal'],['Mã participant',project.participantCount,'Không chứa tên hoặc thông tin liên hệ','tag','amber'],['Cộng tác viên',project.members.length,'Researcher và Reviewer','users','rose']].map(k=>kpi(...k)).join('')}</div>
   <section class="research-section card research-participants"><div class="research-section-head"><div><h2>Participants</h2><p class="research-muted">Mã ngẫu nhiên chỉ dùng trong nghiên cứu này; trạng thái được researcher cập nhật thủ công, không liên kết với phản hồi khảo sát.</p></div>${canEdit?'<button class="btn pri" id="research-add-participant">Tạo mã participant</button>':''}</div>
    <p class="quality-disclaimer">Không lưu tên, email, thông tin liên hệ hoặc dữ liệu định danh. Mã là pseudonymous, không phải ẩn danh tuyệt đối nếu ghép dữ liệu ngoài hệ thống. brainst0rm chưa ghi nhận consent hoặc xác minh đồng ý của người giám hộ.</p>
    <div class="analytics-table-wrap" id="research-participant-list">${participants.length?`<table class="tbl"><thead><tr><th>Mã</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>${participants.map(renderParticipantRow).join('')}</tbody></table>`:emptyState('Chưa có mã participant','Tạo mã ngẫu nhiên để theo dõi trạng thái tham gia trong nghiên cứu này. Mã không liên kết với câu trả lời.','','tag')}</div>
    ${participantTotal>participants.length?'<button class="btn research-load-more" id="research-participant-more">Tải thêm mã</button>':''}</section>
   ${canEdit?`<form id="research-edit-form" class="card research-edit-form"><h2>Thông tin nghiên cứu</h2><label>Tên<input class="in" name="title" maxlength="200" required value="${esc(project.title)}"></label><label>Mô tả<textarea name="description" maxlength="2000" rows="3">${esc(project.description||'')}</textarea></label><button class="btn pri" type="submit">Lưu thay đổi</button></form>`:''}
   <section class="research-section"><div class="research-section-head"><div><h2>Khảo sát</h2><p class="research-muted">Một nghiên cứu có thể liên kết nhiều khảo sát hiện có.</p></div></div>
    ${canEdit?`<form id="research-link-form" class="research-inline-form"><label class="sr-only" for="research-survey-select">Chọn khảo sát để liên kết</label><select class="sel" id="research-survey-select" ${available.length?'':'disabled'}><option value="">${available.length?'Chọn khảo sát của bạn':'Không có khảo sát khả dụng'}</option>${available.map(survey=>`<option value="${survey.id}">${esc(survey.title)}</option>`).join('')}</select><button class="btn pri" ${available.length?'':'disabled'}>Liên kết khảo sát</button></form>`:''}
    <div class="research-survey-list">${project.surveys.length?project.surveys.map(survey=>`<article class="research-survey-row"><div><a href="#/analytics/${survey.id}"><strong>${esc(survey.title)}</strong></a><small>${survey.status==='published'?'Đang thu thập':survey.status==='archived'?'Lưu trữ':'Bản nháp'} · Liên kết ${researchDate(survey.linkedAt)}</small></div><div class="research-row-actions"><a class="btn" href="#/analytics/${survey.id}">Phân tích</a>${isOwner||project.role==='researcher'?`<button class="btn" type="button" data-unlink="${survey.id}">Gỡ liên kết</button>`:''}</div></article>`).join(''):emptyState('Chưa liên kết khảo sát', canEdit?'Chọn một khảo sát từ danh sách bên trên để thêm dữ liệu vào nghiên cứu.':'Owner hoặc Researcher có thể liên kết khảo sát với nghiên cứu.','','link')}</div></section>
   <section class="research-section card research-versions"><div class="research-section-head"><div><h2>Phiên bản dataset</h2><p class="research-muted">Theo dõi số liệu và tính toàn vẹn của dữ liệu nghiên cứu theo thời điểm.</p></div>${canEdit?`<button class="btn pri" id="research-create-version" ${project.surveys.length?'':'disabled'}>Tạo phiên bản</button>`:''}</div>
    <p class="research-version-note">Lưu thời điểm, khảo sát, số lượng phản hồi và HMAC-SHA-256; câu trả lời không được sao chép và phiên bản không thể khôi phục dữ liệu. Giữ JWT_SECRET ổn định để so sánh checksum giữa các lần chụp.</p>
    ${canEdit&&!project.surveys.length?'<p class="research-muted">Liên kết ít nhất một khảo sát để tạo phiên bản.</p>':''}
    <div id="research-dataset-versions" role="status" aria-live="polite">Đang tải phiên bản…</div></section>
   <div class="research-detail-grid"><section class="card research-panel"><h2>Cộng tác viên</h2><p class="research-muted">Reviewer chỉ xem dữ liệu và không thể thay đổi nghiên cứu.</p>
    ${isOwner?`<form id="research-member-form" class="research-member-form"><label>Username<input class="in" name="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_]+" required placeholder="Tên tài khoản đã đăng ký"></label><label>Vai trò<select class="sel" name="role"><option value="researcher">Researcher · chỉnh sửa</option><option value="reviewer">Reviewer · chỉ xem</option></select></label><button class="btn pri">Thêm</button></form>`:''}
    <div class="research-member-list">${project.members.length?project.members.map(member=>`<div class="research-member"><span class="research-avatar" aria-hidden="true">${esc((member.username||'?').slice(0,1).toUpperCase())}</span><div><strong>${esc(member.username)}</strong><small>${member.role==='researcher'?'Researcher':'Reviewer'}</small></div>${isOwner?`<button class="btn" type="button" data-remove-member="${member.user_id}" aria-label="Gỡ ${esc(member.username)}">Gỡ</button>`:''}</div>`).join(''):emptyState('Chưa có cộng tác viên', isOwner?'Thêm thành viên bằng username ở biểu mẫu bên trên.':'Chủ nghiên cứu chưa thêm cộng tác viên.','','users')}</div>
   </section><section class="card research-panel"><h2>Ghi chú nghiên cứu</h2><p class="research-muted">Không nhập thông tin định danh cá nhân hoặc dữ liệu nhạy cảm vào ghi chú.</p>
    ${canEdit?'<form id="research-note-form"><label class="sr-only" for="research-note">Ghi chú</label><textarea id="research-note" name="body" maxlength="5000" rows="3" required placeholder="Thêm ghi chú cho nhóm nghiên cứu"></textarea><button class="btn pri">Thêm ghi chú</button></form>':''}
    <div class="research-notes">${project.notes.length?project.notes.map(note=>`<article class="research-note"><p>${esc(note.body)}</p><small>${esc(note.username||'Thành viên')} · ${researchDate(note.created_at)}</small></article>`).join(''):emptyState('Chưa có ghi chú', canEdit?'Ghi lại quyết định hoặc bối cảnh nghiên cứu; không nhập dữ liệu định danh cá nhân.':'Ghi chú do nhóm nghiên cứu chia sẻ sẽ hiển thị tại đây.','','note')}</div>
   </section></div>
   <section class="card research-activity"><h2>Lịch sử hoạt động</h2><div class="research-activity-list">${project.activity.length?project.activity.map(event=>`<div><i aria-hidden="true"></i><p><strong>${esc(researchAction[event.action]||event.action)}</strong><small>${esc(event.username||'Thành viên')} · ${researchDate(event.created_at)}</small></p></div>`).join(''):emptyState('Chưa có hoạt động','Các thay đổi trong nghiên cứu sẽ được ghi lại tại đây.','','activity')}</div></section>`);
  const edit=$('#research-edit-form');
  if(edit)edit.onsubmit=async event=>{
   event.preventDefault();const button=$('button[type=submit]',edit),restore=setButtonLoading(button,'Đang lưu…');
   try{await api('PATCH',`/research/projects/${project.id}`,Object.fromEntries(new FormData(edit)));toast('Đã cập nhật nghiên cứu');await researchView(project.id)}
   catch(error){restore();toast(error.message,'error')}
  };
  let datasetVersions=[],datasetVersionPage=1,datasetVersionTotal=0;
  const versionList=$('#research-dataset-versions');
  const renderDatasetVersions=()=>{
   if(!datasetVersions.length){versionList.innerHTML=emptyState('Chưa có phiên bản dataset','Tạo phiên bản để ghi nhận checksum và số lượng của dữ liệu khảo sát hiện tại.','','database');return}
   versionList.innerHTML=`<div class="analytics-table-wrap"><table class="tbl"><thead><tr><th>Thời điểm chụp</th><th>Khảo sát</th><th>Phản hồi</th><th>Checksum HMAC-SHA-256</th></tr></thead><tbody>${datasetVersions.map(version=>`<tr><td>${researchDate(version.captured_at)}</td><td>${Number(version.survey_count).toLocaleString('vi')}</td><td>${Number(version.response_count).toLocaleString('vi')}</td><td><code class="research-version-checksum" title="${esc(version.checksum)}">${esc(version.checksum)}</code></td></tr>`).join('')}</tbody></table></div>${datasetVersions.length<datasetVersionTotal?'<button class="btn research-load-more" id="research-version-more">Tải thêm phiên bản</button>':''}`;
   const moreVersions=$('#research-version-more');
   if(moreVersions)moreVersions.onclick=async()=>{const restore=setButtonLoading(moreVersions,'Đang tải…');await loadDatasetVersions(datasetVersionPage+1,true,restore)};
  };
  async function loadDatasetVersions(page=1,append=false,restore=()=>{}){
   versionList.setAttribute('aria-busy','true');
   if(!append)versionList.innerHTML='<p class="research-version-loading">Đang tải phiên bản…</p>';
   try{
    const result=await api('GET',`/research/projects/${project.id}/dataset-versions?page=${page}`);
    datasetVersions=append?datasetVersions.concat(result.versions||[]):(result.versions||[]);
    datasetVersionPage=result.page;datasetVersionTotal=result.total;
    versionList.setAttribute('aria-busy','false');renderDatasetVersions();
   }catch(error){
    versionList.setAttribute('aria-busy','false');
    if(append)restore();
    versionList.innerHTML=`<div class="research-version-error" role="alert"><span>${esc(error.message)}</span><button class="btn" id="research-version-retry">Thử lại</button></div>`;
    const retry=$('#research-version-retry');
    if(retry)retry.onclick=()=>loadDatasetVersions();
   }
  }
  const createVersion=$('#research-create-version');
  if(createVersion)createVersion.onclick=async()=>{
   const restore=setButtonLoading(createVersion,'Đang tạo…');
   try{await api('POST',`/research/projects/${project.id}/dataset-versions`,{});restore();toast('Đã ghi nhận phiên bản dataset');await loadDatasetVersions()}
   catch(error){restore();toast(error.message,'error')}
  };
  loadDatasetVersions();
  const status=$('#research-status');
  if(status)status.onchange=async()=>{status.disabled=true;try{await api('PATCH',`/research/projects/${project.id}`,{status:status.value});toast('Đã cập nhật trạng thái');await researchView(project.id)}catch(error){status.disabled=false;toast(error.message,'error')}};
  const addParticipant=$('#research-add-participant');
  if(addParticipant)addParticipant.onclick=async()=>{const restore=setButtonLoading(addParticipant,'Đang tạo mã…');try{const result=await api('POST',`/research/projects/${project.id}/participants`,{});toast(`Đã tạo mã ${result.participant.participant_code}`);await researchView(project.id)}catch(error){restore();toast(error.message,'error')}};
  const wireParticipantStatuses=root=>$$('.research-participant-status',root).forEach(select=>select.onchange=async()=>{
   const previous=select.dataset.currentStatus;
   select.disabled=true;
   try{const result=await api('PATCH',`/research/projects/${project.id}/participants/${select.dataset.participantId}`,{status:select.value});select.dataset.currentStatus=result.participant.status;toast('Đã cập nhật trạng thái participant');await researchView(project.id)}
   catch(error){select.value=previous;select.disabled=false;window.BrainstormUI.refreshDropdown(select);toast(error.message,'error')}
  });
  wireParticipantStatuses();
  const moreParticipants=$('#research-participant-more');
  if(moreParticipants)moreParticipants.onclick=async()=>{
   const page=participantPage+1,restore=setButtonLoading(moreParticipants,'Đang tải…');
   try{
    const result=await api('GET',`/research/projects/${project.id}/participants?page=${page}`);
    participants.push(...result.participants);
    const list=$('#research-participant-list');
    let body=$('tbody',list);
    if(!body){list.innerHTML='<table class="tbl"><thead><tr><th>Mã</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody></tbody></table>';body=$('tbody',list)}
    body.insertAdjacentHTML('beforeend',result.participants.map(renderParticipantRow).join(''));
    participantPage=result.page;
    wireParticipantStatuses(list);
    if(participants.length>=participantTotal)moreParticipants.remove();else restore()
   }catch(error){restore();toast(error.message,'error')}
  };
  const linkForm=$('#research-link-form');
  if(linkForm)linkForm.onsubmit=async event=>{event.preventDefault();const select=$('#research-survey-select'),button=$('button',linkForm),restore=setButtonLoading(button,'Đang liên kết…');try{await api('POST',`/research/projects/${project.id}/surveys/${encodeURIComponent(select.value)}`,{});toast('Đã liên kết khảo sát');await researchView(project.id)}catch(error){restore();toast(error.message,'error')}};
  $$('[data-unlink]').forEach(button=>button.onclick=async()=>{if(!await confirmAction('Gỡ liên kết không xóa khảo sát hoặc phản hồi gốc.','Gỡ khảo sát khỏi nghiên cứu?','Gỡ liên kết'))return;button.disabled=true;try{await api('DELETE',`/research/projects/${project.id}/surveys/${button.dataset.unlink}`);toast('Đã gỡ liên kết');await researchView(project.id)}catch(error){button.disabled=false;toast(error.message,'error')}});
  const memberForm=$('#research-member-form');
  if(memberForm)memberForm.onsubmit=async event=>{event.preventDefault();const button=$('button',memberForm),restore=setButtonLoading(button,'Đang thêm…');try{await api('POST',`/research/projects/${project.id}/members`,Object.fromEntries(new FormData(memberForm)));toast('Đã thêm cộng tác viên');await researchView(project.id)}catch(error){restore();toast(error.message,'error')}};
  $$('[data-remove-member]').forEach(button=>button.onclick=async()=>{if(!await confirmAction('Thành viên sẽ mất quyền truy cập nghiên cứu và các khảo sát được chia sẻ.','Gỡ cộng tác viên?','Gỡ thành viên'))return;button.disabled=true;try{await api('DELETE',`/research/projects/${project.id}/members/${button.dataset.removeMember}`);toast('Đã gỡ cộng tác viên');await researchView(project.id)}catch(error){button.disabled=false;toast(error.message,'error')}});
  const noteForm=$('#research-note-form');
  if(noteForm)noteForm.onsubmit=async event=>{event.preventDefault();const button=$('button',noteForm),restore=setButtonLoading(button,'Đang lưu…');try{await api('POST',`/research/projects/${project.id}/notes`,Object.fromEntries(new FormData(noteForm)));toast('Đã thêm ghi chú');await researchView(project.id)}catch(error){restore();toast(error.message,'error')}};
 }catch(error){fail('research',error,()=>researchView(projectId))}
}

/* ---------- Quản trị viên ---------- */
const adminTypes=types.map(([id,,label])=>[id,label]);
const adminQualityLabel={normal:'Không có cờ',suspicious:'Có tín hiệu',spam:'Nhiều tín hiệu'};
const adminTabs=section=>`<div class="admin-tabs"><a class="${section=='overview'?'on':''}" href="#/admin">Tổng quan</a><a class="${section=='users'?'on':''}" href="#/admin/users">Tài khoản</a><a class="${section=='surveys'?'on':''}" href="#/admin/surveys">Khảo sát</a></div>`;
const adminPager=(path,page,pageSize,total)=>{
 const pageCount=Math.max(1,Math.ceil(total/pageSize)),base='#/admin/'+path;
 return total>pageSize?`<div class="pagination"><span>Hiển thị ${(page-1)*pageSize+1}–${Math.min(page*pageSize,total)} trên ${total}</span><div><a class="btn" href="${base}?page=${Math.max(1,page-1)}" aria-label="Trang trước" ${page===1?'aria-disabled="true" tabindex="-1"':''}>‹</a><span>Trang ${page} / ${pageCount}</span><a class="btn" href="${base}?page=${Math.min(pageCount,page+1)}" aria-label="Trang tiếp theo" ${page===pageCount?'aria-disabled="true" tabindex="-1"':''}>›</a></div></div>`:''
};
function wireAdminOwnerSearch(root){
 const input=$('[data-owner-search]',root),select=$('[data-owner-select]',root);if(!input||!select)return;
 let requestId=0;const initialOptions=select.innerHTML;
 input.oninput=async()=>{const query=input.value.trim(),id=++requestId;if(query.length<2){select.innerHTML=initialOptions;return}
  try{const result=await api('GET','/admin/users/search?q='+encodeURIComponent(query));if(id!==requestId)return;
   select.innerHTML=result.users.length?result.users.map(u=>`<option value="${u.id}">${esc(u.username)}</option>`).join(''):'<option value="">Không tìm thấy tài khoản</option>'
  }catch(e){if(id===requestId)toast(e.message,'error')}}
}
function wireAdminTable(root,onBulk){
 const rows=$$('[data-admin-row]',root),search=$('[data-admin-search]',root),filter=$('[data-admin-filter]',root);
 const selectAll=$('[data-admin-select-all]',root),bulk=$('[data-admin-bulk]',root),count=$('[data-admin-result-count]',root),empty=$('[data-admin-filter-empty]',root);
 const update=()=>{
  const query=(search?.value||'').trim().toLocaleLowerCase('vi'),status=filter?.value||'';
  rows.forEach(row=>{row.hidden=!(row.textContent.toLocaleLowerCase('vi').includes(query)&&(!status||row.dataset.filter==status))});
  const visible=rows.filter(row=>!row.hidden),selected=rows.filter(row=>$('[data-admin-select-row]',row)?.checked),selectable=visible.filter(row=>{const checkbox=$('[data-admin-select-row]',row);return checkbox&&!checkbox.disabled}),visibleSelected=selectable.filter(row=>$('[data-admin-select-row]',row)?.checked);
  if(empty)empty.hidden=visible.length>0;
  if(count)count.textContent=`${visible.length} mục trong trang này · ${Number(count.dataset.total).toLocaleString('vi')} tổng cộng`;
  if(selectAll){selectAll.checked=selectable.length>0&&visibleSelected.length===selectable.length;selectAll.indeterminate=visibleSelected.length>0&&visibleSelected.length<selectable.length;selectAll.disabled=!selectable.length}
  if(bulk){bulk.hidden=!selected.length;bulk.textContent=`Xóa ${selected.length} mục đã chọn`}
 };
 search?.addEventListener('input',update);filter?.addEventListener('change',update);
 selectAll?.addEventListener('change',()=>{rows.filter(row=>!row.hidden).forEach(row=>{const checkbox=$('[data-admin-select-row]',row);if(checkbox&&!checkbox.disabled)checkbox.checked=selectAll.checked});update()});
 rows.forEach(row=>$('[data-admin-select-row]',row)?.addEventListener('change',update));
 $$('[data-column-toggle]',root).forEach(toggle=>toggle.addEventListener('change',()=>{
  const table=$('table.admin-table',root);if(!table)return;
  const key=toggle.dataset.columnToggle;
  $$(`[data-column="${key}"]`,table).forEach(cell=>{cell.hidden=!toggle.checked})
 }));
 $$('[data-admin-sort]',root).forEach(button=>button.addEventListener('click',()=>{
  const table=button.closest('table'),body=$('tbody',table),index=Number(button.dataset.adminSort),column=button.closest('th');
  const ascending=button.dataset.direction!='asc';
  $$('[data-admin-sort]',table).forEach(other=>{other.dataset.direction='';other.closest('th').removeAttribute('aria-sort')});
  button.dataset.direction=ascending?'asc':'desc';column.setAttribute('aria-sort',ascending?'ascending':'descending');
  [...body.rows].sort((a,b)=>{
   const av=$(`[data-sort-${index}]`,a)?.getAttribute(`data-sort-${index}`)||a.cells[index]?.textContent.trim()||'';
   const bv=$(`[data-sort-${index}]`,b)?.getAttribute(`data-sort-${index}`)||b.cells[index]?.textContent.trim()||'';
   const an=Number(av),bn=Number(bv),numeric=av!==''&&bv!==''&&Number.isFinite(an)&&Number.isFinite(bn);
   return (numeric?an-bn:av.localeCompare(bv,'vi',{numeric:true,sensitivity:'base'}))*(ascending?1:-1)
  }).forEach(row=>body.append(row))
 }));
 bulk?.addEventListener('click',()=>onBulk&&onBulk(rows.filter(row=>$('[data-admin-select-row]',row)?.checked)));
 update()
}
function editUserDialog(username){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');
  dialog.className='confirm-dialog admin-edit-dialog';
  dialog.innerHTML=`<form class="dialog-content" method="dialog" id="admin-edit-user"><span class="chip c-run">Tài khoản</span><h2>Chỉnh sửa tài khoản</h2><label>Username<input class="in" name="username" value="${esc(username)}" minlength="3" maxlength="30" pattern="[A-Za-z0-9_]+" required></label><label>Mật khẩu mới <span>Để trống nếu không đổi</span><input class="in" name="password" type="password" minlength="8" maxlength="72" autocomplete="new-password"></label><div class="dialog-actions"><button class="btn" type="button" data-edit-cancel>Hủy</button><button class="btn pri" type="submit">Lưu thay đổi</button></div></form>`;
  let finished=false;
  const finish=value=>{if(finished)return;finished=true;if(dialog.open)dialog.close();dialog.remove();resolve(value)};
  $('#admin-edit-user',dialog).addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;finish({username:form.username.value.trim(),password:form.password.value||undefined})});
  $('[data-edit-cancel]',dialog).onclick=()=>finish(null);
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null)});
  dialog.addEventListener('click',event=>{if(event.target===dialog)finish(null)});
  document.body.append(dialog);dialog.showModal();$('input[name=username]',dialog).focus()
 })
}
function wireAdminResponses(surveyId,page){
 const root=$('#admin-response-list');
 if(!root)return;
 const rows=$$('[data-admin-response]',root),search=$('[data-response-search]',root),filter=$('[data-response-filter]',root);
 const selectAll=$('[data-response-select-all]',root),bulk=$('[data-response-bulk]',root),count=$('[data-response-count]',root),empty=$('[data-response-empty]',root);
 const update=()=>{
  const query=(search?.value||'').trim().toLocaleLowerCase('vi'),status=filter?.value||'';
  rows.forEach(row=>{row.hidden=!(row.dataset.search.toLocaleLowerCase('vi').includes(query)&&(!status||row.dataset.status==status))});
  const visible=rows.filter(row=>!row.hidden),selected=rows.filter(row=>$('[data-response-select]',row)?.checked),visibleSelected=visible.filter(row=>$('[data-response-select]',row)?.checked);
  if(empty)empty.hidden=visible.length>0;
  if(count)count.textContent=`${visible.length} phản hồi trong trang này`;
  if(selectAll){selectAll.checked=visible.length>0&&visibleSelected.length===visible.length;selectAll.indeterminate=visibleSelected.length>0&&visibleSelected.length<visible.length;selectAll.disabled=!visible.length}
  if(bulk){bulk.hidden=!selected.length;bulk.textContent=`Xóa ${selected.length} phản hồi`}
 };
 search?.addEventListener('input',update);filter?.addEventListener('change',update);
 selectAll?.addEventListener('change',()=>{rows.filter(row=>!row.hidden).forEach(row=>{$('[data-response-select]',row).checked=selectAll.checked});update()});
 rows.forEach(row=>$('[data-response-select]',row)?.addEventListener('change',update));
 bulk?.addEventListener('click',async()=>{
  const selected=rows.filter(row=>$('[data-response-select]',row)?.checked);
  if(!selected.length||!await confirmAction(`Xóa ${selected.length} phản hồi và toàn bộ câu trả lời liên quan?`,'Xóa phản hồi đã chọn?','Xóa phản hồi'))return;
  bulk.disabled=true;const results=await Promise.allSettled(selected.map(row=>api('DELETE','/admin/responses/'+row.dataset.id)));
  const failed=results.filter(result=>result.status=='rejected').length;
  toast(failed?`Đã xóa ${results.length-failed}/${results.length}; ${failed} phản hồi chưa xóa được.`:`Đã xóa ${results.length} phản hồi`);
  adminView('surveys',surveyId,Math.max(1,results.length===rows.length&&page>1?page-1:page))
 });
 update()
}
const adminQuestion=(q,i)=>`<section class="admin-question" data-admin-question="${i}">
 <div class="admin-question-head"><strong>Câu hỏi ${i+1}</strong><button class="btn danger" type="button" data-question-remove="${i}">Xóa câu hỏi</button></div>
 <label>Nội dung câu hỏi<input class="in" data-q-text value="${esc(q.question_text)}" maxlength="500" required></label>
 <div class="admin-question-fields"><label>Loại câu hỏi<select class="sel" data-q-type>${adminTypes.map(([id,label])=>`<option value="${id}" ${id==q.question_type?'selected':''}>${esc(label)}</option>`).join('')}</select></label>
 <label class="admin-check"><input type="checkbox" data-q-required ${q.is_required?'checked':''}> Bắt buộc trả lời</label></div>
 <label>Tùy chọn (mỗi dòng một đáp án)<textarea class="in admin-options" data-q-options rows="3">${esc((q.options||[]).map(o=>o.label).join('\n'))}</textarea></label>
 <label>Cài đặt bổ sung (JSON)<textarea class="in admin-options" data-q-settings rows="3" spellcheck="false">${esc(JSON.stringify(q.settings||{},null,2))}</textarea></label>
 </section>`;

async function adminView(section='overview',surveyId,page=1){
 if(!me?.is_admin){location.hash='#/dashboard';return}
 page=Math.max(1,page);
 loading('admin');
 const tabs=adminTabs(section);
 const navBack=`<div class="head admin-page-header"><div><h1>Quản trị hệ thống</h1><p>Quản lý tài khoản, khảo sát và phản hồi trên toàn hệ thống.</p></div></div>${tabs}`;
 try{
  if(section=='users'){
  const data=await api('GET','/admin/users?page='+page),{users,total,pageSize}=data;
  const actualPage=Math.min(page,Math.max(1,Math.ceil(total/pageSize)));
  if(actualPage!==page)return adminView('users',null,actualPage);
   shell('admin',`${navBack}<div class="admin-layout"><section class="card"><h2>Tạo tài khoản</h2><p class="admin-panel-hint">Tạo thông tin đăng nhập cho người dùng mới.</p><form id="admin-user-create" class="admin-form">
    <label>Username<input class="in" name="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_]+" required></label>
    <label>Mật khẩu tạm<input class="in" name="password" type="password" minlength="8" maxlength="72" required></label>
    <button class="btn pri" type="submit">Thêm tài khoản</button></form>
    <p class="admin-note">Quyền quản trị được cấp thủ công bằng cột <code>is_admin</code> trong database.</p></section>
    <section class="card admin-table-card"><div class="admin-section-head"><div><h2>Tài khoản</h2><p class="admin-panel-hint">Quản lý đăng nhập và thông tin của từng tài khoản.</p></div><a class="btn admin-action-link" href="#/admin/surveys">Quản lý khảo sát</a></div>
    <div class="admin-table-tools"><label class="admin-filter-label">Vai trò<select class="sel" data-admin-filter><option value="">Tất cả vai trò</option><option value="admin">Admin</option><option value="user">Người dùng</option></select></label><span class="admin-result-count" data-admin-result-count data-total="${total}"></span><details class="admin-columns"><summary class="btn">Cột</summary><div>${[['role','Quyền'],['created','Ngày tạo']].map(([key,label])=>`<label><input type="checkbox" data-column-toggle="${key}" checked> ${label}</label>`).join('')}</div></details><label class="admin-select-all"><input type="checkbox" data-admin-select-all> Chọn tất cả</label><button class="btn danger" data-admin-bulk hidden>Xóa mục đã chọn</button></div>
    ${users.length?`<div class="admin-table-wrap"><table class="tbl admin-table"><thead><tr><th><span class="sr-only">Chọn</span></th><th><button type="button" data-admin-sort="1">Tài khoản</button></th><th data-column="role"><button type="button" data-admin-sort="2">Quyền</button></th><th data-column="created"><button type="button" data-admin-sort="3">Ngày tạo</button></th><th>Thao tác</th></tr></thead><tbody>${users.map(u=>`<tr data-admin-row data-filter="${u.is_admin?'admin':'user'}">
     <td><input type="checkbox" data-admin-select-row aria-label="Chọn tài khoản ${esc(u.username)}" ${u.id==me.id?'disabled title="Không thể xóa tài khoản đang đăng nhập"':''}></td>
     <td data-sort-1="${esc(u.username.toLocaleLowerCase('vi'))}"><strong>${esc(u.username)}</strong><small class="admin-id">${esc(u.id)}</small></td>
     <td data-column="role" data-sort-2="${u.is_admin?'1':'0'}"><span class="chip ${u.is_admin?'c-run':'c-end'}">${u.is_admin?'Admin':'Người dùng'}</span></td>
     <td data-column="created" data-sort-3="${esc(u.created_at)}">${new Date(u.created_at).toLocaleDateString('vi')}</td>
     <td><div class="admin-row-actions"><button class="btn" data-user-edit="${u.id}" data-username="${esc(u.username)}">Chỉnh sửa</button><button class="btn danger" data-user-remove="${u.id}" ${u.id==me.id?'disabled title="Không thể xóa tài khoản đang đăng nhập"':''}>Xóa</button></div></td>
    </tr>`).join('')}</tbody></table><div class="admin-filter-empty" data-admin-filter-empty hidden>${emptyState('Không tìm thấy tài khoản phù hợp','Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.','','search')}</div></div>`:emptyState('Chưa có tài khoản ở trang này','Tài khoản sẽ xuất hiện khi có người dùng đăng ký.','','users')}${adminPager('users',page,pageSize,total)}</section></div>`);
   wireAdminTable(app(),async selected=>{
    if(!await confirmAction(`Xóa ${selected.length} tài khoản và các khảo sát, câu hỏi, phản hồi liên quan?`,'Xóa tài khoản đã chọn?','Xóa tài khoản'))return;
    const button=$('[data-admin-bulk]');button.disabled=true;
    const errors=[];
    for(const row of selected){try{await api('DELETE','/admin/users/'+row.querySelector('[data-user-remove]').dataset.userRemove)}catch(error){errors.push(error)}}
    toast(errors.length?`Đã xóa ${selected.length-errors.length}/${selected.length}; ${errors.length} tài khoản chưa xóa được. ${errors[0].message}`:`Đã xóa ${selected.length} tài khoản`);
    adminView('users',null,selected.length===users.length&&page>1?page-1:page)
   });
   $('#admin-user-create').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang tạo…');try{await api('POST','/admin/users',{username:form.username.value,password:form.password.value});toast('Đã tạo tài khoản');adminView('users')}catch(err){restore();toast(err.message,'error')}};
   $$('[data-user-edit]').forEach(button=>button.onclick=async()=>{const changes=await editUserDialog(button.dataset.username);if(!changes)return;const restore=setButtonLoading(button,'Đang lưu…');try{await api('PUT','/admin/users/'+button.dataset.userEdit,changes);toast('Đã cập nhật tài khoản');adminView('users')}catch(err){restore();toast(err.message,'error')}});
   $$('[data-user-remove]').forEach(button=>button.onclick=async()=>{if(!await confirmAction('Tài khoản, khảo sát, câu hỏi và phản hồi liên quan sẽ bị xóa vĩnh viễn.','Xóa tài khoản?','Xóa tài khoản'))return;const lastOnPage=$$('[data-user-remove]').length===1,restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/admin/users/'+button.dataset.userRemove);toast('Đã xóa tài khoản');adminView('users',null,lastOnPage&&page>1?page-1:page)}catch(err){restore();toast(err.message,'error')}});
   return
  }
  if(section=='surveys'&&!surveyId){
   const [data,accountData]=await Promise.all([api('GET','/admin/surveys?page='+page),api('GET','/admin/users')]);
   const {surveys,total,pageSize}=data,users=accountData.users;
   const actualPage=Math.min(page,Math.max(1,Math.ceil(total/pageSize)));
   if(actualPage!==page)return adminView('surveys',null,actualPage);
   shell('admin',`${navBack}<section class="card admin-create-survey"><h2>Tạo khảo sát cho tài khoản</h2><p class="admin-panel-hint">Chọn chủ sở hữu để tạo khảo sát thay mặt họ.</p><form id="admin-survey-create" class="admin-survey-form">
    <label>Tìm chủ sở hữu<input class="in" data-owner-search placeholder="Nhập ít nhất 2 ký tự username"></label>
    <label>Chủ sở hữu<select class="sel" name="user_id" data-owner-select required>${users.map(u=>`<option value="${u.id}">${esc(u.username)}</option>`).join('')}</select></label>
    <label>Tên khảo sát<input class="in" name="title" maxlength="200" value="Khảo sát chưa đặt tên"></label><button class="btn pri" type="submit">Tạo khảo sát</button></form></section>
    <section class="card admin-table-card"><div class="admin-section-head"><div><h2>Tất cả khảo sát</h2><p class="admin-panel-hint">Tìm, lọc và quản lý khảo sát trên toàn hệ thống.</p></div><a class="btn admin-action-link" href="#/admin/users">Quản lý tài khoản</a></div>
    <div class="admin-table-tools"><label class="admin-filter-label">Trạng thái<select class="sel" data-admin-filter><option value="">Tất cả trạng thái</option><option value="published">Đang chạy</option><option value="draft">Bản nháp</option><option value="archived">Lưu trữ</option></select></label><span class="admin-result-count" data-admin-result-count data-total="${total}"></span><details class="admin-columns"><summary class="btn">Cột</summary><div>${[['owner','Chủ sở hữu'],['status','Trạng thái'],['responses','Phản hồi']].map(([key,label])=>`<label><input type="checkbox" data-column-toggle="${key}" checked> ${label}</label>`).join('')}</div></details><label class="admin-select-all"><input type="checkbox" data-admin-select-all> Chọn tất cả</label><button class="btn danger" data-admin-bulk hidden>Xóa mục đã chọn</button></div>
    ${surveys.length?`<div class="admin-table-wrap"><table class="tbl admin-table"><thead><tr><th><span class="sr-only">Chọn</span></th><th><button type="button" data-admin-sort="1">Khảo sát</button></th><th data-column="owner"><button type="button" data-admin-sort="2">Chủ sở hữu</button></th><th data-column="status"><button type="button" data-admin-sort="3">Trạng thái</button></th><th data-column="responses"><button type="button" data-admin-sort="4">Phản hồi</button></th><th>Thao tác</th></tr></thead><tbody>${surveys.map(s=>`<tr data-admin-row data-id="${s.id}" data-filter="${esc(s.status)}">
     <td><input type="checkbox" data-admin-select-row aria-label="Chọn khảo sát ${esc(s.title)}"></td>
     <td data-sort-1="${esc(s.title.toLocaleLowerCase('vi'))}"><strong>${esc(s.title)}</strong><small class="admin-id">${esc(s.id)}</small></td><td data-sort-2="${esc(s.owner.toLocaleLowerCase('vi'))}">${esc(s.owner)}</td>
     <td data-column="status" data-sort-3="${esc(s.status)}"><span class="chip ${SL[s.status]?.[1]||'c-end'}">${SL[s.status]?.[0]||esc(s.status)}</span></td>
     <td data-column="responses" data-sort-4="${s.response_count}">${Number(s.response_count).toLocaleString('vi')}</td><td><a class="btn" href="#/admin/surveys/${s.id}">Mở quản lý</a></td>
    </tr>`).join('')}</tbody></table><div class="admin-filter-empty" data-admin-filter-empty hidden>${emptyState('Không tìm thấy khảo sát phù hợp','Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.','','search')}</div></div>`:emptyState('Chưa có khảo sát ở trang này','Các khảo sát sẽ xuất hiện tại đây khi được tạo.')}${adminPager('surveys',page,pageSize,total)}</section>`);
   wireAdminOwnerSearch(app());
   wireAdminTable(app(),async selected=>{
    if(!await confirmAction(`Xóa ${selected.length} khảo sát cùng toàn bộ câu hỏi và phản hồi liên quan?`,'Xóa khảo sát đã chọn?','Xóa khảo sát'))return;
    const button=$('[data-admin-bulk]');button.disabled=true;
    const results=await Promise.allSettled(selected.map(row=>api('DELETE','/admin/surveys/'+row.dataset.id)));
    const failed=results.filter(result=>result.status=='rejected').length;
    toast(failed?`Đã xóa ${results.length-failed}/${results.length}; ${failed} khảo sát chưa xóa được.`:`Đã xóa ${results.length} khảo sát`);
    adminView('surveys',null,results.length===surveys.length&&page>1?page-1:page)
   });
   $('#admin-survey-create').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang tạo…');try{const result=await api('POST','/admin/surveys',{user_id:form.user_id.value,title:form.title.value});location.hash='#/admin/surveys/'+result.survey.id}catch(err){restore();toast(err.message,'error')}};
   return
  }
  if(section=='surveys'&&surveyId){
   const [result,responsesData]=await Promise.all([api('GET','/admin/surveys/'+surveyId),api('GET','/admin/surveys/'+surveyId+'/responses?page='+page)]);
   const actualPage=Math.min(page,Math.max(1,Math.ceil(responsesData.total/responsesData.pageSize)));
   if(actualPage!==page)return adminView('surveys',surveyId,actualPage);
   let survey=result.survey,questions=survey.questions;
   const renderSurvey=()=>{
    shell('admin',`${navBack}<div class="admin-detail-head"><a class="btn" href="#/admin/surveys">← Tất cả khảo sát</a><button class="btn danger" id="admin-survey-remove">Xóa khảo sát</button></div>
     <form id="admin-survey-edit" class="card admin-survey-edit">
      <div class="admin-survey-fields"><label>Tên khảo sát<input class="in" name="title" value="${esc(survey.title)}" maxlength="200" required></label>
       <label>Tìm chủ sở hữu<input class="in" data-owner-search placeholder="Nhập ít nhất 2 ký tự username"></label>
       <label>Chủ sở hữu<select class="sel" name="user_id" data-owner-select><option value="${survey.user_id}">${esc(survey.owner||'Chủ sở hữu hiện tại')}</option></select></label>
       <label>Trạng thái<select class="sel" name="status">${[['draft','Bản nháp'],['published','Đang chạy'],['archived','Lưu trữ']].map(([value,label])=>`<option value="${value}" ${survey.status==value?'selected':''}>${label}</option>`).join('')}</select></label>
      </div><label>Mô tả<textarea class="in" name="description" rows="3" maxlength="1000">${esc(survey.description||'')}</textarea></label>
      <div class="admin-section-head"><h2>Câu hỏi (${questions.length})</h2><button class="btn" id="admin-question-add" type="button">Thêm câu hỏi</button></div>
      <div id="admin-questions">${questions.map(adminQuestion).join('')}</div>
      <button class="btn pri" type="submit">Lưu thay đổi</button>
     </form>
     <section class="card admin-table-card"><div class="admin-section-head"><div><h2>Phản hồi (${responsesData.total})</h2><p class="admin-panel-hint">Mở từng phản hồi để xem nội dung và tín hiệu chất lượng.</p></div><span>Trang ${page}</span></div>
      ${responsesData.responses.length?`<div class="admin-response-tools"><label class="admin-filter-label">Cờ sàng lọc<select class="sel" data-response-filter><option value="">Tất cả</option><option value="normal">Không có cờ</option><option value="suspicious">Có tín hiệu</option><option value="spam">Nhiều tín hiệu</option></select></label><span class="admin-response-search"><span aria-hidden="true">⌕</span><input type="search" data-response-search placeholder="Tìm trong phản hồi trang này" aria-label="Tìm trong các phản hồi trên trang"></span><span data-response-count>${responsesData.responses.length} phản hồi trong trang này</span><label class="admin-select-all"><input type="checkbox" data-response-select-all> Chọn tất cả</label><button class="btn danger" data-response-bulk hidden>Xóa phản hồi</button></div>
      <div class="admin-responses" id="admin-response-list">${responsesData.responses.map(r=>{const responseSearch=[r.submitted_at,r.quality_status,...(r.answers||[]).map(a=>typeof a.answer_value=='string'?a.answer_value:JSON.stringify(a.answer_value))].join(' ');return `<div class="admin-response-item" data-admin-response data-id="${r.id}" data-status="${esc(r.quality_status||'')}" data-search="${esc(responseSearch)}">
       <label class="admin-response-select"><input type="checkbox" data-response-select aria-label="Chọn phản hồi ${r.submitted_at?new Date(r.submitted_at).toLocaleString('vi'):'chưa hoàn tất'}"><span class="sr-only">Chọn phản hồi</span></label>
       <details class="admin-response"><summary><span>${r.submitted_at?new Date(r.submitted_at).toLocaleString('vi'):'Chưa hoàn tất'}</span><span class="chip ${r.quality_status=='normal'?'c-ok':r.quality_status=='spam'?'c-bad':'c-warn'}">${esc(adminQualityLabel[r.quality_status]||'Chưa phân loại')}</span></summary>
        <button class="btn danger" type="button" data-response-remove="${r.id}">Xóa phản hồi</button>
        <div class="admin-answers">${(r.answers||[]).length?(r.answers||[]).map(a=>`<div><strong>${esc(a.questions?.question_text||'Câu hỏi đã xóa')}</strong><p>${esc(typeof a.answer_value=='string'?a.answer_value:JSON.stringify(a.answer_value))}</p></div>`).join(''):'<p>Chưa có câu trả lời.</p>'}</div>
       </details></div>`}).join('')}<div class="admin-filter-empty" data-response-empty hidden>${emptyState('Không tìm thấy phản hồi phù hợp','Thử thay đổi từ khóa hoặc trạng thái chất lượng.','','search')}</div></div>`:emptyState('Chưa có phản hồi ở trang này','Phản hồi hoàn tất sẽ xuất hiện sau khi người tham gia gửi khảo sát.','','inbox')}${adminPager('surveys/'+survey.id,page,responsesData.pageSize,responsesData.total)}
     </section>`);
    wireAdminOwnerSearch(app());
    wireAdminResponses(survey.id,page);
    const readQuestions=()=>$$('[data-admin-question]').map(card=>{
     const q=questions[+card.dataset.adminQuestion];
     let settings;
     try{settings=JSON.parse($('[data-q-settings]',card).value);if(!settings||typeof settings!='object'||Array.isArray(settings))throw new Error()}catch{throw new Error(`Cài đặt JSON ở câu ${+card.dataset.adminQuestion+1} không hợp lệ`)}
     return {...q,question_text:$('[data-q-text]',card).value.trim(),question_type:$('[data-q-type]',card).value,is_required:$('[data-q-required]',card).checked,
      settings,options:$('[data-q-options]',card).value.split('\n').map(s=>s.trim()).filter(Boolean).map(label=>({label,value:label}))}
    });
    $('#admin-question-add').onclick=()=>{try{questions=readQuestions();questions.push({question_text:'Câu hỏi mới',question_type:'text',is_required:true,settings:{},options:[]});renderSurvey()}catch(err){toast(err.message,'error')}};
    $$('[data-question-remove]').forEach(button=>button.onclick=async()=>{if(!await confirmAction('Khi lưu, các câu trả lời cho câu hỏi này cũng sẽ bị xóa.','Xóa câu hỏi?','Xóa câu hỏi'))return;try{questions=readQuestions();questions.splice(+button.dataset.questionRemove,1);renderSurvey()}catch(err){toast(err.message,'error')}});
    $('#admin-survey-edit').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang lưu…');try{
     const updated=await api('PUT','/admin/surveys/'+survey.id,{title:form.title.value,description:form.description.value,status:form.status.value,user_id:form.user_id.value,questions:readQuestions()});
     survey=updated.survey;questions=survey.questions;toast('Đã lưu khảo sát');renderSurvey()
    }catch(err){restore();toast(err.message,'error')}};
    $('#admin-survey-remove').onclick=async()=>{if(!await confirmAction('Khảo sát, câu hỏi và toàn bộ phản hồi liên quan sẽ bị xóa vĩnh viễn.','Xóa khảo sát?','Xóa khảo sát'))return;const button=$('#admin-survey-remove'),restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/admin/surveys/'+survey.id);toast('Đã xóa khảo sát');location.hash='#/admin/surveys'}catch(err){restore();toast(err.message,'error')}};
    $$('[data-response-remove]').forEach(button=>button.onclick=async e=>{e.preventDefault();e.stopPropagation();if(!await confirmAction('Phản hồi và toàn bộ câu trả lời liên quan sẽ bị xóa.','Xóa phản hồi?','Xóa phản hồi'))return;const lastOnPage=$$('[data-response-remove]').length===1,restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/admin/responses/'+button.dataset.responseRemove);toast('Đã xóa phản hồi');adminView('surveys',survey.id,lastOnPage&&page>1?page-1:page)}catch(err){restore();toast(err.message,'error')}});
   };
   renderSurvey();return
  }
  const data=await api('GET','/admin/overview');
  const activity=[
   ...data.recentUsers.map(user=>({type:'Tài khoản mới',label:user.username,date:user.created_at,href:'#/admin/users',icon:'+',tone:'teal'})),
   ...data.recentSurveys.map(survey=>({type:`Khảo sát cập nhật · ${survey.owner}`,label:survey.title,date:survey.updated_at,href:'#/admin/surveys/'+survey.id,icon:'↗',tone:'iris'}))
  ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
  shell('admin',`${navBack}<div class="grid g3 admin-stats">${[['Tài khoản',data.users,'users','Tổng số tài khoản trên hệ thống'],['Khảo sát',data.surveys,'surveys','Tất cả trạng thái'],['Phản hồi',data.responses,'surveys','Bản ghi phản hồi']].map(([label,count,key,hint])=>`<a class="card admin-stat" href="#/admin/${key}"><span>${label}</span><strong>${Number(count).toLocaleString('vi')}</strong><small>${hint} · Mở quản lý →</small></a>`).join('')}</div>
   <div class="grid g2 admin-overview-grid"><section class="card admin-activity"><div class="admin-section-head"><div><h2>Hoạt động gần đây</h2><p class="admin-panel-hint">Tài khoản mới và khảo sát được cập nhật gần nhất.</p></div><span>Dữ liệu thực tế</span></div>${activity.length?`<ol>${activity.map(item=>`<li><span class="admin-activity-mark ${item.tone}" aria-hidden="true">${item.icon}</span><div><a href="${item.href}">${esc(item.label)}</a><small>${esc(item.type)} · ${ago(item.date)}</small></div><time datetime="${esc(item.date)}">${new Date(item.date).toLocaleDateString('vi')}</time></li>`).join('')}</ol>`:emptyState('Chưa có hoạt động gần đây','Hoạt động tài khoản và khảo sát sẽ được tổng hợp tại đây.','','activity')}</section>
   <section class="card admin-quick-actions"><div class="admin-section-head"><div><h2>Truy cập nhanh</h2><p class="admin-panel-hint">Các khu vực thường dùng trong quản trị.</p></div></div><a class="admin-quick-action" href="#/admin/users"><span class="admin-action-icon">01</span><span><strong>Tài khoản</strong><small>Tạo, cập nhật và quản lý quyền đăng nhập</small></span><b aria-hidden="true">→</b></a><a class="admin-quick-action" href="#/admin/surveys"><span class="admin-action-icon">02</span><span><strong>Khảo sát</strong><small>Chỉnh sửa khảo sát, chủ sở hữu và phản hồi</small></span><b aria-hidden="true">→</b></a></section></div>
   <section class="card admin-notice"><h2>Quyền quản trị</h2><p>Vai trò admin được kiểm tra từ database ở mọi yêu cầu quản trị. Để cấp quyền, cập nhật cột <code>is_admin</code> trong bảng <code>users</code>.</p></section>`);
 }catch(e){fail('admin',e,()=>adminView(section,surveyId))}
}

/* ---------- Builder ---------- */
let cur=null,selI=0,mode='edit',dragI=null,saveT=null;
async function builderView(id){
 if(!id){try{const l=(await api('GET','/surveys')).surveys;const s=l[0]||(await api('POST','/surveys',{title:'Khảo sát chưa đặt tên'})).survey;location.replace('#/builder/'+s.id)}catch(e){fail('builder',e)}return}
 loading('builder');
 try{cur=(await api('GET','/surveys/'+id)).survey;selI=0;mode='edit';builderRender()}catch(e){fail('builder',e,()=>builderView(id))}}
const pubLink=()=>`${location.origin}/#/s/${cur.public_slug}`;
function builderRender(){
 shell('builder',`<div class="head"><div style="flex:1;min-width:260px"><input class="ttl" id="ttl" value="${esc(cur.title)}" maxlength="200" aria-label="Tên khảo sát"><p><span id="sv">Đã lưu</span> · <span id="qcount">${cur.questions.length} câu hỏi</span> · <span class="chip ${SL[cur.status][1]}">${SL[cur.status][0]}</span></p>
 ${cur.status=='published'?`<div class="linkbox"><span>${esc(pubLink())}</span><button id="cp">Sao chép</button></div>`:''}</div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div class="seg"><button data-m="edit" class="${mode=='edit'?'on':''}">Chỉnh sửa</button><button data-m="prev" class="${mode=='prev'?'on':''}">Xem trước</button></div>
 <button class="btn text-danger" id="del">${svg('trash')}Xóa</button><button class="btn pri" id="pub">${cur.status=='published'?'Hủy xuất bản':`${svg('send')}Xuất bản`}</button></div></div>
 <div class="bld"><div class="lib"><h3>Thư viện câu hỏi</h3><p class="lib-hint">Bấm để thêm vào cuối khảo sát</p>${typeGroups.map(([group,ids])=>`<span class="lib-group">${group}</span>${ids.map(id=>types.find(t=>t[0]==id)).map(t=>`<button type="button" data-add="${t[0]}"><em aria-hidden="true">${t[1]}</em><span>${t[2]}<small>${t[3]}</small></span></button>`).join('')}`).join('')}</div><div id="cv"></div><div class="card" id="pp"></div></div>`);
 $('#ttl').oninput=e=>{cur.title=e.target.value;dirty()};
 $$('[data-add]').forEach(b=>b.onclick=()=>addQuestion(b.dataset.add));
 $$('[data-m]').forEach(b=>{b.setAttribute('aria-pressed',String(b.classList.contains('on')));b.onclick=()=>{mode=b.dataset.m;$$('[data-m]').forEach(x=>{x.classList.toggle('on',x==b);x.setAttribute('aria-pressed',String(x==b))});drawCv();drawPp()}});
 $('#pub').onclick=async()=>{const button=$('#pub'),restore=setButtonLoading(button,'Đang lưu…'),oldStatus=cur.status;cur.status=cur.status=='published'?'draft':'published';clearTimeout(saveT);if(await save()){toast(cur.status=='published'?'Đã xuất bản — chia sẻ đường dẫn bên dưới tiêu đề':'Đã chuyển về bản nháp');builderRender()}else{cur.status=oldStatus;restore()}};
 $('#del').onclick=async()=>{if(!await confirmAction('Khảo sát và toàn bộ phản hồi liên quan sẽ bị xóa vĩnh viễn.'))return;const button=$('#del'),restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/surveys/'+cur.id);toast('Đã xóa khảo sát');location.hash='#/dashboard'}catch(e){restore();toast(e.message,'error')}};
 const cp=$('#cp');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(pubLink());toast('Đã sao chép đường dẫn')}catch(e){toast('Không thể sao chép đường dẫn trên thiết bị này')}} 
 drawCv();drawPp()}
const typeGroups=[['Lựa chọn',['single','mc','image','rank']],['Thang đo',['likert','rating','slider','sd','matrix']],['Văn bản',['text','longtext']]];
function addQuestion(type){cur.questions.push(mk(type));selI=cur.questions.length-1;mode='edit';$$('[data-m]').forEach(x=>{x.classList.toggle('on',x.dataset.m=='edit');x.setAttribute('aria-pressed',String(x.dataset.m=='edit'))});drawCv();drawPp();dirty();toast('Đã thêm '+TN[type]);$('#cv').lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'})}
const setSv=t=>{const e=$('#sv');if(e){e.textContent=t;e.dataset.state=t.startsWith('Chưa')?'error':t.startsWith('Đang')?'saving':'saved'}};
function dirty(){setSv('Đang lưu…');clearTimeout(saveT);saveT=setTimeout(save,800)}
async function save(){
 try{const ids=new Set(cur.questions.map(question=>question.id));
  cur.questions.forEach(question=>{if(question.settings.consistency_check&&!ids.has(question.settings.consistency_check.question_id))delete question.settings.consistency_check});
  const previousIds=cur.questions.map(question=>question.id);
  const r=(await api('PUT','/surveys/'+cur.id,{title:cur.title,description:cur.description,status:cur.status,settings:cur.settings,questions:cur.questions})).survey;
  const idMap=new Map(previousIds.map((id,index)=>[id,r.questions[index]?.id]));
  cur.questions.forEach((q,i)=>{if(r.questions[i])q.id=r.questions[i].id});
  cur.questions.forEach(question=>{const check=question.settings.consistency_check;if(check?.question_id&&idMap.has(check.question_id))check.question_id=idMap.get(check.question_id)});
  cur.status=r.status;cur.public_slug=r.public_slug;setSv('Đã lưu');return true}
 catch(e){setSv('Chưa lưu: '+e.message);toast(e.message,'error');return false}}
function drawCv(){
 const cv=$('#cv'),edit=mode=='edit',qcount=$('#qcount');
 if(qcount)qcount.textContent=cur.questions.length+' câu hỏi';
 cv.innerHTML=cur.questions.length?cur.questions.map((q,i)=>`<div class="q ${i==selI&&edit?'is-selected':''} ${edit?'':'is-preview'}" draggable="${edit}" data-i="${i}">${edit?'<span class="grip" title="Kéo để sắp xếp" aria-hidden="true">⋮⋮</span>':''}<div class="tag"><span class="qnum">${i+1}</span><span>${TN[q.question_type]}</span>${q.is_required?'<span class="req">Bắt buộc</span>':'<span class="opt-tag">Tùy chọn</span>'}</div><h3>${esc(q.question_text)}</h3>${body(q)}</div>`).join(''):emptyState('Khảo sát chưa có câu hỏi','Chọn một dạng trong thư viện câu hỏi, hoặc bắt đầu nhanh với một dạng phổ biến bên dưới.',['likert','single','longtext'].map(t=>`<button class="btn" type="button" data-quick-add="${t}">${svg('plus')}${TN[t]}</button>`).join(''),'edit');
 $$('[data-quick-add]',cv).forEach(b=>b.onclick=()=>addQuestion(b.dataset.quickAdd));
 $$('.q',cv).forEach(el=>{wire(el);const i=+el.dataset.i;
  el.onclick=()=>{if(edit&&selI!=i){selI=i;drawCv();drawPp()}};
  el.ondragstart=()=>{dragI=i;setTimeout(()=>el.classList.add('drag'))};el.ondragend=()=>el.classList.remove('drag');
  el.ondragover=e=>{e.preventDefault();el.classList.add('over')};el.ondragleave=()=>el.classList.remove('over');
  el.ondrop=e=>{e.preventDefault();if(dragI==null||dragI==i)return;const m=cur.questions.splice(dragI,1)[0];cur.questions.splice(i,0,m);selI=i;dragI=null;drawCv();drawPp();dirty();toast('Đã đổi thứ tự câu hỏi')}})}
const lines=v=>v.split('\n').map(x=>x.trim()).filter(Boolean);
function drawPp(){
 const q=cur.questions[selI],pp=$('#pp');
 if(mode=='prev'){pp.innerHTML=`<div class="pp-empty">${svg('eye')}<strong>Chế độ xem trước</strong><p>Người tham gia sẽ thấy từng câu một, có thanh tiến độ và nút quay lại.</p><a class="btn" href="#/preview/${cur.id}" onclick="clearTimeout(saveT);save()">${svg('external')}Mở trải nghiệm đầy đủ</a></div>`;return}
 if(!q){pp.innerHTML=`<div class="pp-empty">${svg('edit')}<strong>Thuộc tính câu hỏi</strong><p>Thêm một câu hỏi để chỉnh nội dung, lựa chọn, câu kiểm tra chú ý và kiểm tra nhất quán.</p></div>`;return}
 const t=q.question_type,s=q.settings,attentionCheck=s.attention_check,consistencyCheck=s.consistency_check;
 const consistencyQuestions=['single','likert','rating'].includes(t)
  ?cur.questions.map((question,index)=>({question,index})).filter(({question,index})=>index!==selI&&question.question_type===t):[];
 pp.innerHTML=`<div class="pp-head"><h3>Thuộc tính</h3><span class="chip c-run">Câu ${selI+1} · ${TN[t]}</span></div><label class="lb">Nội dung câu hỏi</label><textarea id="qt" style="min-height:80px;margin:6px 0 14px">${esc(q.question_text)}</textarea>
 ${hasOpts(t)?`<label class="lb">${t=='matrix'?'Các hàng':'Lựa chọn'} (mỗi dòng một mục)</label><textarea id="qo" style="margin:6px 0 14px">${esc(q.options.map(o=>o.label).join('\n'))}</textarea>`:''}
 ${t=='matrix'?`<label class="lb">Các cột (cách nhau bằng dấu phẩy)</label><input class="in" id="qc" value="${esc((s.cols||[]).join(', '))}" style="margin:6px 0 14px">`:''}
 ${t=='sd'?`<label class="lb">Cặp đối lập (mỗi dòng: trái | phải)</label><textarea id="qs" style="margin:6px 0 14px">${esc((s.pairs||[]).map(p=>p.join(' | ')).join('\n'))}</textarea>`:''}
 ${t=='likert'||t=='slider'?`<label class="lb">Nhãn hai đầu</label><input class="in" id="lo" value="${esc(s.lo||'')}" placeholder="Đầu thấp" style="margin:6px 0 8px"><input class="in" id="hi" value="${esc(s.hi||'')}" placeholder="Đầu cao">`:''}
 ${['single','likert','rating'].includes(t)?`<div class="attention-config"><label class="field"><input type="checkbox" id="ac" ${attentionCheck?'checked':''} ${t=='single'&&!q.options.length?'disabled':''}> Câu kiểm tra chú ý</label><p>Đáp án sai chỉ tạo tín hiệu cần xem xét; không tự động loại phản hồi.</p><label class="lb" for="ac-value">Đáp án mong đợi</label><select class="sel" id="ac-value" ${attentionCheck?'':'disabled'}>${(t=='single'?q.options.map(o=>[o.label,o.label]):[1,2,3,4,5].map(n=>[String(n),String(n)])).map(([value,label])=>`<option value="${esc(value)}" ${String(attentionCheck?.expected??(t=='single'?q.options[0]?.label:'3'))===String(value)?'selected':''}>${esc(label)}</option>`).join('')}</select></div>`:''}
 ${['single','likert','rating'].includes(t)?`<div class="consistency-config"><label class="lb" for="consistency-question">Kiểm tra nhất quán có cấu hình</label><p>Chỉ gắn cờ khi câu trả lời vi phạm mối quan hệ bạn chọn; không tự động loại phản hồi.</p><select class="sel" id="consistency-question" ${consistencyQuestions.length?'':'disabled'}><option value="">${consistencyQuestions.length?'Không kiểm tra':'Thêm câu cùng dạng để cấu hình'}</option>${consistencyQuestions.map(({question})=>`<option value="${esc(question.id)}" ${consistencyCheck?.question_id===question.id?'selected':''}>${esc(question.question_text)}</option>`).join('')}</select><label class="lb" for="consistency-relation">Mối quan hệ dự kiến</label><select class="sel" id="consistency-relation" ${consistencyCheck?'':'disabled'}><option value="same" ${consistencyCheck?.relation!=='different'?'selected':''}>Câu trả lời nên trùng nhau</option><option value="different" ${consistencyCheck?.relation==='different'?'selected':''}>Câu trả lời nên khác nhau</option></select></div>`:''}
 <label class="field"><input type="checkbox" id="rq" ${q.is_required?'checked':''}> Bắt buộc trả lời</label>
 <div class="pp-actions"><button class="btn" type="button" id="dup">${svg('copy')}Nhân đôi</button><button class="btn text-danger" type="button" id="rm">${svg('trash')}Xóa câu hỏi</button></div>`;
 const on=(id,fn)=>{const e=$(id);if(e)e.oninput=()=>{fn(e);drawCv();dirty()}};
 on('#qt',e=>q.question_text=e.value);on('#rq',e=>q.is_required=e.checked);
 on('#qo',e=>{q.options=L(lines(e.value));if(t=='single'){
  const toggle=$('#ac'),answer=$('#ac-value');
  if(!q.options.length){delete s.attention_check;if(toggle){toggle.checked=false;toggle.disabled=true}if(answer){answer.innerHTML='';answer.disabled=true}}
  else{if(s.attention_check&&!q.options.some(o=>o.label===s.attention_check.expected))s.attention_check.expected=q.options[0].label;
   if(toggle)toggle.disabled=false;
   if(answer){answer.innerHTML=q.options.map(o=>`<option value="${esc(o.label)}">${esc(o.label)}</option>`).join('');answer.value=s.attention_check?.expected??q.options[0].label;answer.disabled=!s.attention_check}}
 }});on('#qc',e=>s.cols=e.value.split(',').map(x=>x.trim()).filter(Boolean));
 on('#qs',e=>s.pairs=lines(e.value).map(l=>l.split('|').map(x=>x.trim())).filter(p=>p.length==2&&p[0]&&p[1]));
 on('#lo',e=>s.lo=e.value);on('#hi',e=>s.hi=e.value);
 const attentionToggle=$('#ac'),attentionAnswer=$('#ac-value'),attentionValue=value=>t=='single'?value:Number(value);
 if(attentionToggle)attentionToggle.onchange=()=>{if(attentionToggle.checked&&attentionAnswer.options.length)s.attention_check={expected:attentionValue(attentionAnswer.value)};else delete s.attention_check;attentionAnswer.disabled=!attentionToggle.checked;dirty()};
 if(attentionAnswer)attentionAnswer.onchange=()=>{if(s.attention_check)s.attention_check.expected=attentionValue(attentionAnswer.value);dirty()};
 const consistencyQuestion=$('#consistency-question'),consistencyRelation=$('#consistency-relation');
 if(consistencyQuestion)consistencyQuestion.onchange=()=>{
  if(consistencyQuestion.value)s.consistency_check={question_id:consistencyQuestion.value,relation:consistencyRelation.value};
  else delete s.consistency_check;
  consistencyRelation.disabled=!consistencyQuestion.value;
  dirty()
 };
 if(consistencyRelation)consistencyRelation.onchange=()=>{if(s.consistency_check)s.consistency_check.relation=consistencyRelation.value;dirty()};
 $('#rq').onchange=()=>{q.is_required=$('#rq').checked;drawCv();dirty()};
 $('#dup').onclick=()=>{const c=JSON.parse(JSON.stringify(q));c.id='new-'+(++nid);cur.questions.splice(selI+1,0,c);selI++;drawCv();drawPp();dirty()};
 $('#rm').onclick=()=>{cur.questions.splice(selI,1);selI=Math.max(0,selI-1);drawCv();drawPp();dirty();toast('Đã xóa câu hỏi')}}

/* ---------- Trải nghiệm người tham gia (công khai + xem trước) ---------- */
async function surveyView(slug,previewId){
 const bare=h=>{app().className='app bare';app().innerHTML=h};
 let data;
 try{data=previewId?(await api('GET','/surveys/'+previewId)).survey:(await api('GET','/public/surveys/'+encodeURIComponent(slug))).survey}
 catch(e){bare(`<div class="sv"><section><div class="stage error-state" role="alert"><div class="error-mark" aria-hidden="true">!</div><h1>Không mở được khảo sát</h1><p class="hint">${esc(e.message)}</p><button class="btn pri" id="retry-survey">Thử lại</button></div></section></div>`);$('#retry-survey').onclick=()=>surveyView(slug,previewId);return}
 const qs=data.questions,S={i:-1,ans:{},rid:null};
 const draw=()=>{
  const n=qs.length,w=S.i<0?0:Math.min(S.i,n)/n*100;let inner;
  if(S.i<0)inner=`<div class="stage"><span class="num">${previewId?'Xem trước · ':''}${n} câu hỏi</span><h1>${esc(data.title)}</h1><p class="hint">${esc(data.description||'Câu trả lời của bạn được ghi nhận ẩn danh. Bạn có thể dừng bất cứ lúc nào.')}<br>Khoảng ${Math.max(1,Math.round(n*.5))} phút.</p><p class="survey-error" id="survey-error" role="alert"></p><button class="btn pri" id="go">Bắt đầu khảo sát</button></div>`;
  else if(S.i>=n)inner=`<div class="stage stage-done"><span class="done-mark" aria-hidden="true">${svg('check')}</span><div class="big">Cảm ơn bạn</div><p class="hint">${previewId?'Đây là bản xem trước — chưa có dữ liệu nào được lưu.':'Câu trả lời của bạn giúp chúng tôi hiểu rõ hơn.'}</p>${previewId?`<a class="btn" href="#/builder/${previewId}">Về trình tạo</a>`:''}</div>`;
  else{const q=qs[S.i];inner=`<div class="stage" id="st"><span class="num">Câu ${S.i+1} trên ${n}${q.is_required?'':' · tùy chọn'}</span><h1>${esc(q.question_text)}</h1><p class="hint"></p>${body(q)}<div class="foot"><button class="link" id="bk" ${S.i?'':'style="visibility:hidden"'}>Quay lại</button><button class="btn pri" id="nx">${S.i==n-1?'Hoàn tất':'Tiếp tục'}</button></div></div>`}
  bare(`<div class="sv"><div class="top"><i style="width:${w}%"></i></div><nav>${previewId?`<a href="#/builder/${previewId}">← Thoát xem trước</a>`:'<span class="logo sv-logo"><i></i><span class="brand-word">brainst0rm</span></span>'}<span>${S.i>=0&&S.i<n?'Còn khoảng '+Math.max(1,Math.ceil((n-S.i)/2))+' phút':''}</span></nav><section>${inner}</section>${credit}</div>`);
  const go=$('#go');if(go)go.onclick=async()=>{const restore=setButtonLoading(go,'Đang chuẩn bị…');if(!previewId){try{S.rid=(await api('POST',`/public/surveys/${encodeURIComponent(slug)}/start`)).responseId}catch(e){restore();$('#survey-error').textContent=e.message;return}}S.i=0;draw()};
  const st=$('#st');if(!st)return;const q=qs[S.i];
  if(S.ans[q.id]!==undefined)restore(q,st,S.ans[q.id]);
  const next=async()=>{const nextButton=$('#nx');if(nextButton.disabled)return;nextButton.disabled=true;const originalLabel=nextButton.textContent;const v=collect(q,st);if(v===undefined&&q.is_required){nextButton.disabled=false;toast('Vui lòng trả lời câu này để tiếp tục');return}
   if(v!==undefined)S.ans[q.id]=v;else delete S.ans[q.id];
   if(S.i==qs.length-1){if(!previewId){nextButton.classList.add('is-loading');nextButton.setAttribute('aria-busy','true');nextButton.innerHTML='<span class="spinner" aria-hidden="true"></span>Đang gửi…';try{await api('POST',`/public/surveys/${encodeURIComponent(slug)}/responses`,{responseId:S.rid,answers:Object.entries(S.ans).map(([question_id,value])=>({question_id,value}))})}catch(e){nextButton.disabled=false;nextButton.classList.remove('is-loading');nextButton.removeAttribute('aria-busy');nextButton.textContent=originalLabel;toast(e.message,'error');return}}}
   S.i++;draw()};
  wire(st,()=>{if(['likert','single','image'].includes(q.question_type)&&S.i<qs.length-1)setTimeout(next,420)});
  $('#nx').onclick=next;$('#bk').onclick=()=>{const v=collect(q,st);if(v!==undefined)S.ans[q.id]=v;S.i--;draw()}};
 draw()}
// khôi phục đáp án khi người dùng bấm Quay lại
function restore(q,root,v){
 const t=q.question_type,click=el=>el&&el.click();
 if(t=='single'||t=='image')click($$('.opt,.img',root).find(b=>b.dataset.v==v));
 else if(t=='mc')v.forEach(x=>click($$('.opt',root).find(b=>b.dataset.v==x)));
 else if(t=='likert'||t=='rating')click($$('.scale button,.stars button',root).find(b=>+b.dataset.v==v));
 else if(t=='slider'){const r=$('input[type=range]',root);r.value=v;r.dataset.t=1}
 else if(t=='rank')v.forEach(x=>click($$('.rank',root).find(b=>b.dataset.v==x)));
 else if(t=='matrix')$$('input',root).forEach(i=>{if(v[i.name.slice(String(q.id).length+2)]==i.value)i.checked=true});
 else if(t=='sd')$$('.sd',root).forEach(r=>click($$('.dots button',r).find(b=>+b.dataset.v==v[r.dataset.k])));
 else $('textarea,input[type=text]',root).value=v}

/* ---------- Analytics ---------- */
const SIG={too_fast:'Hoàn thành quá nhanh',straightline:'Chọn một đáp án lặp lại',gibberish:'Văn bản vô nghĩa',attention_check:'Sai câu kiểm tra chú ý',duplicate:'Trùng bộ câu trả lời',frequency:'Gửi liên tục từ một thiết bị'};
const REVIEW_LABEL={needs_review:'Cần xem xét',accepted:'Được giữ lại',excluded:'Đã xác nhận không hợp lệ'};
const reportNumber=value=>value==null?'—':Number(value).toLocaleString('vi-VN',{maximumFractionDigits:2});
function questionReport(question){
 const stats=question.stats;
 const statsMarkup=stats?`<div class="report-stat-grid">${[
  ['Mean',stats.mean],['Median',stats.median],['Mode',stats.mode?.join(', ')||'—'],['SD mẫu',stats.standardDeviation]
 ].map(([label,value])=>`<div><small>${label}</small><strong>${esc(reportNumber(value))}</strong></div>`).join('')}</div>`:'';
 let detail='<p class="report-private-note">Nội dung câu trả lời tự do không được đưa vào báo cáo này.</p>';
 if(question.kind==='bars')detail=`<div class="report-table-wrap"><table class="report-table"><thead><tr><th>Đáp án</th><th>Số lượng</th><th>Tỷ lệ</th></tr></thead><tbody>${question.bars.map(item=>`<tr><td>${esc(item.label)}</td><td>${reportNumber(item.count)}</td><td>${reportNumber(item.pct)}%</td></tr>`).join('')}</tbody></table></div>`;
 else if(question.kind==='rows')detail=`<div class="report-table-wrap"><table class="report-table"><thead><tr><th>Mục</th><th>Trung bình / thứ hạng</th></tr></thead><tbody>${question.rows.map(item=>`<tr><td>${esc(item.label)}</td><td>${reportNumber(item.avg)}</td></tr>`).join('')}</tbody></table>${question.hint?`<small>${esc(question.hint)}</small>`:''}</div>`;
 return `<article class="report-question"><div class="report-question-head"><div><span class="report-question-index">Câu hỏi</span><h2>${esc(question.text)}</h2></div><span class="report-n">n = ${reportNumber(question.n)} · thiếu ${reportNumber(question.missing)}</span></div>${statsMarkup}${detail}</article>`
}
async function reportView(id,range={}){
 loading('report');
 try{
  if(!id)throw new Error('Thiếu mã khảo sát để tạo báo cáo')
  const params=new URLSearchParams(Object.entries(range).filter(([,value])=>value));
  const query=params.toString();
  const {survey,...data}=await api('GET',`/analytics/survey/${encodeURIComponent(id)}${query?'?'+query:''}`);
  const generatedAt=new Date().toISOString();
  const period=range.from||range.to?`${range.from||'Không giới hạn'} — ${range.to||'Hiện tại'} (UTC)`:'Toàn bộ thời gian (UTC)';
  const completedQuestions=data.questions.reduce((sum,question)=>sum+question.n,0);
  shell('report',`<div class="report-toolbar"><a class="btn" href="#/analytics/${encodeURIComponent(id)}${query?'?'+query:''}">← Trở lại phân tích</a><button class="btn pri" id="print-report">${svg('printer')}In / Lưu PDF</button></div>
   <article class="report-document">
    <header class="report-header"><span class="report-brand">brainst0rm · BÁO CÁO NGHIÊN CỨU</span><h1>${esc(survey.title)}</h1><p>Báo cáo tổng hợp kết quả khảo sát, dựa trên phản hồi thực trong hệ thống.</p></header>
    <section class="report-meta"><div><small>Nguồn dữ liệu</small><strong>${esc(survey.title)}</strong><code>${esc(survey.id)}</code></div><div><small>Khoảng thời gian nộp</small><strong>${esc(period)}</strong></div><div><small>Thời điểm tạo báo cáo</small><strong>${esc(generatedAt)} UTC</strong></div><div><small>Quần thể phân tích câu hỏi</small><strong>${reportNumber(data.eligibleResponses)} phản hồi</strong><span>Đã loại phản hồi researcher xác nhận không hợp lệ</span></div></section>
    <section class="report-kpis"><div><small>Phản hồi hoàn tất</small><strong>${reportNumber(data.completed)}</strong></div><div><small>Lượt bắt đầu</small><strong>${reportNumber(data.started)}</strong></div><div><small>Tỷ lệ hoàn tất</small><strong>${reportNumber(data.completionRate)}%</strong></div><div><small>Thời gian trung bình</small><strong>${esc(fmt(data.avgDuration))}</strong></div></section>
    <section class="report-disposition"><h2>Chất lượng và đánh giá phản hồi</h2><p>Sàng lọc tự động là tín hiệu hỗ trợ, không phải kết luận. Chỉ researcher xác nhận phản hồi không hợp lệ mới bị loại khỏi phân tích câu hỏi.</p><div class="report-disposition-grid"><div><small>Cần xem xét</small><strong>${reportNumber(data.review?.needs_review)}</strong></div><div><small>Được giữ lại</small><strong>${reportNumber(data.review?.accepted)}</strong></div><div><small>Đã xác nhận không hợp lệ</small><strong>${reportNumber(data.review?.excluded)}</strong></div><div><small>Phân tích câu hỏi dùng</small><strong>${reportNumber(data.eligibleResponses)}</strong></div></div></section>
    <section class="report-section"><h2>Kết quả theo câu hỏi</h2><p class="report-method">Câu trả lời thiếu được loại khỏi thống kê của câu hỏi tương ứng. Mean, median, mode và độ lệch chuẩn mẫu (n−1) chỉ áp dụng cho Likert/rating/slider. Báo cáo không bao gồm câu trả lời văn bản tự do.</p>
     ${data.questions.length?data.questions.map(questionReport).join(''):'<p>Khảo sát chưa có câu hỏi hoặc dữ liệu phân tích.</p>'}
    </section>
    <section class="report-section report-methods"><h2>Phương pháp và giới hạn</h2><ul><li>Dữ liệu lọc theo ngày sử dụng ngày nộp phản hồi (UTC), bao gồm cả ngày kết thúc.</li><li>Phân tích câu hỏi loại phản hồi researcher xác nhận không hợp lệ; KPI tổng quan có thể bao gồm toàn bộ phản hồi hoàn tất.</li><li>Các thống kê mô tả loại giá trị thiếu theo từng câu; n và số lượng thiếu được hiển thị riêng.</li><li>Báo cáo mô tả dữ liệu khảo sát, không đưa ra chẩn đoán tâm lý và không suy diễn tương quan thành quan hệ nhân quả.</li><li>Kết quả tổng hợp vẫn có thể tiết lộ thông tin nhạy cảm trong nhóm nhỏ; hãy kiểm tra quyền truy cập và chính sách consent trước khi chia sẻ PDF.</li></ul></section>
    <footer class="report-footer"><span>brainst0rm · Báo cáo được tạo từ dữ liệu hệ thống</span><span>${reportNumber(completedQuestions)} câu trả lời hợp lệ được tổng hợp qua các câu hỏi</span></footer>
   </article>`);
  $('#print-report').onclick=()=>window.print();
 }catch(error){fail('report',error,()=>reportView(id,range))}
}
async function analyticsView(id,range={}){
 loading('analytics');
 try{let list=(await api('GET','/surveys')).surveys;
  if(!id&&!list.length)list=(await api('GET','/research/surveys')).surveys;
  if(!id&&!list.length){shell('analytics',`<div class="head"><div><h1>Phân tích</h1><p>Thống kê và khám phá dữ liệu khảo sát.</p></div></div>${emptyState('Chưa có khảo sát để phân tích','Tạo khảo sát trước; phân tích sẽ dùng phản hồi thực sau khi người tham gia gửi câu trả lời.','<a class="btn pri" href="#/builder">Tạo khảo sát</a>')}`);return}
  if(!id){id=(list.find(s=>s.response_count)||list[0]).id;history.replaceState(null,'','#/analytics/'+id)}
  const rangeParams=new URLSearchParams(Object.entries(range).filter(([,value])=>value)),rangeQuery=rangeParams.toString();
  const [a,r]=await Promise.all([api('GET',`/analytics/survey/${id}${rangeQuery?'?'+rangeQuery:''}`),api('GET',`/responses/survey/${id}?page=1${rangeQuery?'&'+rangeQuery:''}`)]);
  if(!list.some(survey=>survey.id===id))list=[...list,a.survey];
  const d=a.series,mx=Math.max(5,...d.map(x=>x.count))*1.1,pts=d.map((x,i)=>`${20+i*(560/Math.max(1,d.length-1))},${190-x.count/mx*170}`),period=range.from||range.to?`${range.from||'Đầu kỳ'} — ${range.to||'Hiện tại'}`:'14 ngày gần nhất';
  const Q=a.quality,tot=a.completed||1,pc=k=>Q[k]/tot*100,canReview=a.canReview!==false;
  let rows=r.responses,responseTotal=r.total??r.responses.length;
  const pageSize=r.pageSize||25;let responsePage=(r.page||1)-1,responseFilter='all',responseSearch='';
  const filteredResponses=()=>rows.map((row,index)=>({row,index})).filter(({row})=>(responseFilter=='all'||row.review_status==responseFilter)
   &&`${row.submitted_at} ${row.quality_status} ${row.review_status} ${row.review_note||''} ${(row.signals||[]).map(s=>s.message).join(' ')}`.toLocaleLowerCase().includes(responseSearch.toLocaleLowerCase()));
  const renderResponseList=()=>{
   if(!responseTotal&&responseFilter!='all')return emptyState('Không có phản hồi trong trạng thái này','Chọn trạng thái khác để xem thêm phản hồi.','<button class="btn" type="button" data-response-reset>Hiển thị tất cả</button>');
   if(!responseTotal)return a.completed?emptyState('Không tìm thấy phản hồi phù hợp','Thử xóa bộ lọc tìm kiếm hoặc chọn trạng thái review khác.','<button class="btn" type="button" data-response-reset>Đặt lại bộ lọc</button>'):emptyState('Chưa có phản hồi hoàn tất',a.survey.status=='published'?'Chia sẻ khảo sát để bắt đầu thu thập câu trả lời.':'Xuất bản khảo sát để người tham gia có thể gửi câu trả lời.',a.survey.status=='published'?`<a class="btn" target="_blank" rel="noopener" href="${esc(location.origin)}/#/s/${esc(a.survey.public_slug)}">${svg('external')}Mở khảo sát công khai</a>`:`<a class="btn pri" href="#/builder/${encodeURIComponent(id)}">${svg('edit')}Mở trình tạo khảo sát</a>`,'inbox');
   if(!rows.length)return emptyState('Chưa tải được trang phản hồi này','Thử tải lại để lấy dữ liệu mới nhất.','<button class="btn" type="button" id="responses-retry">Thử lại</button>');
   const matches=filteredResponses(),pageCount=Math.max(1,Math.ceil(responseTotal/pageSize));
   responsePage=Math.min(responsePage,pageCount-1);
   if(!matches.length)return emptyState('Không tìm thấy kết quả trên trang này','Tìm kiếm chỉ kiểm tra 25 phản hồi đang hiển thị. Hãy đổi từ khóa hoặc trạng thái.','<button class="btn" type="button" data-response-reset>Xóa tìm kiếm</button>');
   // rows đã là dữ liệu của trang hiện tại từ server; chỉ lọc theo tìm kiếm, không cắt lại theo số trang
   const data=matches.map(({row:x,index})=>{const c={normal:['Không có cờ','ok'],suspicious:['Có tín hiệu','warn'],spam:['Nhiều tín hiệu','bad']}[x.quality_status]||['Chưa phân loại','end'],review=x.review_status||'needs_review';return `<tr class="r" data-i="${index}"><td>${new Date(x.submitted_at).toLocaleString('vi')}</td><td>${fmt(x.duration_seconds)}</td><td>${x.quality_score}</td><td><span class="chip c-${c[1]}">${c[0]}</span></td><td><span class="chip ${review=='excluded'?'c-bad':review=='accepted'?'c-ok':'c-warn'}">${REVIEW_LABEL[review]||'Cần xem xét'}</span></td></tr>`}).join('');
   return `<div class="analytics-table-wrap"><table class="tbl"><thead><tr><th>Thời điểm</th><th>Thời gian</th><th>Điểm</th><th>Cờ tự động</th><th>Đánh giá researcher</th></tr></thead><tbody>${data}</tbody></table></div><div class="pagination"><span>${matches.length} kết quả trên trang · ${responseTotal} phản hồi phù hợp</span><div><button class="btn" id="responses-prev" ${responsePage===0?'disabled':''} aria-label="Trang trước">‹</button><span>Trang ${responsePage+1} / ${pageCount}</span><button class="btn" id="responses-next" ${responsePage>=pageCount-1?'disabled':''} aria-label="Trang tiếp theo">›</button></div></div>`
  };
  const sigTotal=Object.entries(a.signalCounts);
  const trendChart=a.completed?`<svg viewBox="0 0 600 220" role="img" aria-label="Biểu đồ số phản hồi theo ngày"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--brand-500)" stop-opacity=".25"/><stop offset="1" style="stop-color:var(--brand-500)" stop-opacity="0"/></linearGradient></defs>
   ${[0,1,2,3].map(i=>`<line x1="20" x2="580" y1="${20+i*57}" y2="${20+i*57}" style="stroke:var(--brand-100)"/>`).join('')}<polygon points="20,190 ${pts.join(' ')} 580,190" fill="url(#g)"/><polyline points="${pts.join(' ')}" fill="none" style="stroke:var(--brand-500)" stroke-width="2.5" stroke-linejoin="round"/>${pts.map(p=>`<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3.5" fill="#fff" style="stroke:var(--brand-500)" stroke-width="2"/>`).join('')}
   <text x="20" y="212" font-size="11" style="fill:var(--text-muted)">${d[0].date.slice(5).replace('-','/')}</text><text x="580" y="212" font-size="11" style="fill:var(--text-muted)" text-anchor="end">${d[d.length-1].date.slice(5).replace('-','/')}</text></svg>`:emptyState('Chưa có dữ liệu theo thời gian','Biểu đồ xu hướng sẽ hiển thị khi khảo sát có phản hồi hoàn tất.','','trend');
  const qualityChart=a.completed?`<div class="ring"><svg width="110" height="110" viewBox="0 0 36 36" role="img" aria-label="Tỷ lệ phản hồi theo cờ chất lượng">${[['var(--green-500)',0,pc('normal')],['var(--amber-400)',pc('normal'),pc('suspicious')],['var(--coral-600)',pc('normal')+pc('suspicious'),pc('spam')]].map(x=>`<circle cx="18" cy="18" r="15.9" fill="none" style="stroke:${x[0]}" stroke-width="4" stroke-dasharray="${x[2]} ${100-x[2]}" stroke-dashoffset="${-x[1]}" transform="rotate(-90 18 18)"/>`).join('')}</svg>
   <div style="font-size:13px;line-height:2.1"><span class="chip c-ok">Không có cờ ${Q.normal}</span><br><span class="chip c-warn">Có tín hiệu ${Q.suspicious}</span><br><span class="chip c-bad">Nhiều tín hiệu ${Q.spam}</span></div></div>
   <div style="margin-top:14px;font-size:13px;color:var(--mute)">${sigTotal.length?sigTotal.map(([k,n])=>`${SIG[k]||k}: <b>${n}</b>`).join('<br>'):'Chưa phát hiện tín hiệu bất thường.'}<p class="quality-disclaimer">Cờ và điểm chỉ phục vụ sàng lọc, không phải kết luận. Chỉ researcher mới xác nhận hoặc loại phản hồi.</p></div>`:emptyState('Chưa có phản hồi để đánh giá','Cờ chất lượng chỉ được tính từ phản hồi hoàn tất.','','shield');
  const groupQuestions=a.questions.filter(q=>q.type=='single'),numericQuestions=a.questions.filter(q=>['likert','rating','slider'].includes(q.type));
  const analysisAvailable={group:groupQuestions.length>0&&numericQuestions.length>0,crosstab:groupQuestions.length>1,correlation:numericQuestions.length>1};
  const analysisKinds=[['group','So sánh trung bình theo nhóm'],['crosstab','Bảng chéo'],['correlation','Tương quan Pearson r']];
  const initialAnalysis=analysisKinds.find(([kind])=>analysisAvailable[kind])?.[0]||'crosstab';
  const analysisOptions=(items,selected)=>items.map(q=>`<option value="${esc(q.id)}" ${q.id==selected?'selected':''}>${esc(q.text)}</option>`).join('');
  const analysisCard=`<div class="card relationship-card"><div><h3>So sánh nhóm, bảng chéo và tương quan</h3><p class="quality-disclaimer">Nhóm được xác định từ câu hỏi single trong khảo sát; phân tích chỉ dùng câu trả lời thực, loại phản hồi researcher đã xác nhận không hợp lệ. Tương quan không hàm ý nhân quả.</p></div><div class="relationship-controls"><label>Phân tích<select class="sel" id="analysis-kind">${analysisKinds.map(([kind,label])=>`<option value="${kind}" ${kind==initialAnalysis?'selected':''} ${analysisAvailable[kind]?'':'disabled'}>${label}</option>`).join('')}</select></label><label id="analysis-first-label">Câu hỏi nhóm<select class="sel" id="analysis-first"></select></label><label id="analysis-second-label">Câu hỏi kết quả<select class="sel" id="analysis-second"></select></label><button class="btn pri" id="run-analysis" ${analysisAvailable[initialAnalysis]?'':'disabled'}>Chạy phân tích</button></div><div id="relationship-result" class="relationship-result" role="status" aria-live="polite">${analysisAvailable[initialAnalysis]?'Chọn câu hỏi để bắt đầu.':'Cần ít nhất hai câu single hoặc hai câu thang đo phù hợp.'}</div></div>`;
  const exportCard=canReview?`<div class="card export-card"><div class="export-note">${svg('lock')}<p>Cả CSV và Excel đều bỏ mã phản hồi, IP và ghi chú review, không thay đổi dữ liệu gốc. CSV dùng UTF-8 có BOM; Excel có bộ lọc cột. Câu trả lời và thời điểm gửi vẫn có thể nhận diện gián tiếp, nên tệp không bảo đảm ẩn danh tuyệt đối.</p></div>
   <form id="survey-export-form"><label>Trạng thái review<select class="sel" name="reviewStatus"><option value="not_excluded">Không gồm phản hồi đã loại</option><option value="needs_review">Chỉ cần xem xét</option><option value="accepted">Chỉ được giữ lại</option><option value="excluded">Chỉ đã xác nhận không hợp lệ</option><option value="all">Tất cả, gồm phản hồi đã loại</option></select></label>
    <label>Định dạng<select class="sel" name="format"><option value="csv">CSV (UTF-8)</option><option value="xlsx">Excel (.xlsx)</option></select></label>
    <details class="export-fields"><summary>${svg('filter')}Tùy chỉnh câu hỏi xuất (${a.questions.length})</summary><div>${a.questions.map((question,index)=>`<label><input type="checkbox" data-export-question value="${esc(question.id)}" checked> <span>${index+1}. ${esc(question.text)}</span></label>`).join('')||emptyState('Khảo sát chưa có câu hỏi','Thêm câu hỏi trước khi xuất dữ liệu.')}</div></details>
    <button class="btn pri" type="submit" ${a.questions.length?'':'disabled'}>${svg('download')}Tải tệp</button><span id="export-status" role="status" aria-live="polite"></span></form></div>`:'';
  const hasRange=Boolean(range.from||range.to),publicUrl=`${location.origin}/#/s/${a.survey.public_slug}`;
  const noDataNotice=a.completed?'':`<div class="notice" role="note">${svg('info')}<div><strong>${hasRange?'Không có phản hồi hoàn tất trong khoảng ngày này':'Chưa có phản hồi hoàn tất'}</strong><span>${hasRange?'Mở rộng hoặc xóa bộ lọc ngày để xem dữ liệu khác.':a.survey.status=='published'?'Khảo sát đang mở. Biểu đồ, thống kê và công cụ đánh giá sẽ tự cập nhật khi người tham gia gửi câu trả lời.':'Khảo sát đang là bản nháp. Hãy xuất bản để người tham gia có thể gửi câu trả lời.'}</span></div><div class="notice-actions">${hasRange?'<button class="btn" type="button" data-clear-range>Xóa lọc ngày</button>':a.survey.status=='published'?`<button class="btn" type="button" data-copy-link>${svg('copy')}Sao chép đường dẫn</button>`:`<a class="btn pri" href="#/builder/${encodeURIComponent(id)}">${svg('edit')}Mở trình tạo</a>`}</div></div>`;
  const reliabilityItems=a.questions.filter(q=>['likert','rating'].includes(q.type));
  const sectionHead=(title,description,meta='')=>`<div class="section-head"><div><h2>${title}</h2><p>${description}</p></div>${meta?`<span class="section-meta">${meta}</span>`:''}</div>`;
  shell('analytics',`<div class="head"><div><span class="eyebrow">Phân tích</span><h1>${esc(a.survey.title)}</h1><p>${a.completed.toLocaleString('vi')} phản hồi hoàn tất${hasRange?' trong kỳ đã chọn':''} · <span class="chip ${SL[a.survey.status]?.[1]||'c-end'}">${SL[a.survey.status]?.[0]||esc(a.survey.status)}</span></p></div>
  <div class="head-actions">${canReview?`<button class="btn" type="button" id="jump-export">${svg('download')}Xuất dữ liệu</button>`:''}<a class="btn pri report-link" href="#/report/${encodeURIComponent(id)}${rangeQuery?'?'+rangeQuery:''}">${svg('printer')}Báo cáo PDF</a></div></div>
  <div class="analytics-filters" role="group" aria-label="Bộ lọc phân tích"><label>Khảo sát<select class="sel" id="pick">${list.map(s=>`<option value="${s.id}" ${s.id==id?'selected':''}>${esc(s.title)}</option>`).join('')}</select></label><label>Từ ngày<input class="in" type="date" id="analytics-from" value="${esc(range.from||'')}"></label><label>Đến ngày<input class="in" type="date" id="analytics-to" value="${esc(range.to||'')}"></label>${hasRange?'<button class="btn" type="button" data-clear-range>Xóa lọc ngày</button>':'<span class="filter-hint">Ngày theo UTC</span>'}</div>
  <div class="grid g4">${[['Phản hồi',a.completed.toLocaleString('vi'),`${a.started} lượt bắt đầu${hasRange?' trong kỳ':''}`,'inbox',''],['Hoàn thành',a.completionRate+'%',`${a.cohortCompleted} / ${a.started} lượt bắt đầu đã hoàn tất`,'checkCircle','teal'],['Thời gian trung bình',fmt(a.avgDuration),'phút:giây mỗi phản hồi','clock','amber'],['Chất lượng phản hồi',a.normalRate==null?'—':a.normalRate+'%',`${a.review?.needs_review??(Q.suspicious+Q.spam)} cần xem xét · ${a.review?.excluded||0} đã loại`,'shield','rose']].map(k=>kpi(...k)).join('')}</div>
  ${noDataNotice}
  <section class="a-section">${sectionHead('Tổng quan phản hồi','Xu hướng thu thập theo ngày và tín hiệu sàng lọc tự động.')}
  <div class="grid g2 analytics-overview-charts"><div class="card chart"><h3>Phản hồi theo ngày <span class="h-meta">${esc(period)}</span></h3>${trendChart}</div>
  <div class="card"><h3>Cờ sàng lọc tự động</h3>${qualityChart}</div></div></section>
  <section class="a-section">${sectionHead('Kết quả theo câu hỏi','Gồm phản hồi đang chờ và được giữ lại; chỉ phản hồi researcher xác nhận không hợp lệ mới bị loại. KPI phía trên vẫn tính mọi phản hồi hoàn tất.',`${a.questions.length} câu hỏi`)}
  <div class="grid g2 analytics-question-grid">${a.questions.length?a.questions.map((q,index)=>`<div class="card qcard"><div class="qcard-meta"><span class="qtype">${index+1} · ${TN[q.type]}</span><span>${q.n} trả lời</span>${q.avg!=null?`<span>TB ${q.avg}</span>`:''}<span>${q.missing} thiếu</span></div><h3>${esc(q.text)}</h3>
   ${q.stats&&q.n?`<div class="descriptive-stats"><span>Mean <b>${q.stats.mean??'—'}</b></span><span>Median <b>${q.stats.median??'—'}</b></span><span>Mode <b>${q.stats.mode.length?q.stats.mode.join(', '):'—'}</b></span><span>SD mẫu <b>${q.stats.standardDeviation??'—'}</b></span></div><small class="quality-disclaimer">SD mẫu (n−1); tính trên ${q.stats.n} câu trả lời hợp lệ.</small>`:''}
   ${q.n===0?emptyState('Chưa có câu trả lời','Thống kê câu hỏi sẽ xuất hiện khi có dữ liệu hợp lệ.','','chart'):q.kind=='bars'?q.bars.map(b=>`<div class="hbar"><span>${esc(b.label)}</span><div class="bar t"><i style="width:${b.pct}%"></i></div><b>${b.pct}%</b></div>`).join(''):q.kind=='rows'?(q.hint?`<small class="qcard-hint">${esc(q.hint)}</small>`:'')+q.rows.map(b=>`<div class="hbar"><span>${esc(b.label)}</span><div class="bar t"><i style="width:${b.avg==null?0:b.avg/b.max*100}%"></i></div><b>${b.avg??'—'}</b></div>`).join(''):q.samples.length?q.samples.map(x=>`<p class="sample">“${esc(x)}”</p>`).join(''):emptyState('Chưa có câu trả lời','Thống kê câu hỏi sẽ xuất hiện khi có dữ liệu hợp lệ.','','chart')}</div>`).join(''):emptyState('Khảo sát chưa có câu hỏi','Thêm câu hỏi trong trình tạo khảo sát để bắt đầu thu thập dữ liệu.',`<a class="btn pri" href="#/builder/${encodeURIComponent(id)}">${svg('edit')}Mở trình tạo khảo sát</a>`,'edit')}</div></section>
  <section class="a-section">${sectionHead('Phân tích nâng cao','So sánh nhóm, bảng chéo, tương quan và độ tin cậy thang đo, chỉ dùng câu trả lời thực.')}
  ${analysisCard}
  <div class="card reliability-card"><div><h3>Độ tin cậy thang đo · Cronbach’s alpha</h3><p class="quality-disclaimer">Chọn các câu Likert/rating thuộc cùng một thang đo. Chỉ tính phản hồi có đủ câu trả lời (complete-case); tự kiểm tra chiều đảo mã trước khi tính. Alpha không tự xác định thang đo hợp lệ.</p></div><div class="reliability-items">${reliabilityItems.map(q=>`<label><input type="checkbox" data-alpha-question value="${esc(q.id)}"> <span>${esc(q.text)}</span></label>`).join('')||emptyState('Chưa có câu hỏi thang đo','Cronbach’s alpha cần tối thiểu hai câu Likert hoặc rating trong khảo sát.','','layers')}</div><div class="reliability-actions"><button class="btn pri" id="calculate-alpha" ${reliabilityItems.length<2?'disabled':''}>Tính alpha</button><span id="alpha-result" role="status" aria-live="polite">${reliabilityItems.length>=2?'Chọn ít nhất hai câu hỏi.':''}</span></div></div></section>
  <section class="a-section">${sectionHead('Đánh giá chất lượng phản hồi','Tín hiệu tự động chỉ hỗ trợ sàng lọc, không phải kết luận. Mỗi phản hồi bắt đầu ở trạng thái cần researcher xem xét; bấm vào một dòng để đánh giá.')}
  <div class="card response-card"><div class="review-tools"><label for="response-review-filter">Trạng thái</label><select class="sel" id="response-review-filter"><option value="all">Tất cả</option><option value="needs_review">Cần xem xét</option><option value="accepted">Được giữ lại</option><option value="excluded">Đã xác nhận không hợp lệ</option></select><label class="review-search"><span>Tìm kiếm trong trang</span><input id="response-search" type="search" placeholder="Tìm lý do hoặc ghi chú trên trang này" aria-label="Tìm phản hồi trên trang hiện tại"></label></div><div id="response-list">${renderResponseList()}</div></div></section>
  ${canReview?`<section class="a-section" id="export-section">${sectionHead('Xuất dữ liệu','Tải phản hồi hoàn tất theo khoảng ngày đang chọn. Mặc định loại phản hồi đã xác nhận không hợp lệ.')}${exportCard}</section>`:''}`);
  $$('[data-clear-range]').forEach(button=>button.onclick=()=>{location.hash='#/analytics/'+id});
  $$('[data-copy-link]').forEach(button=>button.onclick=async()=>{try{await navigator.clipboard.writeText(publicUrl);toast('Đã sao chép đường dẫn khảo sát')}catch{toast('Không thể sao chép đường dẫn trên thiết bị này','error')}});
  const jumpExport=$('#jump-export');if(jumpExport)jumpExport.onclick=()=>{$('#export-section').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#export-section select')?.focus({preventScroll:true}),450)};
  const navigateWithRange=surveyId=>{
   const nextRange={from:$('#analytics-from').value,to:$('#analytics-to').value};
   if(nextRange.from&&nextRange.to&&nextRange.from>nextRange.to){toast('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');return}
   const params=new URLSearchParams(Object.entries(nextRange).filter(([,value])=>value));
   location.hash='#/analytics/'+surveyId+(params.toString()?'?'+params:'')
  };
  $('#pick').onchange=e=>navigateWithRange(e.target.value);
  $('#analytics-from').onchange=()=>navigateWithRange(id);
  $('#analytics-to').onchange=()=>navigateWithRange(id);
  const exportForm=$('#survey-export-form');
  if(exportForm)exportForm.onsubmit=async event=>{
   event.preventDefault();
   const questions=$$('[data-export-question]',exportForm),selected=questions.filter(question=>question.checked);
   if(!selected.length){toast('Chọn ít nhất một câu hỏi để xuất');return}
   const reviewStatus=$('[name=reviewStatus]',exportForm).value;
   if(['all','excluded'].includes(reviewStatus)&&!await confirmAction(
    'Tệp sẽ chứa phản hồi mà researcher đã xác nhận không hợp lệ. Chỉ tiếp tục nếu bạn có quyền và thực sự cần dữ liệu này.',
    'Xác nhận xuất phản hồi đã loại','Vẫn xuất dữ liệu'
   ))return;
   const params=new URLSearchParams();
   Object.entries(range).forEach(([key,value])=>{if(value)params.set(key,value)});
   params.set('reviewStatus',reviewStatus);
   if(selected.length<questions.length)params.set('questionIds',selected.map(question=>question.value).join(','));
   const button=$('button[type=submit]',exportForm),status=$('#export-status'),restore=setButtonLoading(button,'Đang tạo tệp…');
   const format=exportForm.elements.format.value,extension=format=='xlsx'?'xlsx':'csv';
   status.textContent=`Đang chuẩn bị dữ liệu ${extension.toUpperCase()}…`;
   try{
    const response=await fetch(`/api/exports/survey/${encodeURIComponent(id)}.${extension}?${params}`,{credentials:'same-origin'});
    if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'Không thể xuất dữ liệu')}
    const blob=await response.blob(),disposition=response.headers.get('Content-Disposition')||'';
    const filename=disposition.match(/filename="([^"]+)"/)?.[1]||`survey-responses.${extension}`;
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
    const checksum=response.headers.get('X-Content-SHA256');
    status.textContent=`Đã tải tệp ${extension.toUpperCase()}${extension=='csv'?' UTF-8':''}.${checksum?` SHA-256: ${checksum}`:''}`;
   }catch(error){status.textContent=`Không thể xuất dữ liệu: ${error.message}`}
   finally{restore()}
  };
  const analysisKind=$('#analysis-kind'),analysisFirst=$('#analysis-first'),analysisSecond=$('#analysis-second'),analysisButton=$('#run-analysis'),analysisResult=$('#relationship-result');
  const updateAnalysisOptions=()=>{
   const kind=analysisKind.value,firstItems=kind=='group'||kind=='crosstab'?groupQuestions:numericQuestions;
   const firstValue=firstItems.some(q=>q.id==analysisFirst.value)?analysisFirst.value:firstItems[0]?.id;
   analysisFirst.innerHTML=analysisOptions(firstItems,firstValue);analysisFirst.value=firstValue||'';
   const secondItems=kind=='group'?numericQuestions:kind=='crosstab'?groupQuestions.filter(q=>q.id!=analysisFirst.value):numericQuestions.filter(q=>q.id!=analysisFirst.value);
   const secondValue=secondItems.some(q=>q.id==analysisSecond.value)?analysisSecond.value:secondItems[0]?.id;
   analysisSecond.innerHTML=analysisOptions(secondItems,secondValue);analysisSecond.value=secondValue||'';
   $('#analysis-first-label').firstChild.textContent=kind=='group'?'Câu hỏi nhóm':kind=='crosstab'?'Hàng của bảng':'Biến thứ nhất';
   $('#analysis-second-label').firstChild.textContent=kind=='group'?'Câu hỏi kết quả':kind=='crosstab'?'Cột của bảng':'Biến thứ hai';
   analysisButton.disabled=!firstValue||!secondValue||firstValue==secondValue;
  };
  analysisKind.onchange=updateAnalysisOptions;
  analysisFirst.onchange=updateAnalysisOptions;
  analysisSecond.onchange=()=>{analysisButton.disabled=!analysisFirst.value||!analysisSecond.value||analysisFirst.value==analysisSecond.value};
  updateAnalysisOptions();
  analysisButton.onclick=async()=>{
   const restore=setButtonLoading(analysisButton,'Đang phân tích…');
   analysisResult.textContent='Đang truy vấn dữ liệu khảo sát…';
   try{
    const result=await api('POST',`/analytics/survey/${id}/analysis${rangeQuery?'?'+rangeQuery:''}`,{analysisType:analysisKind.value,firstQuestionId:analysisFirst.value,secondQuestionId:analysisSecond.value});
    if(result.n===0)analysisResult.innerHTML=emptyState('Chưa đủ dữ liệu để phân tích','Cần có các cặp câu trả lời hợp lệ trong khoảng lọc này.');
    else if(result.analysisType=='group')analysisResult.innerHTML=`<p>${result.n} cặp hợp lệ · ${result.missing} thiếu</p><div class="analytics-table-wrap"><table class="tbl"><thead><tr><th>Nhóm</th><th>n</th><th>Thiếu</th><th>Mean</th><th>SD mẫu</th></tr></thead><tbody>${result.groups.map(group=>`<tr><td>${esc(group.label)}</td><td>${group.n}</td><td>${group.missing}</td><td>${group.mean??'—'}</td><td>${group.standardDeviation??'—'}</td></tr>`).join('')}</tbody></table></div><small>${esc(result.method)}</small>`;
    else if(result.analysisType=='crosstab')analysisResult.innerHTML=`<p>${result.n} cặp hợp lệ · ${result.missing} thiếu</p><div class="analytics-table-wrap"><table class="tbl"><thead><tr><th>${esc(result.first.text)} / ${esc(result.second.text)}</th>${result.columns.map(column=>`<th>${esc(column)}</th>`).join('')}<th>Tổng</th></tr></thead><tbody>${result.rows.map(row=>`<tr><th>${esc(row.label)}</th>${row.cells.map(cell=>`<td>${cell.count}<small class="cell-percent">${cell.percent}%</small></td>`).join('')}<td>${row.total}</td></tr>`).join('')}</tbody></table></div><small>${esc(result.method)}</small>`;
    else analysisResult.innerHTML=`<p>Pearson r = <strong>${result.coefficient??'—'}</strong> · n = ${result.n} cặp · ${result.missing} thiếu</p><small>${esc(result.method)}. ${esc(result.interpretation)}</small>`;
   }catch(e){analysisResult.textContent=`Không thể chạy phân tích: ${e.message}`}
   finally{restore()}
  };
  const alphaButton=$('#calculate-alpha'),alphaResult=$('#alpha-result'),alphaItems=$$('[data-alpha-question]');
  const updateAlphaButton=()=>{const picked=alphaItems.filter(input=>input.checked).length;if(alphaButton)alphaButton.disabled=picked<2;if(alphaResult&&alphaItems.length>=2&&!alphaResult.querySelector('strong'))alphaResult.textContent=picked<2?'Chọn ít nhất hai câu hỏi.':`Đã chọn ${picked} câu hỏi.`};
  alphaItems.forEach(input=>input.onchange=updateAlphaButton);
  updateAlphaButton();
  if(alphaButton)alphaButton.onclick=async()=>{
   const questionIds=alphaItems.filter(input=>input.checked).map(input=>input.value);
   if(questionIds.length<2){alphaResult.textContent='Chọn ít nhất hai câu hỏi.';return}
   const restore=setButtonLoading(alphaButton,'Đang tính…');alphaResult.textContent='Đang phân tích dữ liệu thật…';
   try{const result=await api('POST',`/analytics/survey/${id}/reliability${rangeQuery?'?'+rangeQuery:''}`,{questionIds});restore();alphaResult.innerHTML=`α = <strong>${result.alpha==null?'Chưa đủ phương sai':result.alpha.toFixed(3)}</strong> · ${result.n} phản hồi đủ dữ liệu · complete-case`}
   catch(e){restore();alphaResult.textContent=`Không thể tính alpha: ${e.message}`}
  };
  const toggleResponse=tr=>{const n=tr.nextElementSibling;if(n?.classList.contains('dt')){n.remove();tr.setAttribute('aria-expanded','false');return}$$('.dt').forEach(x=>x.remove());$$('.tbl tr.r').forEach(x=>x.setAttribute('aria-expanded','false'));
   const x=rows[tr.dataset.i],signals=x.signals||[],review=x.review_status||'needs_review';
   tr.setAttribute('aria-expanded','true');
   tr.insertAdjacentHTML('afterend',`<tr class="dt"><td colspan="5" style="padding:0;border:0"><div class="review-detail"><div class="review-signals"><strong>Cờ tự động · Điểm ${x.quality_score}/100</strong><p>${signals.length?signals.map(s=>esc(s.message)).join('<br>'):'Không phát hiện tín hiệu sàng lọc tự động.'}</p></div>${canReview?`<div class="review-form"><label>Quyết định researcher<select class="sel" data-review-status><option value="needs_review" ${review=='needs_review'?'selected':''}>Cần xem xét</option><option value="accepted" ${review=='accepted'?'selected':''}>Được giữ lại</option><option value="excluded" ${review=='excluded'?'selected':''}>Xác nhận không hợp lệ</option></select></label><label>Ghi chú<input class="review-note" data-review-note maxlength="1000" value="${esc(x.review_note||'')}" placeholder="Lý do hoặc ghi chú đánh giá"></label><button class="btn pri" data-review-save>Lưu đánh giá</button></div>`:'<p class="quality-disclaimer" role="note">Chế độ Reviewer: bạn có thể xem tín hiệu, không thể thay đổi quyết định.</p>'}</div></td></tr>`)};
  const loadResponsePage=async(page=responsePage)=>{
   responsePage=page;
   const listEl=$('#response-list');listEl.innerHTML='<div class="state" role="status">Đang tải phản hồi…</div>';
   try{
    const params=new URLSearchParams({page:String(page+1)});
    if(responseFilter!='all')params.set('status',responseFilter);
    Object.entries(range).forEach(([key,value])=>{if(value)params.set(key,value)});
    const result=await api('GET',`/responses/survey/${id}?${params}`);
    rows=result.responses;responseTotal=result.total??rows.length;
    const lastPage=Math.max(0,Math.ceil(responseTotal/pageSize)-1);
    if(responsePage>lastPage)return loadResponsePage(lastPage);
    listEl.innerHTML=renderResponseList();wireResponseRows();
   }catch(e){listEl.innerHTML=`<div class="state error-state">Không thể tải phản hồi: ${esc(e.message)} <button class="btn" id="responses-retry">Thử lại</button></div>`;$('#responses-retry').onclick=()=>loadResponsePage(responsePage)}
  };
  const wireResponseRows=()=>{$$('.tbl tr.r').forEach(tr=>{tr.tabIndex=0;tr.setAttribute('aria-label','Xem chi tiết phản hồi');tr.setAttribute('aria-expanded','false');tr.onclick=()=>toggleResponse(tr);tr.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();toggleResponse(tr)}}});
   $$('[data-review-save]').forEach(button=>button.onclick=async()=>{const detail=button.closest('.dt'),tr=detail?.previousElementSibling,x=rows[tr?.dataset.i],status=$('[data-review-status]',detail)?.value,note=$('[data-review-note]',detail)?.value||'';if(!x)return;
    const restore=setButtonLoading(button,'Đang lưu…');
    try{const result=await api('PUT',`/responses/${x.id}/review`,{status,note});Object.assign(x,result.response);toast('Đã lưu đánh giá phản hồi');await loadResponsePage(responsePage)}
    catch(e){restore();toast(e.message,'error')}
   });
   const filter=$('#response-review-filter'),search=$('#response-search');
   if(filter){filter.value=responseFilter;filter.onchange=()=>{responseFilter=filter.value;responsePage=0;responseSearch='';search.value='';loadResponsePage(0)}}
   if(search){search.value=responseSearch;search.oninput=()=>{responseSearch=search.value.trim();responsePage=0;$('#response-list').innerHTML=renderResponseList();wireResponseRows()}}
   const reset=$('[data-response-reset]');
   if(reset)reset.onclick=()=>{responseFilter='all';responseSearch='';responsePage=0;const filter=$('#response-review-filter');filter.value='all';window.BrainstormUI.refreshDropdown(filter);$('#response-search').value='';loadResponsePage(0)};
   const prev=$('#responses-prev'),next=$('#responses-next');
   if(prev)prev.onclick=()=>loadResponsePage(responsePage-1);
   if(next)next.onclick=()=>loadResponsePage(responsePage+1);
   const retry=$('#responses-retry');if(retry)retry.onclick=()=>loadResponsePage(responsePage)
  };
  wireResponseRows();
 }catch(e){fail('analytics',e,()=>analyticsView(id))}}

/* ---------- router ---------- */
async function render(){
 const [r,arg,detail]=location.hash.replace(/^#\/?/,'').split('/');
 if(r=='s'&&arg)return surveyView(arg);
 if(!me){try{me=(await api('GET','/auth/me')).user}catch(e){if(e.status!==401){app().className='app bare';app().innerHTML=`<div class="error-state global-error" role="alert"><div class="error-mark" aria-hidden="true">!</div><h2>Không thể kết nối</h2><p>${esc(e.message||'Vui lòng kiểm tra kết nối rồi thử lại.')}</p><button class="btn pri" id="retry">Thử lại</button></div>`;$('#retry').onclick=render;return}}}
 if(!me)return authView();
 window.scrollTo(0,0);
 if(r=='preview'&&arg)return surveyView(null,arg);
 if(r=='admin'){
  const query=new URLSearchParams(location.hash.split('?')[1]||'');
  return adminView((arg||'overview').split('?')[0],detail?.split('?')[0],Number(query.get('page'))||1)
 }
 if(r=='builder')return builderView(arg);
 if(r=='analytics'){
  const query=new URLSearchParams(location.hash.split('?')[1]||'');
  return analyticsView((arg||'').split('?')[0],{from:query.get('from')||'',to:query.get('to')||''})
 }
 if(r=='report'){
  const query=new URLSearchParams(location.hash.split('?')[1]||'');
  return reportView((arg||'').split('?')[0],{from:query.get('from')||'',to:query.get('to')||''})
 }
 if(r=='research')return researchView(arg);
 return dashboardView()}
addEventListener('hashchange',render);render();
