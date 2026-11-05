/* Lumen — frontend (giữ nguyên giao diện, dữ liệu lấy từ API thật) */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)};
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
const ic={home:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',shield:'<path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3z"/><path d="m9 12 2 2 4-4"/>'};
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
const col=['#CFC9F7','#BFE3DD','#F4DDB0','#F5C9D2','#C8D8F0','#DDE6C0'];
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
const nav=[['dashboard','Tổng quan','home'],['builder','Trình tạo','edit'],['analytics','Phân tích','chart']];
function shell(r,html){
 app().className='app';
 const links=me?.is_admin?[...nav,['admin','Quản trị','shield']]:nav;
 app().innerHTML=`<aside class="side"><div class="logo"><i></i>Lumen</div><nav class="nav">${links.map(([k,l,i])=>`<a href="#/${k}" class="${k==r?'on':''}" ${k==r?'aria-current="page"':''}><svg viewBox="0 0 24 24">${ic[i]}</svg>${l}</a>`).join('')}</nav>
 <div class="tip"><b>Mẹo thiết kế</b><br>Nhóm 5–7 câu mỗi trang để giảm mệt mỏi nhận thức.</div>
 <div class="who">${esc(me.username)}<button id="out">Đăng xuất</button></div></aside><main>${html}</main>`;
 $('#out').onclick=async()=>{await api('POST','/auth/logout').catch(()=>{});me=null;location.hash='#/login';render()}}
const loading=r=>{
 const content=`<div class="page-skeleton" role="status" aria-live="polite" aria-busy="true" aria-label="Đang tải nội dung">
  <div class="skeleton-head"><div class="skeleton-block skeleton-title"></div><div class="skeleton-block skeleton-action"></div></div>
  <div class="grid g4">${Array.from({length:4},()=>'<div class="card kpi skeleton-card"><i class="skeleton-block"></i><b class="skeleton-block"></b><small class="skeleton-block"></small></div>').join('')}</div>
  ${r=='builder'?'<div class="skeleton-builder"><div class="card"><i class="skeleton-block"></i><i class="skeleton-block"></i><i class="skeleton-block"></i><i class="skeleton-block"></i></div><div class="card"><i class="skeleton-block"></i><i class="skeleton-block"></i></div></div>':r=='analytics'?'<div class="skeleton-builder"><div class="card skeleton-chart"><i class="skeleton-block"></i></div><div class="card skeleton-chart"><i class="skeleton-block"></i></div></div>':'<div class="skeleton-list"><i class="skeleton-block"></i><i class="skeleton-block"></i></div>'}
 </div>`;
 shell(r,content)
};
const fail=(r,e,retry)=>{
 shell(r,`<div class="error-state" role="alert"><div class="error-mark" aria-hidden="true">!</div><h2>Chưa thể tải nội dung</h2><p>${esc(e.message||'Đã xảy ra lỗi. Vui lòng thử lại.')}</p><div class="error-actions"><button class="btn pri" id="retry">Thử lại</button><a class="btn" href="#/dashboard">Về tổng quan</a></div></div>`);
 $('#retry').onclick=retry||(()=>render())
};

/* ---------- Đăng nhập / đăng ký ---------- */
function authView(){
 let mode='login';
 const draw=()=>{app().className='app bare';app().innerHTML=`<div class="auth"><div class="card"><div class="logo"><i></i>Lumen</div><p class="sub">${mode=='login'?'Chào mừng trở lại.':'Tạo tài khoản để bắt đầu.'}</p>
 <input class="in" id="u" placeholder="Username" autocomplete="username" maxlength="30"><input class="in" id="p" type="password" placeholder="Mật khẩu (tối thiểu 8 ký tự)" autocomplete="${mode=='login'?'current-password':'new-password'}">
 <div class="err" id="e"></div><button class="btn pri" id="go" style="width:100%">${mode=='login'?'Đăng nhập':'Đăng ký'}</button>
 <p style="text-align:center;margin-top:16px;color:var(--mute);font-size:14px">${mode=='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <a href="#" id="sw" style="color:var(--iris);font-weight:600">${mode=='login'?'Đăng ký':'Đăng nhập'}</a></p></div></div>`;
  $('#sw').onclick=e=>{e.preventDefault();mode=mode=='login'?'reg':'login';draw()};
  const go=async()=>{const button=$('#go');if(button.disabled)return;const restore=setButtonLoading(button,mode=='login'?'Đang đăng nhập…':'Đang đăng ký…');try{$('#e').textContent='';$('#u').removeAttribute('aria-invalid');$('#p').removeAttribute('aria-invalid');const r=await api('POST',mode=='login'?'/auth/login':'/auth/register',{username:$('#u').value,password:$('#p').value});me=r.user;location.hash='#/dashboard';render()}catch(e){restore();$('#e').textContent=e.message;$('#u').setAttribute('aria-invalid','true');$('#p').setAttribute('aria-invalid','true')}};
  $('#go').onclick=go;$('#p').onkeydown=e=>{if(e.key=='Enter')go()};$('#u').focus()};
 draw()}

/* ---------- Dashboard ---------- */
async function dashboardView(){
 loading('dashboard');
 try{const [o,l]=await Promise.all([api('GET','/analytics/overview'),api('GET','/surveys')]);let list=l.surveys,f='all';
  const kp=[['Tổng phản hồi',o.completed.toLocaleString('vi'),`${o.totalSurveys} khảo sát`],['Tỷ lệ hoàn thành',o.completionRate+'%',`${o.completed}/${o.started} lượt bắt đầu`],['Thời gian trung bình',fmt(o.avgDuration),'phút:giây'],['Phản hồi bình thường',o.normalRate==null?'—':o.normalRate+'%',`${o.quality.suspicious+o.quality.spam} cần xem lại`]];
  shell('dashboard',`<div class="head"><div><h1>Chào buổi sáng, ${esc(me.username)}</h1><p>${list.filter(s=>s.status=='published').length} khảo sát đang thu thập phản hồi.</p></div><button class="btn pri" id="new">Tạo khảo sát mới</button></div>
  <div class="grid g4">${kp.map(k=>`<div class="card kpi"><span>${k[0]}</span><b>${k[1]}</b><small>${k[2]}</small></div>`).join('')}</div>
  <div class="tabs">${[['all','Tất cả'],['published','Đang chạy'],['draft','Bản nháp'],['archived','Lưu trữ']].map((t,i)=>`<button data-f="${t[0]}" class="${i?'':'on'}">${t[1]}</button>`).join('')}</div><div id="list"></div>`);
  const draw=()=>{const x=list.filter(s=>f=='all'||s.status==f);$('#list').innerHTML=x.length?x.map(s=>`<div class="row" data-id="${s.id}" role="group" tabindex="0" aria-label="Khảo sát ${esc(s.title)}"><div><h3>${esc(s.title)}</h3><small>Cập nhật ${ago(s.updated_at)}</small></div><span class="chip ${SL[s.status][1]}" style="width:max-content">${SL[s.status][0]}</span>
  <div><small>Hoàn thành ${s.completion_rate}%</small><div class="bar"><i style="width:${s.completion_rate}%"></i></div></div><div style="text-align:right"><a href="#/analytics/${s.id}" onclick="event.stopPropagation()"><b>${s.response_count}</b><small>phản hồi</small></a></div></div>`).join(''):'<div class="state">Chưa có khảo sát nào ở mục này.</div>';
   $$('.row').forEach(r=>{r.onclick=()=>location.hash='#/builder/'+r.dataset.id;r.onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();location.hash='#/builder/'+r.dataset.id}}})};
  draw();$$('.tabs button').forEach(b=>{b.setAttribute('aria-pressed',String(b.classList.contains('on')));b.onclick=()=>{f=b.dataset.f;$$('.tabs button').forEach(x=>{x.classList.toggle('on',x==b);x.setAttribute('aria-pressed',String(x==b))});draw()}});
  $('#new').onclick=async()=>{const restore=setButtonLoading($('#new'),'Đang tạo…');try{const s=(await api('POST','/surveys',{title:'Khảo sát chưa đặt tên'})).survey;location.hash='#/builder/'+s.id}catch(e){restore();toast(e.message)}};
 }catch(e){fail('dashboard',e,()=>dashboardView())}}

