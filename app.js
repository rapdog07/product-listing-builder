const STORAGE_KEY = 'listingforge:listings';
const ACTIVE_KEY = 'listingforge:active';

const blankListing = () => ({
  id: crypto.randomUUID(), name: '', sku: '', brand: '', category: '', tags: '', description: '',
  price: '', currency: 'USD', inventory: '', image: '', variants: [], customFields: [], updatedAt: Date.now()
});

let listings = loadListings();
let activeId = localStorage.getItem(ACTIVE_KEY) || listings[0]?.id;
if (!listings.length) { listings = [blankListing()]; activeId = listings[0].id; persist(); }
if (!listings.some(x => x.id === activeId)) activeId = listings[0].id;

const $ = id => document.getElementById(id);
const form = $('productForm');

function loadListings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  localStorage.setItem(ACTIVE_KEY, activeId);
}
function active() { return listings.find(x => x.id === activeId); }
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function money(value, currency='USD') {
  const n = Number(value || 0);
  try { return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}
function toast(message) { const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),1800); }

function renderList() {
  $('listingList').innerHTML = listings.map(item => `<button class="listing-item ${item.id===activeId?'active':''}" data-id="${item.id}"><strong>${escapeHtml(item.name || 'Untitled product')}</strong><span>${escapeHtml(item.sku || 'No SKU')} · ${escapeHtml(item.category || 'Uncategorized')}</span></button>`).join('');
  document.querySelectorAll('.listing-item').forEach(btn => btn.addEventListener('click', () => { activeId=btn.dataset.id; persist(); render(); }));
}

function loadForm() {
  const p=active();
  ['name','sku','brand','category','tags','description','price','currency','inventory','image'].forEach(key => $(key).value=p[key] ?? '');
  $('pageTitle').textContent=p.name || 'Untitled product';
  renderVariants(); renderCustomFields(); updatePreview();
}
function syncForm() {
  const p=active();
  ['name','sku','brand','category','tags','description','price','currency','inventory','image'].forEach(key => p[key]=$(key).value);
  p.updatedAt=Date.now();
  $('pageTitle').textContent=p.name || 'Untitled product';
  updatePreview(); renderList(); persist();
}
function renderVariants() {
  const p=active(); const root=$('variants');
  root.innerHTML = p.variants.length ? p.variants.map((v,i)=>`<div class="variant-row"><input data-variant="name" data-index="${i}" value="${escapeHtml(v.name)}" placeholder="Option name (e.g. Color)"/><input data-variant="value" data-index="${i}" value="${escapeHtml(v.value)}" placeholder="Value (e.g. Black)"/><button type="button" class="remove-row" data-remove-variant="${i}">×</button></div>`).join('') : '<div class="empty-row">No variants yet.</div>';
  root.querySelectorAll('[data-variant]').forEach(input=>input.addEventListener('input',e=>{p.variants[+e.target.dataset.index][e.target.dataset.variant]=e.target.value; p.updatedAt=Date.now(); updatePreview(); persist();}));
  root.querySelectorAll('[data-remove-variant]').forEach(btn=>btn.addEventListener('click',()=>{p.variants.splice(+btn.dataset.removeVariant,1); renderVariants(); updatePreview(); persist();}));
}
function renderCustomFields() {
  const p=active(); const root=$('customFields');
  root.innerHTML = p.customFields.length ? p.customFields.map((v,i)=>`<div class="custom-row"><input data-custom="key" data-index="${i}" value="${escapeHtml(v.key)}" placeholder="Field name"/><input data-custom="value" data-index="${i}" value="${escapeHtml(v.value)}" placeholder="Value"/><button type="button" class="remove-row" data-remove-custom="${i}">×</button></div>`).join('') : '<div class="empty-row">No custom fields yet.</div>';
  root.querySelectorAll('[data-custom]').forEach(input=>input.addEventListener('input',e=>{p.customFields[+e.target.dataset.index][e.target.dataset.custom]=e.target.value; p.updatedAt=Date.now(); persist();}));
  root.querySelectorAll('[data-remove-custom]').forEach(btn=>btn.addEventListener('click',()=>{p.customFields.splice(+btn.dataset.removeCustom,1); renderCustomFields(); persist();}));
}
function updatePreview() {
  const p=active();
  $('previewCategory').textContent=p.category || 'Category'; $('previewName').textContent=p.name || 'Untitled product'; $('previewDescription').textContent=p.description || 'Your product description will appear here.'; $('previewPrice').textContent=money(p.price,p.currency); $('previewInventory').textContent=`${p.inventory || 0} in stock`;
  const image=$('previewImage'); image.innerHTML=p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name || 'Product')}" onerror="this.parentElement.innerHTML='<span>Image unavailable</span>'"/>` : '<span>No image</span>';
  $('previewTags').innerHTML=(p.tags||'').split(',').map(x=>x.trim()).filter(Boolean).map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join('');
  $('previewVariants').innerHTML=p.variants.filter(v=>v.name||v.value).map(v=>`<span class="variant-pill">${escapeHtml(v.name)}: ${escapeHtml(v.value)}</span>`).join('');
}
function render(){ renderList(); loadForm(); }

