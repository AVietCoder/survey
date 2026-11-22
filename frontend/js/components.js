/* brainst0rm UI kit: string-returning components (button, card, chip, field, emptyState, skipLink).
   Tải sau ui.js, trước app.js/tracking.js. Mọi chuỗi người dùng được thoát ở đây; `icon`, `body`, `action`
   là HTML đã tin cậy (thường từ svg()), không phải văn bản người dùng. */
(()=>{
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const VARIANTS={primary:'pri',secondary:'secondary',outline:'outline',danger:'danger','text-danger':'text-danger',default:''};
 const TONES=['run','warn','bad','end','ok'];
 let uid=0;

 /* Thuộc tính HTML từ object: {id:'x','data-a':1, disabled:true}. Giá trị false/null bị bỏ, true thành thuộc tính rỗng. */
 function attrs(map){
  return Object.entries(map||{}).filter(([,v])=>v!==false&&v!=null)
   .map(([k,v])=>v===true?` ${k}`:` ${k}="${esc(v)}"`).join('');
 }

 /* button({label, variant, icon, href, type, size, block, attrs}) → <button>/<a class="btn …"> */
 function button({label='',variant='default',icon='',href='',type='button',size='',block=false,attrs:extra={}}={}){
  const cls=['btn',VARIANTS[variant]??'',size==='sm'?'btn-sm':'',block?'btn-block':'',extra.class||''].filter(Boolean).join(' ');
  const rest={...extra};delete rest.class;
  const inner=`${icon||''}${label?`<span>${esc(label)}</span>`:''}`;
  if(href)return `<a class="${cls}" href="${esc(href)}"${attrs(rest)}>${inner}</a>`;
  return `<button class="${cls}" type="${esc(type)}"${attrs(rest)}>${inner}</button>`;
 }

 /* card({title, body, as, className, attrs}) → <section class="card …"> với tiêu đề tùy chọn */
 function card({title='',body='',as='section',className='',attrs:extra={}}={}){
  const tag=['section','article','div','aside'].includes(as)?as:'section';
  return `<${tag} class="card${className?' '+esc(className):''}"${attrs(extra)}>${title?`<h3>${esc(title)}</h3>`:''}${body}</${tag}>`;
 }

 /* chip({text, tone}) — tone: run|warn|bad|end|ok (luôn kèm chữ, không chỉ màu) */
 function chip({text='',tone='end'}={}){
  return `<span class="chip c-${TONES.includes(tone)?tone:'end'}">${esc(text)}</span>`;
 }

 /* field({label, control, hint, error, id}) — control là HTML (vd <input class="in">). Nhãn gắn bằng <label for>. Hint/error có id `${id}-hint` / `${id}-err`:
    đặt aria-describedby tương ứng trên control. Không truyền id thì control được bọc trong <label>. */
 function field({label='',control='',hint='',error='',id=''}={}){
  const key=id||`uk-f${++uid}`;
  const hintId=hint?`${key}-hint`:'',errId=error?`${key}-err`:'';
  return `<div class="uk-field${error?' has-error':''}"><label class="uk-label"${id?` for="${esc(id)}"`:''}>${esc(label)}${id?'':control}</label>${id?control:''}`
   +(hint?`<small class="uk-hint" id="${hintId}">${esc(hint)}</small>`:'')
   +(error?`<small class="uk-error" id="${errId}" role="alert">${esc(error)}</small>`:'')+`</div>`;
 }

 /* inputField/textareaField — ô nhập dùng chung giữa trình tạo câu hỏi và hộp thoại nhiệm vụ/quà.
    `attrs` là chuỗi thuộc tính HTML đã tin cậy (do code dựng, không phải dữ liệu người dùng). */
 function inputField({label='',name='',value='',attrs='',id='',labelClass=''}={}){
  return `<label${labelClass?` class="${esc(labelClass)}"`:''}>${esc(label)}<input class="in"${name?` name="${esc(name)}"`:''}${id?` id="${esc(id)}"`:''} value="${esc(value??'')}" ${attrs}</label>`
 }
 function textareaField({label='',name='',value='',rows=2,maxlength=0,attrs=''}={}){
  return `<label>${esc(label)}<textarea class="in"${name?` name="${esc(name)}"`:''} rows="${Number(rows)||2}"${maxlength?` maxlength="${Number(maxlength)}"`:''} ${attrs}>${esc(value??'')}</textarea></label>`
 }

 /* emptyState({icon, title, text, action}) — icon là HTML svg; action là HTML nút/liên kết */
 function emptyState({icon='',title='',text='',action='',level=3}={}){
  const h=[1,2,3,4].includes(level)?level:3;
  return `<section class="empty-state"><span class="empty-state-icon" aria-hidden="true">${icon}</span><div><h${h}>${esc(title)}</h${h}>${text?`<p>${esc(text)}</p>`:''}${action?`<div class="empty-state-actions">${action}</div>`:''}</div></section>`;
 }

 /* skipLink(targetId) — liên kết "Bỏ qua tới nội dung" cho bàn phím; đích cần id + tabindex="-1" */
 function skipLink(targetId='main'){
  return `<a class="skip-link" href="#${esc(targetId)}" data-skip="${esc(targetId)}">Bỏ qua tới nội dung</a>`;
 }

 /* Hash routing: href="#id" sẽ đổi route của SPA, nên chuyển tiêu điểm thủ công thay vì điều hướng. */
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[data-skip]');
  if(!link)return;
  event.preventDefault();
  const target=document.getElementById(link.dataset.skip);
  if(target){target.focus({preventScroll:false});target.scrollIntoView({block:'start'})}
 });

 window.UIKit={esc,attrs,button,card,chip,field,inputField,textareaField,emptyState,skipLink};
})();
