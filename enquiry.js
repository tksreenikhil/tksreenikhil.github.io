(() => {
 const newId=()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);};
 const hostedOrigin='https://sree-nikhil-brand-studio.rocky1111.chatgpt.site';
 const isGithub=location.hostname==='tksreenikhil19-dotcom.github.io';
 const apiOrigin=isGithub?hostedOrigin:'';
 document.querySelectorAll('.owner-dashboard-link').forEach(a=>a.href=apiOrigin+'/admin');
 const form=document.querySelector('#enquiry-form'); if(!form)return;
 const feedback=document.querySelector('#enquiry-feedback');const button=form.querySelector('button[type="submit"]');let requestId=newId();
 form.addEventListener('submit',async(event)=>{
  event.preventDefault();if(!form.reportValidity())return;
  const values=new FormData(form);const payload=Object.fromEntries(values.entries());payload.id=requestId;payload.consent=values.get('consent')==='on';
  button.disabled=true;button.textContent='Sending…';feedback.textContent='Saving your request…';feedback.className='enquiry-feedback';
  try{const response=await fetch(apiOrigin+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(payload)});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to send. Please try again.');
   feedback.textContent='Thank you — your request has been saved. I’ll get back to you at the email address you provided. Reference: '+data.reference.slice(0,8).toUpperCase();feedback.classList.add('success');form.reset();requestId=newId();
  }catch(error){feedback.textContent=error instanceof TypeError?'Could not connect. Please retry or use the email link below.':error.message;feedback.classList.add('error');}
  finally{button.disabled=false;button.innerHTML='Send request <span>↗</span>';}
 });
})();
