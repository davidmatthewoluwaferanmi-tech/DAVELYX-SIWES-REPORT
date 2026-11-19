(function () {
  const links = { logbook: 'https://selar.com/placeholder', report: 'https://selar.com/placeholder', bundle: 'https://selar.com/placeholder' };
  fetch('/api/selar-links').then(r => r.ok ? r.json() : Promise.reject()).then(data => Object.assign(links, data)).catch(() => {});
  document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('selarPayBtn');
    if (!button) return;
    const radios = [...document.querySelectorAll('input[name="package"]')];
    const keyFor = value => { const v=String(value||'').toLowerCase(); return v.includes('logbook')||v.includes('3,000')?'logbook':v.includes('report')||v.includes('5,000')||v.includes('technical')?'report':'bundle'; };
    const update = () => { const selected=document.querySelector('input[name="package"]:checked'); if(!selected)return; const key=keyFor(selected.value); button.href=links[key]; button.textContent=key==='logbook'?'Pay ₦3,000 - Secure via Selar 🔥':key==='report'?'Pay ₦5,000 - Secure via Selar 🔥':'Pay ₦8,000 - BESTSELLER 🔥'; };
    radios.forEach(r=>r.addEventListener('change',update)); update();
    button.addEventListener('click', () => { const name=document.querySelector('input[name="name"]')?.value||''; const dept=document.querySelector('input[name="dept"]')?.value||''; const pkg=document.querySelector('input[name="package"]:checked')?.value||'Bundle'; const msg=`Hello DAVELYX! I selected ${pkg}. Name: ${name}, Dept: ${dept}. Please confirm my order.`; setTimeout(()=>window.open(`https://wa.me/2349035589937?text=${encodeURIComponent(msg)}`,'_blank'),1500); });
  });
})();
