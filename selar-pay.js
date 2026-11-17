// DAVELYX SELAR PAYMENT - AUTO SWITCH
const selarLinks = {
  "logbook": "https://selar.com/5933256r73",
  "technical": "https://selar.com/zbb90t91x4",
  "bundle": "https://selar.com/hb979as992"
};

document.addEventListener('DOMContentLoaded', function(){
  const payBtn = document.getElementById('selarPayBtn');
  const radios = document.querySelectorAll('input[name="package"]');
  if(!payBtn) return;
  
  function updateLink(){
    const sel = document.querySelector('input[name="package"]:checked');
    if(!sel) return;
    const v = sel.value.toLowerCase();
    if(v.includes("3,000") || v.includes("logbook only")) {
      payBtn.href = selarLinks.logbook;
      payBtn.textContent = "Pay ₦3,000 - Secure via Selar 🔥";
    } else if(v.includes("8,000") || v.includes("technical")) {
      payBtn.href = selarLinks.technical;
      payBtn.textContent = "Pay ₦8,000 - Secure via Selar 🔥";
    } else {
      payBtn.href = selarLinks.bundle;
      payBtn.textContent = "Pay ₦10,000 - BESTSELLER 🔥";
    }
  }
  
  // Default to bundle
  payBtn.href = selarLinks.bundle;
  payBtn.target = "_blank";
  radios.forEach(r => r.addEventListener('change', updateLink));
  updateLink();

  payBtn.addEventListener('click', function(){
    const name = document.querySelector('input[name="name"]')?.value || "";
    const dept = document.querySelector('input[name="dept"]')?.value || "";
    const pkg = document.querySelector('input[name="package"]:checked')?.value || "Bundle";
    const msg = `Hello DAVELYX! I just paid for ${pkg} via Selar. Name: ${name}, Dept: ${dept}. Please confirm my order.`;
    setTimeout(()=>{ window.open(`https://wa.me/2349035589937?text=${encodeURIComponent(msg)}`, '_blank'); }, 1500);
  });
});