/* ---------- Quản trị viên ---------- */
const adminTypes=types.map(([id,,label])=>[id,label]);
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
  }catch(e){if(id===requestId)toast(e.message)}}
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
 const navBack=`<div class="head"><div><h1>Quản trị hệ thống</h1><p>Quản lý tài khoản, khảo sát và phản hồi trên toàn hệ thống.</p></div></div>${tabs}`;
 try{
  if(section=='users'){
  const data=await api('GET','/admin/users?page='+page),{users,total,pageSize}=data;
  const actualPage=Math.min(page,Math.max(1,Math.ceil(total/pageSize)));
  if(actualPage!==page)return adminView('users',null,actualPage);
   shell('admin',`${navBack}<div class="admin-layout"><section class="card"><h2>Tạo tài khoản</h2><form id="admin-user-create" class="admin-form">
    <label>Username<input class="in" name="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_]+" required></label>
    <label>Mật khẩu tạm<input class="in" name="password" type="password" minlength="8" maxlength="72" required></label>
    <button class="btn pri" type="submit">Thêm tài khoản</button></form>
    <p class="admin-note">Quyền quản trị được cấp thủ công bằng cột <code>is_admin</code> trong database.</p></section>
    <section class="card admin-table-card"><div class="admin-section-head"><h2>Tài khoản</h2><span>${total} tổng cộng</span></div>
    ${users.length?`<div class="admin-table-wrap"><table class="tbl"><thead><tr><th>Tài khoản</th><th>Quyền</th><th>Được tạo</th><th>Chỉnh sửa</th><th></th></tr></thead><tbody>${users.map(u=>`<tr>
     <td><strong>${esc(u.username)}</strong><small class="admin-id">${esc(u.id)}</small></td>
     <td><span class="chip ${u.is_admin?'c-run':'c-end'}">${u.is_admin?'Admin':'Người dùng'}</span></td>
     <td>${new Date(u.created_at).toLocaleDateString('vi')}</td>
     <td><form class="admin-user-edit" data-user-edit="${u.id}"><input class="in" name="username" value="${esc(u.username)}" aria-label="Username mới" maxlength="30" required><input class="in" name="password" type="password" placeholder="Mật khẩu mới (nếu đổi)" aria-label="Mật khẩu mới" minlength="8" maxlength="72"><button class="btn" type="submit">Lưu</button></form></td>
     <td><button class="btn danger" data-user-remove="${u.id}" ${u.id==me.id?'disabled title="Không thể xóa tài khoản đang đăng nhập"':''}>Xóa</button></td>
    </tr>`).join('')}</tbody></table></div>`:'<div class="state">Chưa có tài khoản nào ở trang này.</div>'}${adminPager('users',page,pageSize,total)}</section></div>`);
   $('#admin-user-create').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang tạo…');try{await api('POST','/admin/users',{username:form.username.value,password:form.password.value});toast('Đã tạo tài khoản');adminView('users')}catch(err){restore();toast(err.message)}};
   $$('[data-user-edit]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang lưu…');try{await api('PUT','/admin/users/'+form.dataset.userEdit,{username:form.username.value,password:form.password.value||undefined});toast('Đã cập nhật tài khoản');adminView('users')}catch(err){restore();toast(err.message)}});
   $$('[data-user-remove]').forEach(button=>button.onclick=async()=>{if(!await confirmAction('Tài khoản, khảo sát, câu hỏi và phản hồi liên quan sẽ bị xóa vĩnh viễn.','Xóa tài khoản?','Xóa tài khoản'))return;const lastOnPage=$$('[data-user-remove]').length===1,restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/admin/users/'+button.dataset.userRemove);toast('Đã xóa tài khoản');adminView('users',null,lastOnPage&&page>1?page-1:page)}catch(err){restore();toast(err.message)}});
   return
  }
  if(section=='surveys'&&!surveyId){
   const [data,accountData]=await Promise.all([api('GET','/admin/surveys?page='+page),api('GET','/admin/users')]);
   const {surveys,total,pageSize}=data,users=accountData.users;
   const actualPage=Math.min(page,Math.max(1,Math.ceil(total/pageSize)));
   if(actualPage!==page)return adminView('surveys',null,actualPage);
   shell('admin',`${navBack}<section class="card admin-create-survey"><h2>Tạo khảo sát cho tài khoản</h2><form id="admin-survey-create" class="admin-survey-form">
    <label>Tìm chủ sở hữu<input class="in" data-owner-search placeholder="Nhập ít nhất 2 ký tự username"></label>
    <label>Chủ sở hữu<select class="sel" name="user_id" data-owner-select required>${users.map(u=>`<option value="${u.id}">${esc(u.username)}</option>`).join('')}</select></label>
    <label>Tên khảo sát<input class="in" name="title" maxlength="200" value="Khảo sát chưa đặt tên"></label><button class="btn pri" type="submit">Tạo khảo sát</button></form></section>
    <section class="card admin-table-card"><div class="admin-section-head"><h2>Tất cả khảo sát</h2><span>${total} tổng cộng</span></div>
    ${surveys.length?`<div class="admin-table-wrap"><table class="tbl"><thead><tr><th>Khảo sát</th><th>Chủ sở hữu</th><th>Trạng thái</th><th>Phản hồi</th><th></th></tr></thead><tbody>${surveys.map(s=>`<tr>
     <td><strong>${esc(s.title)}</strong><small class="admin-id">${esc(s.id)}</small></td><td>${esc(s.owner)}</td>
     <td><span class="chip ${SL[s.status]?.[1]||'c-end'}">${SL[s.status]?.[0]||esc(s.status)}</span></td>
     <td>${s.response_count}</td><td><a class="btn" href="#/admin/surveys/${s.id}">Mở quản lý</a></td>
    </tr>`).join('')}</tbody></table></div>`:'<div class="state">Chưa có khảo sát nào ở trang này.</div>'}${adminPager('surveys',page,pageSize,total)}</section>`);
   wireAdminOwnerSearch(app());
   $('#admin-survey-create').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang tạo…');try{const result=await api('POST','/admin/surveys',{user_id:form.user_id.value,title:form.title.value});location.hash='#/admin/surveys/'+result.survey.id}catch(err){restore();toast(err.message)}};
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
     <section class="card admin-table-card">          <div class="admin-section-head"><h2>Phản hồi (${responsesData.total})</h2><span>Trang ${page}</span></div>
      ${responsesData.responses.length?`<div class="admin-responses">${responsesData.responses.map(r=>`<details class="admin-response">
       <summary><span>${r.submitted_at?new Date(r.submitted_at).toLocaleString('vi'):'Chưa hoàn tất'}</span><span class="chip ${r.quality_status=='normal'?'c-ok':r.quality_status=='spam'?'c-bad':'c-warn'}">${esc(r.quality_status)}</span></summary>
       <button class="btn danger" type="button" data-response-remove="${r.id}">Xóa phản hồi</button>
       <div class="admin-answers">${(r.answers||[]).length?(r.answers||[]).map(a=>`<div><strong>${esc(a.questions?.question_text||'Câu hỏi đã xóa')}</strong><p>${esc(typeof a.answer_value=='string'?a.answer_value:JSON.stringify(a.answer_value))}</p></div>`).join(''):'<p>Chưa có câu trả lời.</p>'}</div>
      </details>`).join('')}</div>`:'<div class="state">Chưa có phản hồi nào ở trang này.</div>'}${adminPager('surveys/'+survey.id,page,responsesData.pageSize,responsesData.total)}
     </section>`);
    wireAdminOwnerSearch(app());
    const readQuestions=()=>$$('[data-admin-question]').map(card=>{
     const q=questions[+card.dataset.adminQuestion];
     let settings;
     try{settings=JSON.parse($('[data-q-settings]',card).value);if(!settings||typeof settings!='object'||Array.isArray(settings))throw new Error()}catch{throw new Error(`Cài đặt JSON ở câu ${+card.dataset.adminQuestion+1} không hợp lệ`)}
     return {...q,question_text:$('[data-q-text]',card).value.trim(),question_type:$('[data-q-type]',card).value,is_required:$('[data-q-required]',card).checked,
      settings,options:$('[data-q-options]',card).value.split('\n').map(s=>s.trim()).filter(Boolean).map(label=>({label,value:label}))}
    });
    $('#admin-question-add').onclick=()=>{try{questions=readQuestions();questions.push({question_text:'Câu hỏi mới',question_type:'text',is_required:true,settings:{},options:[]});renderSurvey()}catch(err){toast(err.message)}};
    $$('[data-question-remove]').forEach(button=>button.onclick=async()=>{if(!await confirmAction('Khi lưu, các câu trả lời cho câu hỏi này cũng sẽ bị xóa.','Xóa câu hỏi?','Xóa câu hỏi'))return;try{questions=readQuestions();questions.splice(+button.dataset.questionRemove,1);renderSurvey()}catch(err){toast(err.message)}});
    $('#admin-survey-edit').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,button=$('button[type=submit]',form),restore=setButtonLoading(button,'Đang lưu…');try{
     const updated=await api('PUT','/admin/surveys/'+survey.id,{title:form.title.value,description:form.description.value,status:form.status.value,user_id:form.user_id.value,questions:readQuestions()});
     survey=updated.survey;questions=survey.questions;toast('Đã lưu khảo sát');renderSurvey()
    }catch(err){restore();toast(err.message)}};
    $('#admin-survey-remove').onclick=async()=>{if(!await confirmAction('Khảo sát, câu hỏi và toàn bộ phản hồi liên quan sẽ bị xóa vĩnh viễn.','Xóa khảo sát?','Xóa khảo sát'))return;const button=$('#admin-survey-remove'),restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/admin/surveys/'+survey.id);toast('Đã xóa khảo sát');location.hash='#/admin/surveys'}catch(err){restore();toast(err.message)}};
    $$('[data-response-remove]').forEach(button=>button.onclick=async e=>{e.preventDefault();e.stopPropagation();if(!await confirmAction('Phản hồi và toàn bộ câu trả lời liên quan sẽ bị xóa.','Xóa phản hồi?','Xóa phản hồi'))return;const lastOnPage=$$('[data-response-remove]').length===1,restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/admin/responses/'+button.dataset.responseRemove);toast('Đã xóa phản hồi');adminView('surveys',survey.id,lastOnPage&&page>1?page-1:page)}catch(err){restore();toast(err.message)}});
   };
   renderSurvey();return
  }
  const data=await api('GET','/admin/overview');
  shell('admin',`${navBack}<div class="grid g3 admin-stats">${[['Tài khoản',data.users,'users'],['Khảo sát',data.surveys,'surveys'],['Phản hồi',data.responses,'surveys']].map(([label,count,key])=>`<a class="card admin-stat" href="#/admin/${key}"><span>${label}</span><strong>${Number(count).toLocaleString('vi')}</strong><small>Mở quản lý →</small></a>`).join('')}</div>
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
 shell('builder',`<div class="head"><div style="flex:1;min-width:260px"><input class="ttl" id="ttl" value="${esc(cur.title)}" maxlength="200" aria-label="Tên khảo sát"><p><span id="sv">Đã lưu</span> · ${cur.questions.length} câu hỏi · <span class="chip ${SL[cur.status][1]}">${SL[cur.status][0]}</span></p>
 ${cur.status=='published'?`<div class="linkbox"><span>${esc(pubLink())}</span><button id="cp">Sao chép</button></div>`:''}</div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><div class="seg"><button data-m="edit" class="${mode=='edit'?'on':''}">Chỉnh sửa</button><button data-m="prev" class="${mode=='prev'?'on':''}">Xem trước</button></div>
 <button class="btn" id="del" style="color:var(--rose)">Xóa</button><button class="btn pri" id="pub">${cur.status=='published'?'Hủy xuất bản':'Xuất bản'}</button></div></div>
 <div class="bld"><div class="lib"><h3 style="margin-bottom:12px">Thư viện câu hỏi</h3>${types.map(t=>`<button data-add="${t[0]}"><em>${t[1]}</em><span>${t[2]}<small>${t[3]}</small></span></button>`).join('')}</div><div id="cv"></div><div class="card" id="pp"></div></div>`);
 $('#ttl').oninput=e=>{cur.title=e.target.value;dirty()};
 $$('[data-add]').forEach(b=>b.onclick=()=>{cur.questions.push(mk(b.dataset.add));selI=cur.questions.length-1;mode='edit';drawCv();drawPp();dirty();toast('Đã thêm '+TN[b.dataset.add]);$('#cv').lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'})});
 $$('[data-m]').forEach(b=>{b.setAttribute('aria-pressed',String(b.classList.contains('on')));b.onclick=()=>{mode=b.dataset.m;$$('[data-m]').forEach(x=>{x.classList.toggle('on',x==b);x.setAttribute('aria-pressed',String(x==b))});drawCv();drawPp()}});
 $('#pub').onclick=async()=>{const button=$('#pub'),restore=setButtonLoading(button,'Đang lưu…'),oldStatus=cur.status;cur.status=cur.status=='published'?'draft':'published';clearTimeout(saveT);if(await save()){toast(cur.status=='published'?'Đã xuất bản — chia sẻ đường dẫn bên dưới tiêu đề':'Đã chuyển về bản nháp');builderRender()}else{cur.status=oldStatus;restore()}};
 $('#del').onclick=async()=>{if(!await confirmAction('Khảo sát và toàn bộ phản hồi liên quan sẽ bị xóa vĩnh viễn.'))return;const button=$('#del'),restore=setButtonLoading(button,'Đang xóa…');try{await api('DELETE','/surveys/'+cur.id);toast('Đã xóa khảo sát');location.hash='#/dashboard'}catch(e){restore();toast(e.message)}};
 const cp=$('#cp');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(pubLink());toast('Đã sao chép đường dẫn')}catch(e){toast('Không thể sao chép đường dẫn trên thiết bị này')}} 
 drawCv();drawPp()}
const setSv=t=>{const e=$('#sv');if(e)e.textContent=t};
function dirty(){setSv('Đang lưu…');clearTimeout(saveT);saveT=setTimeout(save,800)}
async function save(){
 try{const r=(await api('PUT','/surveys/'+cur.id,{title:cur.title,description:cur.description,status:cur.status,settings:cur.settings,questions:cur.questions})).survey;
  cur.questions.forEach((q,i)=>{if(r.questions[i])q.id=r.questions[i].id});cur.status=r.status;cur.public_slug=r.public_slug;setSv('Đã lưu');return true}
 catch(e){setSv('Chưa lưu: '+e.message);toast(e.message);return false}}
function drawCv(){
 const cv=$('#cv'),edit=mode=='edit';
 cv.innerHTML=cur.questions.length?cur.questions.map((q,i)=>`<div class="q ${i==selI&&edit?'is-selected':''}" draggable="${edit}" data-i="${i}">${edit?'<span class="grip" title="Kéo để sắp xếp">⋮⋮</span>':''}<div class="tag">Câu ${i+1} · ${TN[q.question_type]}${q.is_required?' · bắt buộc':''}</div><h3>${esc(q.question_text)}</h3>${body(q)}</div>`).join(''):'<div class="empty">Chọn một dạng câu hỏi ở bên trái để bắt đầu.</div>';
 $$('.q',cv).forEach(el=>{wire(el);const i=+el.dataset.i;
  el.onclick=()=>{if(edit&&selI!=i){selI=i;drawCv();drawPp()}};
  el.ondragstart=()=>{dragI=i;setTimeout(()=>el.classList.add('drag'))};el.ondragend=()=>el.classList.remove('drag');
  el.ondragover=e=>{e.preventDefault();el.classList.add('over')};el.ondragleave=()=>el.classList.remove('over');
  el.ondrop=e=>{e.preventDefault();if(dragI==null||dragI==i)return;const m=cur.questions.splice(dragI,1)[0];cur.questions.splice(i,0,m);selI=i;dragI=null;drawCv();drawPp();dirty();toast('Đã đổi thứ tự câu hỏi')}})}
const lines=v=>v.split('\n').map(x=>x.trim()).filter(Boolean);
function drawPp(){
 const q=cur.questions[selI],pp=$('#pp');
 if(mode=='prev'){pp.innerHTML=`<h3>Xem trước</h3><p style="color:var(--mute);margin:8px 0 14px">Người tham gia sẽ thấy từng câu một, trên nền tĩnh.</p><a class="btn" style="display:inline-block;text-decoration:none" href="#/preview/${cur.id}" onclick="clearTimeout(saveT);save()">Mở trải nghiệm đầy đủ</a>`;return}
 if(!q){pp.innerHTML='<p style="color:var(--mute)">Chưa có câu hỏi nào.</p>';return}
 const t=q.question_type,s=q.settings;
 pp.innerHTML=`<h3>Thuộc tính</h3><p style="color:var(--mute);margin:4px 0 16px">${TN[t]}</p><label class="lb">Nội dung câu hỏi</label><textarea id="qt" style="min-height:80px;margin:6px 0 14px">${esc(q.question_text)}</textarea>
 ${hasOpts(t)?`<label class="lb">${t=='matrix'?'Các hàng':'Lựa chọn'} (mỗi dòng một mục)</label><textarea id="qo" style="margin:6px 0 14px">${esc(q.options.map(o=>o.label).join('\n'))}</textarea>`:''}
 ${t=='matrix'?`<label class="lb">Các cột (cách nhau bằng dấu phẩy)</label><input class="in" id="qc" value="${esc((s.cols||[]).join(', '))}" style="margin:6px 0 14px">`:''}
 ${t=='sd'?`<label class="lb">Cặp đối lập (mỗi dòng: trái | phải)</label><textarea id="qs" style="margin:6px 0 14px">${esc((s.pairs||[]).map(p=>p.join(' | ')).join('\n'))}</textarea>`:''}
 ${t=='likert'||t=='slider'?`<label class="lb">Nhãn hai đầu</label><input class="in" id="lo" value="${esc(s.lo||'')}" placeholder="Đầu thấp" style="margin:6px 0 8px"><input class="in" id="hi" value="${esc(s.hi||'')}" placeholder="Đầu cao">`:''}
 <label class="field"><input type="checkbox" id="rq" ${q.is_required?'checked':''}> Bắt buộc trả lời</label>
 <div style="display:flex;gap:8px;margin-top:10px"><button class="btn" id="dup">Nhân đôi</button><button class="btn" id="rm" style="color:var(--rose)">Xóa câu hỏi</button></div>`;
 const on=(id,fn)=>{const e=$(id);if(e)e.oninput=()=>{fn(e);drawCv();dirty()}};
 on('#qt',e=>q.question_text=e.value);on('#rq',e=>q.is_required=e.checked);
 on('#qo',e=>q.options=L(lines(e.value)));on('#qc',e=>s.cols=e.value.split(',').map(x=>x.trim()).filter(Boolean));
 on('#qs',e=>s.pairs=lines(e.value).map(l=>l.split('|').map(x=>x.trim())).filter(p=>p.length==2&&p[0]&&p[1]));
 on('#lo',e=>s.lo=e.value);on('#hi',e=>s.hi=e.value);
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
  if(S.i<0)inner=`<div class="stage"><span class="num">${previewId?'Xem trước · ':''}${n} câu hỏi</span><h1>${esc(data.title)}</h1><p class="hint">${esc(data.description||'Câu trả lời của bạn được ghi nhận ẩn danh. Bạn có thể dừng bất cứ lúc nào.')}<br>Khoảng ${Math.max(1,Math.round(n*.5))} phút.</p><p class="survey-error" id="survey-error" role="alert"></p><button class="btn pri" id="go">Bắt đầu</button></div>`;
  else if(S.i>=n)inner=`<div class="stage" style="text-align:center"><div class="big">Cảm ơn bạn</div><p class="hint">${previewId?'Đây là bản xem trước — chưa có dữ liệu nào được lưu.':'Câu trả lời của bạn giúp chúng tôi hiểu rõ hơn.'}</p>${previewId?`<a class="btn" style="text-decoration:none;display:inline-block" href="#/builder/${previewId}">Về trình tạo</a>`:''}</div>`;
  else{const q=qs[S.i];inner=`<div class="stage" id="st"><span class="num">Câu ${S.i+1} trên ${n}${q.is_required?'':' · tùy chọn'}</span><h1>${esc(q.question_text)}</h1><p class="hint"></p>${body(q)}<div class="foot"><button class="link" id="bk" ${S.i?'':'style="visibility:hidden"'}>Quay lại</button><button class="btn pri" id="nx">${S.i==n-1?'Hoàn tất':'Tiếp tục'}</button></div></div>`}
  bare(`<div class="sv"><div class="top"><i style="width:${w}%"></i></div><nav><a href="${previewId?'#/builder/'+previewId:'#/'}" ${previewId?'':'style="visibility:hidden"'}>Thoát xem trước</a><span>${S.i>=0&&S.i<n?'Còn khoảng '+Math.max(1,Math.ceil((n-S.i)/2))+' phút':''}</span></nav><section>${inner}</section></div>`);
  const go=$('#go');if(go)go.onclick=async()=>{const restore=setButtonLoading(go,'Đang chuẩn bị…');if(!previewId){try{S.rid=(await api('POST',`/public/surveys/${encodeURIComponent(slug)}/start`)).responseId}catch(e){restore();$('#survey-error').textContent=e.message;return}}S.i=0;draw()};
  const st=$('#st');if(!st)return;const q=qs[S.i];
  if(S.ans[q.id]!==undefined)restore(q,st,S.ans[q.id]);
  const next=async()=>{const nextButton=$('#nx');if(nextButton.disabled)return;nextButton.disabled=true;const originalLabel=nextButton.textContent;const v=collect(q,st);if(v===undefined&&q.is_required){nextButton.disabled=false;toast('Vui lòng trả lời câu này để tiếp tục');return}
   if(v!==undefined)S.ans[q.id]=v;else delete S.ans[q.id];
   if(S.i==qs.length-1){if(!previewId){nextButton.classList.add('is-loading');nextButton.setAttribute('aria-busy','true');nextButton.innerHTML='<span class="spinner" aria-hidden="true"></span>Đang gửi…';try{await api('POST',`/public/surveys/${encodeURIComponent(slug)}/responses`,{responseId:S.rid,answers:Object.entries(S.ans).map(([question_id,value])=>({question_id,value}))})}catch(e){nextButton.disabled=false;nextButton.classList.remove('is-loading');nextButton.removeAttribute('aria-busy');nextButton.textContent=originalLabel;toast(e.message);return}}}
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
const SIG={too_fast:'Hoàn thành quá nhanh',straightline:'Chọn một đáp án lặp lại',gibberish:'Văn bản vô nghĩa',duplicate:'Trùng bộ câu trả lời',frequency:'Gửi liên tục từ một thiết bị'};
async function analyticsView(id){
 loading('analytics');
 try{const list=(await api('GET','/surveys')).surveys;
  if(!list.length){shell('analytics','<div class="head"><div><h1>Phân tích</h1><p>Bạn chưa có khảo sát nào.</p></div><a class="btn pri" href="#/dashboard" style="text-decoration:none">Về tổng quan</a></div>');return}
  if(!id){id=(list.find(s=>s.response_count)||list[0]).id;history.replaceState(null,'','#/analytics/'+id)}
  const [a,r]=await Promise.all([api('GET','/analytics/survey/'+id),api('GET','/responses/survey/'+id)]);
  const d=a.series,mx=Math.max(5,...d.map(x=>x.count))*1.1,pts=d.map((x,i)=>`${20+i*(560/13)},${190-x.count/mx*170}`);
  const Q=a.quality,tot=a.completed||1,pc=k=>Q[k]/tot*100;
  const rows=r.responses;
  const pageSize=25,pageCount=Math.max(1,Math.ceil(rows.length/pageSize));let responsePage=0;
  const renderResponseList=()=>{
   if(!rows.length)return '<div class="state">Chưa có phản hồi nào.'+(a.survey.status=='published'?`<br>Đường dẫn: ${esc(location.origin)}/#/s/${esc(a.survey.public_slug)}`:'<br>Hãy xuất bản khảo sát để bắt đầu thu thập.')+'</div>';
   const start=responsePage*pageSize,end=Math.min(start+pageSize,rows.length);
   const data=rows.slice(start,end).map((x,i)=>{const c={normal:['Hợp lệ','ok'],suspicious:['Đáng ngờ','warn'],spam:['Spam','bad']}[x.quality_status];return `<tr class="r" data-i="${start+i}"><td>${new Date(x.submitted_at).toLocaleString('vi')}</td><td>${fmt(x.duration_seconds)}</td><td>${x.quality_score}</td><td><span class="chip c-${c[1]}">${c[0]}</span></td></tr>`}).join('');
   return `<table class="tbl"><thead><tr><th>Thời điểm</th><th>Thời gian</th><th>Điểm</th><th>Trạng thái</th></tr></thead><tbody>${data}</tbody></table><div class="pagination"><span>Hiển thị ${start+1}–${end} trên ${rows.length} phản hồi</span><div><button class="btn" id="responses-prev" ${responsePage===0?'disabled':''} aria-label="Trang trước">‹</button><span>Trang ${responsePage+1} / ${pageCount}</span><button class="btn" id="responses-next" ${responsePage>=pageCount-1?'disabled':''} aria-label="Trang tiếp theo">›</button></div></div>`
  };
  const sigTotal=Object.entries(a.signalCounts);
  shell('analytics',`<div class="head"><div><h1>${esc(a.survey.title)}</h1><p>${a.completed} phản hồi hoàn tất · 14 ngày gần nhất</p></div>
  <select class="sel" id="pick">${list.map(s=>`<option value="${s.id}" ${s.id==id?'selected':''}>${esc(s.title)}</option>`).join('')}</select></div>
  <div class="grid g4">${[['Phản hồi',a.completed,`${a.started} lượt bắt đầu`],['Hoàn thành',a.completionRate+'%',`${a.completed} hoàn tất`],['Thời gian trung bình',fmt(a.avgDuration),'phút:giây'],['Chất lượng',a.normalRate==null?'—':a.normalRate+'%',`${Q.suspicious+Q.spam} đáng ngờ`]].map(k=>`<div class="card kpi"><span>${k[0]}</span><b>${k[1]}</b><small>${k[2]}</small></div>`).join('')}</div>
  <div class="grid g2" style="margin-top:18px"><div class="card chart"><h3>Phản hồi theo ngày</h3><svg viewBox="0 0 600 220"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B4FD1" stop-opacity=".25"/><stop offset="1" stop-color="#5B4FD1" stop-opacity="0"/></linearGradient></defs>
  ${[0,1,2,3].map(i=>`<line x1="20" x2="580" y1="${20+i*57}" y2="${20+i*57}" stroke="#E4E6F0"/>`).join('')}<polygon points="20,190 ${pts.join(' ')} 580,190" fill="url(#g)"/><polyline points="${pts.join(' ')}" fill="none" stroke="#5B4FD1" stroke-width="2.5" stroke-linejoin="round"/>${pts.map(p=>`<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3.5" fill="#fff" stroke="#5B4FD1" stroke-width="2"/>`).join('')}
  <text x="20" y="212" font-size="11" fill="#6A6F8C">${d[0].date.slice(5).replace('-','/')}</text><text x="580" y="212" font-size="11" fill="#6A6F8C" text-anchor="end">${d[13].date.slice(5).replace('-','/')}</text></svg></div>
  <div class="card"><h3 style="margin-bottom:14px">Chất lượng phản hồi</h3><div class="ring"><svg width="110" height="110" viewBox="0 0 36 36">${[['#23897F',0,pc('normal')],['#E2A63A',pc('normal'),pc('suspicious')],['#C2405A',pc('normal')+pc('suspicious'),pc('spam')]].map(x=>`<circle cx="18" cy="18" r="15.9" fill="none" stroke="${x[0]}" stroke-width="4" stroke-dasharray="${x[2]} ${100-x[2]}" stroke-dashoffset="${-x[1]}" transform="rotate(-90 18 18)"/>`).join('')}</svg>
  <div style="font-size:13px;line-height:2.1"><span class="chip c-ok">Bình thường ${Q.normal}</span><br><span class="chip c-warn">Đáng ngờ ${Q.suspicious}</span><br><span class="chip c-bad">Spam ${Q.spam}</span></div></div>
  <div style="margin-top:14px;font-size:13px;color:var(--mute)">${sigTotal.length?sigTotal.map(([k,n])=>`${SIG[k]||k}: <b>${n}</b>`).join('<br>'):'Chưa phát hiện tín hiệu bất thường.'}</div></div></div>
  <div class="grid g2" style="margin-top:18px;grid-template-columns:1fr 1fr">${a.questions.map(q=>`<div class="card"><small style="color:var(--iris);font-weight:600">${TN[q.type]} · ${q.n} trả lời${q.avg!=null?' · TB '+q.avg:''}</small><h3 style="margin:4px 0 14px">${esc(q.text)}</h3>
   ${q.kind=='bars'?q.bars.map(b=>`<div class="hbar"><span>${esc(b.label)}</span><div class="bar t"><i style="width:${b.pct}%"></i></div><b>${b.pct}%</b></div>`).join(''):q.kind=='rows'?(q.hint?`<small style="color:var(--mute)">${q.hint}</small>`:'')+q.rows.map(b=>`<div class="hbar"><span>${esc(b.label)}</span><div class="bar t"><i style="width:${b.avg==null?0:b.avg/b.max*100}%"></i></div><b>${b.avg??'—'}</b></div>`).join(''):q.samples.length?q.samples.map(x=>`<p style="font-size:14px;padding:8px 0;border-top:1px solid var(--line)">“${esc(x)}”</p>`).join(''):'<p style="color:var(--mute)">Chưa có câu trả lời.</p>'}</div>`).join('')}</div>
  <div class="card response-card" style="margin-top:18px"><h3 style="margin-bottom:8px">Phản hồi gần đây</h3><div id="response-list">${renderResponseList()}</div></div>`);
  $('#pick').onchange=e=>{location.hash='#/analytics/'+e.target.value};
  const toggleResponse=tr=>{const n=tr.nextElementSibling;if(n?.classList.contains('dt')){n.remove();tr.setAttribute('aria-expanded','false');return}$$('.dt').forEach(x=>x.remove());$$('.tbl tr.r').forEach(x=>x.setAttribute('aria-expanded','false'));
   const x=rows[tr.dataset.i],cls=x.quality_status=='spam'?'':x.quality_status=='suspicious'?'w':'ok';
   tr.setAttribute('aria-expanded','true');
   tr.insertAdjacentHTML('afterend',`<tr class="dt"><td colspan="4" style="padding:0;border:0"><div class="why ${cls}">${x.signals.length?x.signals.map(s=>esc(s.message)).join('<br>'):'Không phát hiện tín hiệu bất thường: thời gian hợp lý, đáp án đa dạng.'}</div></td></tr>`)};
  const wireResponseRows=()=>{$$('.tbl tr.r').forEach(tr=>{tr.tabIndex=0;tr.setAttribute('aria-label','Xem chi tiết phản hồi');tr.setAttribute('aria-expanded','false');tr.onclick=()=>toggleResponse(tr);tr.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();toggleResponse(tr)}}});
   const prev=$('#responses-prev'),next=$('#responses-next');
   if(prev)prev.onclick=()=>{responsePage--;$('#response-list').innerHTML=renderResponseList();wireResponseRows()};
   if(next)next.onclick=()=>{responsePage++;$('#response-list').innerHTML=renderResponseList();wireResponseRows()}
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
 if(r=='analytics')return analyticsView(arg);
 return dashboardView()}
addEventListener('hashchange',render);render();