form.addEventListener('input', syncForm); form.addEventListener('change', syncForm);
$('addVariant').addEventListener('click',()=>{active().variants.push({name:'',value:''}); renderVariants(); persist();});
$('addCustomField').addEventListener('click',()=>{active().customFields.push({key:'',value:''}); renderCustomFields(); persist();});
function createNew(){ const p=blankListing(); listings.unshift(p); activeId=p.id; persist(); render(); toast('New listing created'); $( 'name').focus(); }
$('newButton').addEventListener('click',createNew); $('sidebarNew').addEventListener('click',createNew);
$('saveButton').addEventListener('click',()=>{syncForm();toast('Listing saved');});
$('duplicateButton').addEventListener('click',()=>{syncForm(); const copy=JSON.parse(JSON.stringify(active())); copy.id=crypto.randomUUID(); copy.name=copy.name ? `${copy.name} Copy` : 'Untitled product Copy'; copy.updatedAt=Date.now(); listings.unshift(copy); activeId=copy.id; persist(); render(); toast('Listing duplicated');});
$('deleteButton').addEventListener('click',()=>{if(listings.length===1){toast('Keep at least one listing');return;} listings=listings.filter(x=>x.id!==activeId); activeId=listings[0].id; persist(); render(); toast('Listing deleted');});
$('printButton').addEventListener('click',()=>window.print());

function download(filename, content, type='text/plain;charset=utf-8') { const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }
function csvEscape(v){ const s=String(v??''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
function toCsv(p){ const fields={name:p.name,sku:p.sku,brand:p.brand,category:p.category,tags:p.tags,description:p.description,price:p.price,currency:p.currency,inventory:p.inventory,image:p.image,variants:p.variants.map(v=>`${v.name}:${v.value}`).join(' | '),custom_fields:p.customFields.map(v=>`${v.key}:${v.value}`).join(' | ')}; return Object.keys(fields).join(',')+'\n'+Object.values(fields).map(csvEscape).join(',')+'\n'; }
function toXml(p){ const esc=v=>escapeHtml(v); return `<?xml version="1.0" encoding="UTF-8"?>\n<product>\n${[['name',p.name],['sku',p.sku],['brand',p.brand],['category',p.category],['tags',p.tags],['description',p.description],['price',p.price],['currency',p.currency],['inventory',p.inventory],['image',p.image]].map(([k,v])=>`  <${k}>${esc(v)}</${k}>`).join('\n')}\n  <variants>${p.variants.map(v=>`<variant><name>${esc(v.name)}</name><value>${esc(v.value)}</value></variant>`).join('')}</variants>\n</product>`; }
function toYaml(p){ const q=v=>JSON.stringify(String(v??'')); return `name: ${q(p.name)}\nsku: ${q(p.sku)}\nbrand: ${q(p.brand)}\ncategory: ${q(p.category)}\ntags: ${q(p.tags)}\ndescription: ${q(p.description)}\nprice: ${p.price||0}\ncurrency: ${q(p.currency)}\ninventory: ${p.inventory||0}\nimage: ${q(p.image)}\nvariants:\n${p.variants.map(v=>`  - name: ${q(v.name)}\n    value: ${q(v.value)}`).join('\n')}`; }
function toMarkdown(p){ return `# ${p.name || 'Untitled product'}\n\n${p.description || ''}\n\n**Price:** ${money(p.price,p.currency)}  \n**SKU:** ${p.sku || '—'}  \n**Brand:** ${p.brand || '—'}  \n**Category:** ${p.category || '—'}  \n**Inventory:** ${p.inventory || 0}\n\n## Tags\n${p.tags || 'None'}\n\n## Variants\n${p.variants.map(v=>`- ${v.name}: ${v.value}`).join('\n') || 'None'}\n`; }
function toHtml(p){ return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(p.name)}</title><style>body{font:16px system-ui;max-width:700px;margin:40px auto;padding:0 20px;color:#16181d}img{max-width:100%;border-radius:12px}.price{font-size:24px;font-weight:700}</style></head><body>${p.image?`<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">`:''}<h1>${escapeHtml(p.name)}</h1><p>${escapeHtml(p.description)}</p><p class="price">${escapeHtml(money(p.price,p.currency))}</p><p>SKU: ${escapeHtml(p.sku)}</p><p>${escapeHtml(p.tags)}</p></body></html>`; }
function exportListing(format){ const p=active(); const base=(p.name||'product').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'product'; let content,type,ext; if(format==='json'){content=JSON.stringify(p,null,2);type='application/json';ext='json';} else if(format==='csv'){content=toCsv(p);type='text/csv';ext='csv';} else if(format==='xml'){content=toXml(p);type='application/xml';ext='xml';} else if(format==='yaml'){content=toYaml(p);type='text/yaml';ext='yaml';} else if(format==='markdown'){content=toMarkdown(p);type='text/markdown';ext='md';} else {content=toHtml(p);type='text/html';ext='html';} download(`${base}.${ext}`,content,type); toast(`Exported ${ext.toUpperCase()}`); }
document.querySelectorAll('[data-format]').forEach(btn=>btn.addEventListener('click',()=>exportListing(btn.dataset.format)));

$('importButton').addEventListener('click',()=>$('importInput').click());
$('importInput').addEventListener('change',async e=>{const file=e.target.files[0]; if(!file)return; try { const text=await file.text(); let imported; if(file.name.endsWith('.json')) imported=JSON.parse(text); else if(file.name.endsWith('.csv')) { const [head,line]=text.trim().split(/\r?\n/); const vals=line.match(/("(?:[^"]|"")*"|[^,]*)/g).filter((_,i)=>i<head.split(',').length).map(v=>v.replace(/^"|"$/g,'').replace(/""/g,'"')); imported=Object.fromEntries(head.split(',').map((h,i)=>[h,vals[i]||''])); } else throw new Error('Use JSON or CSV.'); imported={...blankListing(),...imported,id:crypto.randomUUID(),variants:imported.variants||[],customFields:imported.customFields||[]}; listings.unshift(imported); activeId=imported.id; persist(); render(); toast('Listing imported'); } catch(err){toast(`Import failed: ${err.message}`);} e.target.value='';});

render();
