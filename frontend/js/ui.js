/* brainst0rm UI primitives: dynamically managed custom selects and toast notices. */
(()=>{
 'use strict';

 const instances=new WeakMap();
 let selectSequence=0,toastSequence=0,toastRegion=null;

 const text=(node)=>node?.textContent?.replace(/\s+/g,' ').trim()||'';
 const selectedOption=select=>select.options[select.selectedIndex]||null;

 function accessibleName(select){
  const explicit=select.getAttribute('aria-label');
  if(explicit)return {label:explicit};
  const labelledBy=select.getAttribute('aria-labelledby');
  if(labelledBy)return {labelledBy};
  const label=select.labels?.[0]||select.closest('label');
  if(label){
   const copy=label.cloneNode(true);
   copy.querySelectorAll('select,button,.ui-select').forEach(node=>node.remove());
   const labelText=text(copy);
   if(labelText)return {label:labelText};
  }
  return {label:select.title||'Chọn một mục'};
 }

 function close(instance,{restoreFocus=false}={}){
  if(!instance.open)return;
  instance.open=false;
  instance.wrapper.classList.remove('is-open');
  instance.menu.classList.remove('is-open');
  instance.trigger.setAttribute('aria-expanded','false');
  stopTracking(instance);
  clearTimeout(instance.closeTimer);
  instance.closeTimer=setTimeout(()=>{if(!instance.open)instance.menu.hidden=true},190);
  if(restoreFocus)instance.trigger.focus({preventScroll:true});
 }

 function positionMenu(instance){
  if(!instance.open)return;
  const rect=instance.trigger.getBoundingClientRect();
  const gap=7,viewport=window.innerHeight;
  const below=viewport-rect.bottom-gap,above=rect.top-gap;
  const upward=below<Math.min(220,instance.menu.scrollHeight)&&above>below;
  const available=Math.max(120,Math.min(280,upward?above:below,viewport*.45));
  const width=Math.min(rect.width,window.innerWidth-16);
  instance.menu.style.left=`${Math.max(8,Math.min(rect.left,window.innerWidth-width-8))}px`;
  instance.menu.style.width=`${width}px`;
  instance.menu.style.maxHeight=`${available}px`;
  instance.menu.style.top=upward?'auto':`${rect.bottom+gap}px`;
  instance.menu.style.bottom=upward?`${Math.max(8,viewport-rect.top+gap)}px`:'auto';
 }

 function stopTracking(instance){
  if(!instance.trackFrame)return;
  window.removeEventListener('resize',instance.trackPosition);
  window.removeEventListener('scroll',instance.trackPosition,true);
  cancelAnimationFrame(instance.trackFrame);
  instance.trackFrame=0;
 }

 function startTracking(instance){
  instance.trackPosition=()=>{
   if(instance.trackFrame)return;
   instance.trackFrame=requestAnimationFrame(()=>{instance.trackFrame=0;positionMenu(instance)});
  };
  window.addEventListener('resize',instance.trackPosition,{passive:true});
  window.addEventListener('scroll',instance.trackPosition,true);
  positionMenu(instance);
 }

 function enabledOptions(instance){
  return [...instance.menu.querySelectorAll('[role="option"]:not([aria-disabled="true"])')];
 }

 function focusOption(instance,index){
  const options=enabledOptions(instance);
  if(!options.length)return;
  const next=options[Math.max(0,Math.min(index,options.length-1))];
  next.focus({preventScroll:true});
  next.scrollIntoView({block:'nearest'});
 }

 function choose(instance,option){
  if(!option||option.disabled||option.parentElement?.disabled||instance.select.disabled)return;
  const select=instance.select;
  const changed=select.value!==option.value;
  select.value=option.value;
  instance.trigger.removeAttribute('aria-invalid');
  syncSelect(select);
  if(changed){
   select.dispatchEvent(new Event('input',{bubbles:true}));
   select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  close(instance,{restoreFocus:true});
 }

 function syncSelect(select){
  const instance=instances.get(select);
  if(!instance)return;
  const current=selectedOption(select);
  instance.value.textContent=current?.textContent?.trim()||select.dataset.placeholder||'Chọn một mục';
  instance.trigger.disabled=select.disabled;
  instance.trigger.setAttribute('aria-disabled',String(select.disabled));
  instance.trigger.setAttribute('aria-required',String(select.required));
  instance.wrapper.classList.toggle('is-disabled',select.disabled);
  instance.wrapper.classList.toggle('has-value',Boolean(current&&current.value));
  instance.menu.replaceChildren();
  [...select.options].forEach((option,index)=>{
   const item=document.createElement('div');
   item.className='ui-select-option';
   item.id=`${instance.menu.id}-option-${index}`;
   item.setAttribute('role','option');
   item.setAttribute('aria-selected',String(option===current));
   const disabled=option.disabled||Boolean(option.parentElement?.disabled);
   item.setAttribute('aria-disabled',String(disabled));
   item.dataset.value=option.value;
   item.textContent=option.textContent.trim();
   item.tabIndex=-1;
   item.addEventListener('click',()=>choose(instance,option));
   instance.menu.append(item);
  });
  instance.wrapper.classList.toggle('is-open',instance.open);
  instance.menu.classList.toggle('is-open',instance.open);
 }

 function open(instance,{edge='selected'}={}){
  if(instance.select.disabled)return;
  if(instance.open){close(instance);return}
  document.querySelectorAll('.ui-select.is-open').forEach(wrapper=>{
   const select=wrapper.querySelector('select.ui-native-select');
   const other=select&&instances.get(select);
   if(other)close(other);
  });
  instance.open=true;
  clearTimeout(instance.closeTimer);
  instance.menu.hidden=false;
  instance.wrapper.classList.add('is-open');
  instance.menu.classList.add('is-open');
  instance.trigger.setAttribute('aria-expanded','true');
  startTracking(instance);
  const options=enabledOptions(instance);
  const selected=options.findIndex(option=>option.dataset.value===instance.select.value);
  focusOption(instance,edge==='first'?0:edge==='last'?options.length-1:selected>=0?selected:0);
 }

 function enhance(select){
  if(instances.has(select)||!select.isConnected)return;
  const wrapper=document.createElement('div');
  wrapper.className='ui-select';
  wrapper.dataset.uiSelect='';
  const trigger=document.createElement('button');
  trigger.className='ui-select-trigger';
  trigger.type='button';
  trigger.setAttribute('role','combobox');
  trigger.setAttribute('aria-haspopup','listbox');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-autocomplete','none');
  const name=accessibleName(select);
  if(name.label)trigger.setAttribute('aria-label',name.label);
  if(name.labelledBy)trigger.setAttribute('aria-labelledby',name.labelledBy);
  const value=document.createElement('span');
  value.className='ui-select-value';
  const chevron=document.createElement('span');
  chevron.className='ui-select-chevron';
  chevron.setAttribute('aria-hidden','true');
  trigger.append(value,chevron);
  const menu=document.createElement('div');
  menu.className='ui-select-menu';
  menu.id=`ui-listbox-${++selectSequence}`;
  menu.setAttribute('role','listbox');
  menu.hidden=true;
  trigger.setAttribute('aria-controls',menu.id);
  const instance={select,wrapper,trigger,value,menu,open:false};
  instances.set(select,instance);
  select.classList.add('ui-native-select');
  select.tabIndex=-1;
  select.setAttribute('aria-hidden','true');
  select.parentNode.insertBefore(wrapper,select);
  wrapper.append(trigger,menu,select);
  document.body.append(menu);
  syncSelect(select);

  trigger.addEventListener('click',()=>open(instance));
  trigger.addEventListener('keydown',event=>{
   if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){
    event.preventDefault();
    if(!instance.open)open(instance,{edge:event.key==='ArrowUp'?'last':'selected'});
    else focusOption(instance,event.key==='ArrowUp'?enabledOptions(instance).length-1:0);
   }else if(event.key==='Escape'&&instance.open){event.preventDefault();close(instance)}
  });
  trigger.addEventListener('focus',()=>wrapper.classList.add('has-focus'));
  trigger.addEventListener('blur',()=>wrapper.classList.remove('has-focus'));
  menu.addEventListener('keydown',event=>{
   const options=enabledOptions(instance),current=options.indexOf(document.activeElement);
   if(event.key==='ArrowDown'){event.preventDefault();focusOption(instance,current+1)}
   else if(event.key==='ArrowUp'){event.preventDefault();focusOption(instance,current-1)}
   else if(event.key==='Home'){event.preventDefault();focusOption(instance,0)}
   else if(event.key==='End'){event.preventDefault();focusOption(instance,options.length-1)}
   else if(event.key==='Escape'){event.preventDefault();close(instance,{restoreFocus:true})}
   else if(event.key==='Tab')close(instance);
   else if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(instance,options[current])}
   else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    instance.typeahead=(instance.typeahead||'')+event.key.toLocaleLowerCase();
    clearTimeout(instance.typeaheadTimer);
    instance.typeaheadTimer=setTimeout(()=>{instance.typeahead=''},650);
    const start=(current+1)%Math.max(1,options.length);
    const match=[...options.slice(start),...options.slice(0,start)].find(option=>option.textContent.trim().toLocaleLowerCase().startsWith(instance.typeahead));
    if(match){match.focus({preventScroll:true});match.scrollIntoView({block:'nearest'})}
   }
  });
  select.addEventListener('change',()=>syncSelect(select));
  select.addEventListener('invalid',event=>{event.preventDefault();trigger.setAttribute('aria-invalid','true');trigger.focus();toast(select.validationMessage||'Vui lòng chọn một mục.','error')});
  select.form?.addEventListener('reset',()=>queueMicrotask(()=>{trigger.removeAttribute('aria-invalid');syncSelect(select)}));
  const label=select.labels?.[0];
  if(label&&label!==select.closest('label'))label.addEventListener('click',event=>{
   if(event.target!==trigger&&!wrapper.contains(event.target)){event.preventDefault();trigger.focus()}
  });
 }

 function enhanceTree(root=document){
  if(root instanceof HTMLSelectElement)enhance(root);
  root.querySelectorAll?.('select.sel').forEach(enhance);
 }

 function installDropdowns(){
  enhanceTree(document);
  document.addEventListener('pointerdown',event=>{
   document.querySelectorAll('.ui-select.is-open').forEach(wrapper=>{
    if(wrapper.contains(event.target))return;
    const select=wrapper.querySelector('select.ui-native-select');
    const instance=select&&instances.get(select);
    if(instance?.menu.contains(event.target))return;
    if(instance)close(instance);
   });
  });
  document.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   const active=document.querySelector('.ui-select.is-open select.ui-native-select');
   const instance=active&&instances.get(active);
   if(instance)close(instance,{restoreFocus:true});
  });
  const observer=new MutationObserver(records=>{
   for(const record of records){
    if(record.type==='childList'){
     if(record.target instanceof HTMLSelectElement)syncSelect(record.target);
     record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)enhanceTree(node)});
     record.removedNodes.forEach(node=>{
      if(node.nodeType!==Node.ELEMENT_NODE)return;
      const selects=[...(node.matches?.('select.ui-native-select')?[node]:[]),...(node.querySelectorAll?.('select.ui-native-select')||[])];
      selects.forEach(select=>{
       const instance=instances.get(select);
       if(instance&&!select.isConnected){close(instance);clearTimeout(instance.closeTimer);instance.menu.remove();instances.delete(select)}
      });
     });
    }
    if(record.type==='attributes'&&record.target instanceof HTMLSelectElement)syncSelect(record.target);
   }
   document.querySelectorAll('.ui-select').forEach(wrapper=>{
    const select=wrapper.querySelector('select.ui-native-select'),instance=select&&instances.get(select);
    if(instance&&!select.isConnected){close(instance);instance.menu.remove();instances.delete(select)}
   });
  });
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','required']});
 }

 function region(){
  if(toastRegion?.isConnected)return toastRegion;
  toastRegion=document.createElement('div');
  toastRegion.className='toast-region';
  toastRegion.setAttribute('aria-label','Thông báo');
  toastRegion.setAttribute('aria-live','polite');
  toastRegion.setAttribute('aria-relevant','additions removals');
  document.body.append(toastRegion);
  return toastRegion;
 }

 function dismiss(record){
  if(record.dismissed)return;
  record.dismissed=true;
  clearTimeout(record.timer);
  record.element.classList.remove('is-visible');
  record.element.classList.add('is-leaving');
  const finish=()=>{clearTimeout(record.cleanup);record.element.removeEventListener('transitionend',finish);record.element.remove()};
  record.element.addEventListener('transitionend',finish,{once:true});
  record.cleanup=setTimeout(finish,320);
 }

 function toast(message,type='info',duration){
  const tone=['success','error','info','warning'].includes(type)?type:'info';
  const timeout=Number.isFinite(duration)?Math.max(1200,duration):tone==='error'?5200:3600;
  const item=document.createElement('div');
  item.className=`toast t-${tone}`;
  item.dataset.toastId=String(++toastSequence);
  item.setAttribute('role',tone==='error'?'alert':'status');
  item.setAttribute('aria-live',tone==='error'?'assertive':'polite');
  const icon=document.createElement('span');
  icon.className='toast-icon';
  icon.setAttribute('aria-hidden','true');
  icon.textContent={success:'✓',error:'!',warning:'!',info:'i'}[tone];
  const copy=document.createElement('span');
  copy.className='toast-text';
  copy.textContent=String(message??'');
  const progress=document.createElement('span');
  progress.className='toast-progress';
  progress.setAttribute('aria-hidden','true');
  progress.style.setProperty('--toast-duration',`${timeout}ms`);
  const dismissButton=document.createElement('button');
  dismissButton.className='toast-dismiss';
  dismissButton.type='button';
  dismissButton.setAttribute('aria-label','Đóng thông báo');
  dismissButton.textContent='×';
  item.append(icon,copy,dismissButton,progress);
  const record={element:item,timer:null,cleanup:null,dismissed:false,remaining:timeout,started:0};
  const start=()=>{if(record.dismissed||record.timer)return;record.started=performance.now();progress.style.animationPlayState='running';record.timer=setTimeout(()=>dismiss(record),record.remaining)};
  const pause=()=>{if(record.dismissed||!record.timer)return;clearTimeout(record.timer);record.timer=null;record.remaining=Math.max(0,record.remaining-(performance.now()-record.started));progress.style.animationPlayState='paused'};
  item.addEventListener('pointerenter',pause);
  item.addEventListener('pointerleave',start);
  item.addEventListener('focusin',pause);
  item.addEventListener('focusout',event=>{if(!item.contains(event.relatedTarget))start()});
  dismissButton.addEventListener('click',()=>dismiss(record));
  const host=region();
  while(host.children.length>=4){
   const oldest=host.firstElementChild,existing=oldest?.__toastRecord;
   if(existing)dismiss(existing);else oldest?.remove();
   break;
  }
  item.__toastRecord=record;
  host.append(item);
  requestAnimationFrame(()=>item.classList.add('is-visible'));
  start();
  return ()=>dismiss(record);
 }

 window.BrainstormUI={toast,enhanceDropdowns:enhanceTree,refreshDropdown:syncSelect};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installDropdowns,{once:true});
 else installDropdowns();
})();
