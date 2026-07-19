/* ===== Wedding Planner v2 ===== */
const PLANNER_KEY = 'weddingPlanner';
let plannerData = {};
let calMonth, calYear, calView = 'month';
let noteSearchQuery = '';
let guestSearchQuery = '', guestFilter = 'all', guestSort = 'name';
let autoSaveTimer = null;

const DEFAULT_CHECKLIST = [
  { cat: 'Before the Wedding', items: [
    {text:'Choose wedding date',done:false},{text:'Book venue',done:false},{text:'Hire photographer',done:false},
    {text:'Hire videographer',done:false},{text:'Book caterer',done:false},{text:'Choose wedding dress',done:false},
    {text:"Choose groom's suit",done:false},{text:'Book DJ/Band',done:false},{text:'Book decorator',done:false},
    {text:'Send invitations',done:false},{text:'Hire wedding planner',done:false},{text:'Plan honeymoon',done:false},
    {text:'Order wedding cake',done:false},{text:'Book florist',done:false},{text:'Arrange transportation',done:false}
  ]},
  { cat: 'Wedding Week', items: [
    {text:'Confirm vendors',done:false},{text:'Pick up attire',done:false},{text:'Final venue inspection',done:false},
    {text:'Confirm guest count',done:false},{text:'Pack emergency kit',done:false}
  ]},
  { cat: 'Wedding Day', items: [
    {text:'Hair & Makeup',done:false},{text:'Ceremony',done:false},{text:'Reception',done:false},
    {text:'First Dance',done:false},{text:'Cake Cutting',done:false},{text:'Farewell',done:false}
  ]}
];

const DEFAULT_BUDGET = [
  {name:'Venue',budget:0,spent:0,notes:''},{name:'Catering',budget:0,spent:0,notes:''},
  {name:'Photography',budget:0,spent:0,notes:''},{name:'Decoration',budget:0,spent:0,notes:''},
  {name:'Music',budget:0,spent:0,notes:''},{name:'Transportation',budget:0,spent:0,notes:''},
  {name:'Clothing',budget:0,spent:0,notes:''},{name:'Rings',budget:0,spent:0,notes:''},
  {name:'Flowers',budget:0,spent:0,notes:''},{name:'Gifts',budget:0,spent:0,notes:''},
  {name:'Miscellaneous',budget:0,spent:0,notes:''}
];

function defaultData(){return{checklist:[],budget:{total:0,categories:[]},vendors:[],guests:[],tables:[],events:[],notes:[]};}

function loadPlanner(){
  try{plannerData=JSON.parse(localStorage.getItem(PLANNER_KEY))||defaultData();}catch{plannerData=defaultData();}
  if(!plannerData.checklist.length)plannerData.checklist=JSON.parse(JSON.stringify(DEFAULT_CHECKLIST));
  if(!plannerData.budget.categories.length)plannerData.budget={total:0,categories:JSON.parse(JSON.stringify(DEFAULT_BUDGET))};
  if(!plannerData.guests)plannerData.guests=[];
  if(!plannerData.notes)plannerData.notes=[];
  savePlanner();
}
function savePlanner(){localStorage.setItem(PLANNER_KEY,JSON.stringify(plannerData));updateStats();}

/* ===== HELPERS ===== */
function $(id){return document.getElementById(id);}
function setTxt(id,v){var e=$(id);if(e)e.textContent=v;}
function setHtml(id,v){var e=$(id);if(e)e.innerHTML=v;}
function fmt$(v){return '$'+Number(v||0).toLocaleString();}

/* ===== STATS ===== */
function updateStats(){
  const totalTasks=plannerData.checklist.reduce((s,c)=>s+c.items.length,0);
  const doneTasks=plannerData.checklist.reduce((s,c)=>s+c.items.filter(i=>i.done).length,0);
  const remaining=totalTasks-doneTasks;
  const pct=totalTasks?Math.round((doneTasks/totalTasks)*100):0;
  setTxt('planProgressPct',pct+'%');
  setTxt('planProgressLabel',doneTasks+' / '+totalTasks+' tasks complete');
  const fill=$('planProgressFill');if(fill)fill.style.width=pct+'%';

  const b=plannerData.budget;
  const spent=b.categories.reduce((s,c)=>s+(c.spent||0),0);
  const remaining2=b.total-spent;

  const wd=JSON.parse(localStorage.getItem('weddingData')||'{}');
  let daysLeft=0;
  if(wd.weddingDate){const d=new Date(wd.weddingDate);const now=new Date();daysLeft=Math.max(0,Math.ceil((d-now)/(1000*60*60*24)));}

  const guests=plannerData.guests||[];
  const rsvpYes=guests.filter(g=>g.rsvp==='confirmed').length;
  const invited=guests.length;

  setTxt('statDaysLeft',daysLeft);
  setTxt('statTasksDone',doneTasks);
  setTxt('statTasksRemaining',remaining);
  setTxt('statProgress',pct+'%');
  setTxt('statBudget',fmt$(b.total));
  setTxt('statSpent',fmt$(spent));
  setTxt('statRemaining',fmt$(remaining2));
  setTxt('statGuestsInvited',invited);
  setTxt('statRsvpConfirmed',rsvpYes);
  setTxt('statVendors',plannerData.vendors.length);
  setTxt('statTables',plannerData.tables.length);
}

/* ===== TABS ===== */
function switchTab(tab){
  document.querySelectorAll('.plan-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  document.querySelectorAll('.plan-section').forEach(s=>s.classList.toggle('active',s.id==='sec-'+tab));
}

/* ===== CHECKLIST ===== */
function renderChecklist(){
  const el=$('checklistContainer');if(!el)return;
  el.innerHTML=plannerData.checklist.map((cat,ci)=>{
    const done=cat.items.filter(i=>i.done).length;
    const total=cat.items.length;
    const pctCat=total?Math.round((done/total)*100):0;
    return`<div class="plan-checklist-cat">
      <h4><i class="fas fa-folder"></i> ${cat.cat} <span style="font-size:0.75rem;color:var(--text-light);font-weight:400;margin-left:auto">${done}/${total} (${pctCat}%)</span></h4>
      <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:10px"><div style="height:100%;width:${pctCat}%;background:var(--gold);border-radius:2px;transition:width .5s"></div></div>
      ${cat.items.map((item,ii)=>`<div class="plan-check-item${item.done?' done':''}" onclick="toggleCheck(${ci},${ii})">
        <div class="plan-check-box"><i class="fas fa-check"></i></div>
        <span class="plan-check-text">${item.text}</span>
        <div class="plan-check-actions">
          <button onclick="event.stopPropagation();renameCheck(${ci},${ii})" title="Rename"><i class="fas fa-pen"></i></button>
          <button class="del" onclick="event.stopPropagation();deleteCheck(${ci},${ii})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('')}
      <div class="plan-add-row">
        <input type="text" id="addCheck_${ci}" placeholder="Add task..." onkeydown="if(event.key==='Enter')addCheck(${ci})">
        <button onclick="addCheck(${ci})"><i class="fas fa-plus"></i></button>
      </div>
      <div style="text-align:right;margin-top:6px"><button onclick="deleteCheckCategory(${ci})" style="background:none;border:none;color:var(--text-light);font-size:0.75rem;cursor:pointer"><i class="fas fa-trash"></i> Remove Category</button></div>
    </div>`;
  }).join('');
}
function toggleCheck(ci,ii){plannerData.checklist[ci].items[ii].done=!plannerData.checklist[ci].items[ii].done;savePlanner();renderChecklist();}
function addCheck(ci){const inp=$('addCheck_'+ci);if(!inp||!inp.value.trim())return;plannerData.checklist[ci].items.push({text:inp.value.trim(),done:false});inp.value='';savePlanner();renderChecklist();}
function deleteCheck(ci,ii){plannerData.checklist[ci].items.splice(ii,1);savePlanner();renderChecklist();}
function renameCheck(ci,ii){const nv=prompt('Rename task:',plannerData.checklist[ci].items[ii].text);if(nv&&nv.trim()){plannerData.checklist[ci].items[ii].text=nv.trim();savePlanner();renderChecklist();}}
function addCheckCategory(){const nv=prompt('New category name:');if(nv&&nv.trim()){plannerData.checklist.push({cat:nv.trim(),items:[]});savePlanner();renderChecklist();}}
function deleteCheckCategory(ci){if(!confirm('Delete this category and all its tasks?'))return;plannerData.checklist.splice(ci,1);savePlanner();renderChecklist();}

/* ===== BUDGET ===== */
function renderBudget(){
  const b=plannerData.budget;
  const spent=b.categories.reduce((s,c)=>s+(c.spent||0),0);
  const remaining=b.total-spent;
  const pct=b.total?Math.round((spent/b.total)*100):0;
  setHtml('budgetSummary',`
    <div class="plan-budget-card"><div class="label">Total Budget</div><div class="amount">${fmt$(b.total)}</div></div>
    <div class="plan-budget-card"><div class="label">Total Spent</div><div class="amount" style="color:var(--error)">${fmt$(spent)}</div></div>
    <div class="plan-budget-card"><div class="label">Remaining</div><div class="amount" style="color:${remaining<0?'var(--error)':'var(--success)'}">${fmt$(remaining)}</div></div>
    <div class="plan-budget-card"><div class="label">Used</div><div class="amount">${pct}%</div></div>
  `);
  setHtml('budgetRows',`
    <div style="padding:8px 14px;font-size:0.75rem;color:var(--text-light);text-transform:uppercase;letter-spacing:1px;display:grid;grid-template-columns:140px 1fr 1fr 1fr 40px;gap:12px">
      <span>Category</span><span style="text-align:right">Budget</span><span style="text-align:right">Spent</span><span style="text-align:right">Remaining</span><span></span>
    </div>
    ${b.categories.map((c,i)=>{
      const rem=c.budget-c.spent;
      const barPct=c.budget?Math.min((c.spent/c.budget)*100,100):0;
      const barColor=rem<0?'var(--error)':'var(--gold)';
      return`<div class="plan-budget-row">
        <div class="cat"><i class="fas fa-tag" style="color:var(--gold);font-size:0.75rem"></i> ${c.name}</div>
        <input type="number" value="${c.budget||0}" onchange="updateBudgetCat(${i},'budget',this.value)" placeholder="$0">
        <input type="number" value="${c.spent||0}" onchange="updateBudgetCat(${i},'spent',this.value)" placeholder="$0">
        <div class="remaining" style="color:${rem<0?'var(--error)':'var(--success)'}">${fmt$(rem)}</div>
        <button onclick="deleteBudgetCat(${i})" style="background:none;border:none;color:var(--text-light);cursor:pointer;padding:6px" title="Remove"><i class="fas fa-trash" style="font-size:0.75rem"></i></button>
      </div>
      <div style="padding:0 14px 4px"><div class="plan-budget-bar"><div class="plan-budget-bar-fill" style="width:${barPct}%;background:${barColor}"></div></div></div>
      <div style="padding:0 14px 12px"><input type="text" value="${c.notes||''}" onchange="updateBudgetCat(${i},'notes',this.value)" placeholder="Notes..." style="width:100%;padding:6px 10px;border:1px solid rgba(212,175,55,0.08);border-radius:6px;background:rgba(255,255,255,0.03);color:var(--text-light);font-size:0.8rem;font-style:italic"></div>`;
    }).join('')}
  `);
}
function updateBudgetTotal(v){plannerData.budget.total=parseFloat(v)||0;savePlanner();renderBudget();}
function updateBudgetCat(i,key,val){plannerData.budget.categories[i][key]=key==='notes'?val:(parseFloat(val)||0);savePlanner();renderBudget();}
function addBudgetCategory(){const nv=prompt('New budget category:');if(nv&&nv.trim()){plannerData.budget.categories.push({name:nv.trim(),budget:0,spent:0,notes:''});savePlanner();renderBudget();}}
function deleteBudgetCat(i){plannerData.budget.categories.splice(i,1);savePlanner();renderBudget();}

/* ===== VENDORS ===== */
function renderVendors(){
  const el=$('vendorGrid');if(!el)return;
  if(!plannerData.vendors.length){el.innerHTML='<div class="plan-table-empty"><i class="fas fa-store" style="font-size:2rem;display:block;margin-bottom:8px;color:var(--gold);opacity:0.3"></i>No vendors added yet</div>';return;}
  el.innerHTML=plannerData.vendors.map((v,i)=>`
    <div class="plan-vendor-card">
      <div class="plan-vendor-type"><i class="fas fa-briefcase"></i> ${v.type}</div>
      <div class="plan-vendor-name">${v.name}</div>
      ${v.contact?'<div class="plan-vendor-detail"><i class="fas fa-user"></i> '+v.contact+'</div>':''}
      ${v.phone?'<div class="plan-vendor-detail"><i class="fas fa-phone"></i> '+v.phone+'</div>':''}
      ${v.email?'<div class="plan-vendor-detail"><i class="fas fa-envelope"></i> '+v.email+'</div>':''}
      ${v.website?'<div class="plan-vendor-detail"><i class="fas fa-globe"></i> '+v.website+'</div>':''}
      ${v.address?'<div class="plan-vendor-detail"><i class="fas fa-map-marker-alt"></i> '+v.address+'</div>':''}
      ${v.cost?'<div class="plan-vendor-detail"><i class="fas fa-dollar-sign"></i> '+fmt$(v.cost)+'</div>':''}
      <div class="plan-vendor-status ${v.status}"><i class="fas fa-${v.status==='booked'?'check-circle':v.status==='pending'?'clock':'times-circle'}"></i> ${v.status}</div>
      ${v.notes?'<div style="font-size:0.8rem;color:var(--text-light);margin-top:8px;font-style:italic">'+v.notes+'</div>':''}
      <div class="plan-vendor-actions">
        <button class="plan-btn" onclick="editVendor(${i})" style="font-size:0.75rem;padding:6px 12px"><i class="fas fa-pen"></i> Edit</button>
        <button class="plan-btn" onclick="deleteVendor(${i})" style="font-size:0.75rem;padding:6px 12px;background:rgba(239,68,68,0.15);color:var(--error)"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}
function openVendorModal(idx){
  const v=idx!==undefined?plannerData.vendors[idx]:null;
  $('vendorModalTitle').textContent=v?'Edit Vendor':'Add Vendor';
  $('vendorName').value=v?v.name:'';
  $('vendorType').value=v?v.type:'Photographer';
  $('vendorContact').value=v?v.contact:'';
  $('vendorPhone').value=v?v.phone:'';
  $('vendorEmail').value=v?v.email:'';
  $('vendorWebsite').value=v?v.website:'';
  $('vendorAddress').value=v?v.address:'';
  $('vendorCost').value=v?v.cost:'';
  $('vendorStatus').value=v?v.status:'pending';
  $('vendorNotes').value=v?v.notes:'';
  $('vendorModal').dataset.editIdx=idx!==undefined?idx:'';
  $('vendorModal').classList.add('open');
}
function saveVendor(){
  const d=$('vendorModal');
  const obj={
    name:$('vendorName').value.trim(),type:$('vendorType').value,
    contact:$('vendorContact').value.trim(),phone:$('vendorPhone').value.trim(),
    email:$('vendorEmail').value.trim(),website:$('vendorWebsite').value.trim(),
    address:$('vendorAddress').value.trim(),cost:parseFloat($('vendorCost').value)||0,
    status:$('vendorStatus').value,notes:$('vendorNotes').value.trim()
  };
  if(!obj.name)return alert('Vendor name is required');
  const idx=d.dataset.editIdx;
  if(idx!=='')plannerData.vendors[idx]=obj;else plannerData.vendors.push(obj);
  savePlanner();renderVendors();closeVendorModal();
}
function editVendor(i){openVendorModal(i);}
function deleteVendor(i){if(confirm('Remove this vendor?')){plannerData.vendors.splice(i,1);savePlanner();renderVendors();}}
function closeVendorModal(){$('vendorModal').classList.remove('open');}

/* ===== GUESTS ===== */
function renderGuests(){
  const el=$('guestGrid');if(!el)return;
  let guests=plannerData.guests||[];
  if(guestSearchQuery){const q=guestSearchQuery.toLowerCase();guests=guests.filter(g=>(g.name||'').toLowerCase().includes(q)||(g.family||'').toLowerCase().includes(q));}
  if(guestFilter!=='all')guests=guests.filter(g=>g.rsvp===guestFilter);
  if(guestSort==='name')guests.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  else if(guestSort==='family')guests.sort((a,b)=>(a.family||'').localeCompare(b.family||''));
  else if(guestSort==='rsvp')guests.sort((a,b)=>(a.rsvp||'').localeCompare(b.rsvp||''));

  const allGuests=plannerData.guests||[];
  const confirmed=allGuests.filter(g=>g.rsvp==='confirmed').length;
  const pending=allGuests.filter(g=>g.rsvp==='pending').length;
  const declined=allGuests.filter(g=>g.rsvp==='declined').length;

  setHtml('guestStatsBar',`
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
      <div style="font-size:0.85rem;color:var(--text-light)">Total: <strong style="color:var(--gold)">${allGuests.length}</strong></div>
      <div style="font-size:0.85rem;color:var(--text-light)">Confirmed: <strong style="color:var(--success)">${confirmed}</strong></div>
      <div style="font-size:0.85rem;color:var(--text-light)">Pending: <strong style="color:var(--warning)">${pending}</strong></div>
      <div style="font-size:0.85rem;color:var(--text-light)">Declined: <strong style="color:var(--error)">${declined}</strong></div>
    </div>
  `);

  if(!guests.length){el.innerHTML='<div class="plan-table-empty"><i class="fas fa-users" style="font-size:2rem;display:block;margin-bottom:8px;color:var(--gold);opacity:0.3"></i>No guests found</div>';return;}
  el.innerHTML=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.85rem">
    <thead><tr style="border-bottom:1px solid rgba(212,175,55,0.1)">
      <th style="text-align:left;padding:10px;color:var(--gold);font-weight:500">Name</th>
      <th style="text-align:left;padding:10px;color:var(--gold);font-weight:500">Side</th>
      <th style="text-align:left;padding:10px;color:var(--gold);font-weight:500">Table</th>
      <th style="text-align:left;padding:10px;color:var(--gold);font-weight:500">RSVP</th>
      <th style="text-align:left;padding:10px;color:var(--gold);font-weight:500">Meal</th>
      <th style="text-align:right;padding:10px;color:var(--gold);font-weight:500">Actions</th>
    </tr></thead>
    <tbody>${guests.map((g,i)=>{
      const realIdx=(plannerData.guests||[]).indexOf(g);
      const rsvpClass=g.rsvp==='confirmed'?'booked':g.rsvp==='declined'?'cancelled':'pending';
      return`<tr style="border-bottom:1px solid rgba(212,175,55,0.05)">
        <td style="padding:10px;color:var(--text)">${g.name}</td>
        <td style="padding:10px;color:var(--text-light)">${g.family||'-'}</td>
        <td style="padding:10px;color:var(--text-light)">${g.table||'-'}</td>
        <td style="padding:10px"><span class="plan-vendor-status ${rsvpClass}" style="font-size:0.72rem">${g.rsvp||'pending'}</span></td>
        <td style="padding:10px;color:var(--text-light)">${g.meal||'-'}</td>
        <td style="padding:10px;text-align:right">
          <button onclick="editGuest(${realIdx})" style="background:none;border:none;color:var(--gold);cursor:pointer;padding:4px 8px"><i class="fas fa-pen" style="font-size:0.75rem"></i></button>
          <button onclick="deleteGuest(${realIdx})" style="background:none;border:none;color:var(--error);cursor:pointer;padding:4px 8px"><i class="fas fa-trash" style="font-size:0.75rem"></i></button>
        </td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
}
function openGuestModal(idx){
  const g=idx!==undefined?plannerData.guests[idx]:null;
  $('guestModalTitle').textContent=g?'Edit Guest':'Add Guest';
  $('guestName').value=g?g.name:'';
  $('guestFamily').value=g?g.family:'Bride Side';
  $('guestTable').value=g?g.table:'';
  $('guestRsvp').value=g?g.rsvp:'pending';
  $('guestMeal').value=g?g.meal:'Standard';
  $('guestModal').dataset.editIdx=idx!==undefined?idx:'';
  $('guestModal').classList.add('open');
}
function saveGuest(){
  const obj={
    name:$('guestName').value.trim(),family:$('guestFamily').value,
    table:$('guestTable').value.trim(),rsvp:$('guestRsvp').value,
    meal:$('guestMeal').value
  };
  if(!obj.name)return alert('Guest name is required');
  const d=$('guestModal');
  const idx=d.dataset.editIdx;
  if(idx!=='')plannerData.guests[idx]=obj;else plannerData.guests.push(obj);
  savePlanner();renderGuests();$('guestModal').classList.remove('open');
}
function editGuest(i){openGuestModal(i);}
function deleteGuest(i){if(confirm('Remove this guest?')){plannerData.guests.splice(i,1);savePlanner();renderGuests();}}
function filterGuests(f){guestFilter=f;document.querySelectorAll('.guest-filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===f));renderGuests();}
function sortGuests(s){guestSort=s;renderGuests();}
function searchGuests(v){guestSearchQuery=v;renderGuests();}
function exportGuests(format){
  const guests=plannerData.guests||[];
  if(!guests.length)return alert('No guests to export');
  let content,filename;
  if(format==='csv'){
    content='Name,Side,Table,RSVP,Meal\n'+guests.map(g=>`"${g.name}","${g.family||''}","${g.table||''}","${g.rsvp||''}","${g.meal||''}"`).join('\n');
    filename='guests.csv';
  }else if(format==='json'){
    content=JSON.stringify(guests,null,2);filename='guests.json';
  }
  const blob=new Blob([content],{type:format==='csv'?'text/csv':'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}

/* ===== SEATING ===== */
function renderSeating(){
  const el=$('seatingContainer');if(!el)return;
  const guests=plannerData.guests||[];
  const unassigned=guests.filter(g=>!plannerData.tables.some(t=>t.guests&&t.guests.includes(g.name)));
  let html=plannerData.tables.map((t,ti)=>{
    const cap=t.capacity||10;
    const count=(t.guests||[]).length;
    const pct=Math.round((count/cap)*100);
    return`<div class="plan-table">
      <div class="plan-table-header">
        <div class="plan-table-name">${t.name}</div>
        <div class="plan-table-count">${count} / ${cap} (${pct}%)</div>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:10px"><div style="height:100%;width:${pct}%;background:${pct>=100?'var(--error)':'var(--gold)'};border-radius:2px;transition:width .5s"></div></div>
      <div class="plan-table-guests">
        ${(t.guests||[]).length?(t.guests||[]).map((g,gi)=>`<span class="plan-table-guest">${g} <button class="remove" onclick="removeSeat(${ti},${gi})"><i class="fas fa-times"></i></button></span>`).join(''):'<div class="plan-table-empty">No guests assigned</div>'}
      </div>
      <div class="plan-add-row">
        <select id="seatAdd_${ti}" style="flex:1;padding:8px;border:1px solid rgba(212,175,55,0.1);border-radius:6px;background:rgba(255,255,255,0.04);color:var(--text);font-size:0.85rem">
          <option value="">Select guest...</option>
          ${guests.filter(g=>!(t.guests||[]).includes(g.name)).map(g=>'<option value="'+g.name+'">'+g.name+'</option>').join('')}
        </select>
        <button onclick="addSeat(${ti})" style="padding:8px 14px"><i class="fas fa-plus"></i></button>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <button onclick="editTableCapacity(${ti})" style="background:none;border:none;color:var(--text-light);font-size:0.75rem;cursor:pointer"><i class="fas fa-cog"></i> Capacity</button>
        <button onclick="deleteTable(${ti})" style="background:none;border:none;color:var(--text-light);font-size:0.75rem;cursor:pointer"><i class="fas fa-trash"></i> Remove</button>
      </div>
    </div>`;
  }).join('');
  if(unassigned.length){
    html+=`<div class="plan-table" style="border-color:rgba(245,158,11,0.15)">
      <div class="plan-table-header"><div class="plan-table-name" style="color:var(--warning)"><i class="fas fa-exclamation-triangle"></i> Unassigned (${unassigned.length})</div></div>
      <div class="plan-table-guests">${unassigned.map(g=>`<span class="plan-table-guest" style="background:rgba(245,158,11,0.08)">${g.name}</span>`).join('')}</div>
    </div>`;
  }
  html+=`<div class="plan-table" style="border-style:dashed;cursor:pointer;align-items:center;justify-content:center;display:flex;min-height:120px" onclick="addTable()"><div class="plan-table-empty"><i class="fas fa-plus" style="font-size:1.5rem;display:block;margin-bottom:8px;color:var(--gold)"></i>Add Table</div></div>`;
  el.innerHTML=html;
}
function addTable(){const nv=prompt('Table name (e.g. Table 1, VIP):');if(nv&&nv.trim()){plannerData.tables.push({name:nv.trim(),capacity:10,guests:[]});savePlanner();renderSeating();}}
function deleteTable(i){if(confirm('Remove this table?')){plannerData.tables.splice(i,1);savePlanner();renderSeating();}}
function editTableCapacity(i){const nv=prompt('Table capacity:',plannerData.tables[i].capacity);if(nv&&!isNaN(nv)){plannerData.tables[i].capacity=parseInt(nv)||10;savePlanner();renderSeating();}}
function addSeat(ti){const sel=$('seatAdd_'+ti);if(!sel||!sel.value)return;if((plannerData.tables[ti].guests||[]).length>=(plannerData.tables[ti].capacity||10))return alert('Table is full!');if(!plannerData.tables[ti].guests)plannerData.tables[ti].guests=[];plannerData.tables[ti].guests.push(sel.value);savePlanner();renderSeating();}
function removeSeat(ti,gi){plannerData.tables[ti].guests.splice(gi,1);savePlanner();renderSeating();}

/* ===== CALENDAR ===== */
function initCalendar(){const now=new Date();calMonth=now.getMonth();calYear=now.getFullYear();calView='month';renderCalendar();}
function renderCalendar(){
  const el=$('calendarGrid');if(!el)return;
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  setTxt('calMonthYear',months[calMonth]+' '+calYear);
  const wd=JSON.parse(localStorage.getItem('weddingData')||'{}');
  const weddingDate=wd.weddingDate?new Date(wd.weddingDate):null;
  const today=new Date();
  const eventDates=(plannerData.events||[]).map(e=>e.date);

  if(calView==='month'){
    const first=new Date(calYear,calMonth,1).getDay();
    const days=new Date(calYear,calMonth+1,0).getDate();
    let html=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>'<div class="plan-cal-day-name">'+d+'</div>').join('');
    for(let i=0;i<first;i++)html+='<div class="plan-cal-day empty"></div>';
    for(let d=1;d<=days;d++){
      const dateStr=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      const isToday=d===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
      const isWedding=weddingDate&&d===weddingDate.getDate()&&calMonth===weddingDate.getMonth()&&calYear===weddingDate.getFullYear();
      const hasEvent=eventDates.includes(dateStr);
      let cls='plan-cal-day';
      if(isToday)cls+=' today';
      if(isWedding)cls+=' wedding';
      if(hasEvent)cls+=' has-event';
      html+=`<div class="${cls}" onclick="showDayEvents('${dateStr}')">${d}</div>`;
    }
    el.innerHTML=html;
    el.style.gridTemplateColumns='repeat(7,1fr)';
  }else{
    const startOfWeek=new Date(calYear,calMonth,today.getDate()-today.getDay());
    let html='';
    for(let d=0;d<7;d++){
      const dt=new Date(startOfWeek);dt.setDate(dt.getDate()+d);
      const dateStr=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
      const dayEvents=plannerData.events.filter(e=>e.date===dateStr);
      const isToday=dt.toDateString()===today.toDateString();
      html+=`<div style="padding:12px;border:1px solid rgba(212,175,55,0.08);border-radius:8px;${isToday?'background:rgba(212,175,55,0.08);border-color:rgba(212,175,55,0.2)':''}">
        <div style="font-size:0.75rem;color:var(--text-light);margin-bottom:4px">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]}</div>
        <div style="font-size:1.1rem;color:${isToday?'var(--gold)':'var(--text)'};font-weight:600;margin-bottom:8px">${dt.getDate()}</div>
        ${dayEvents.map(e=>'<div style="font-size:0.78rem;padding:4px 8px;background:rgba(212,175,55,0.08);border-radius:4px;margin-bottom:4px;color:var(--text)">'+e.title+(e.time?' '+e.time:'')+'</div>').join('')}
      </div>`;
    }
    el.innerHTML=html;
    el.style.gridTemplateColumns='repeat(7,1fr)';
  }
}
function calPrev(){if(calView==='month'){calMonth--;if(calMonth<0){calMonth=11;calYear--;}}renderCalendar();}
function calNext(){if(calView==='month'){calMonth++;if(calMonth>11){calMonth=0;calYear++;}}renderCalendar();}
function toggleCalView(){calView=calView==='month'?'week':'month';setTxt('calViewBtn',calView==='month'?'Weekly':'Monthly');renderCalendar();}
function showDayEvents(dateStr){const evts=plannerData.events.filter(e=>e.date===dateStr);const list=evts.length?evts.map(e=>e.time+' - '+e.title).join('\n'):'No events';alert('Events for '+dateStr+':\n\n'+list+'\n\nClick "Add Event" to create one for this date.');}
function openEventModal(){$('eventTitle').value='';$('eventDate').value='';$('eventTime').value='';$('eventDesc').value='';$('eventModal').classList.add('open');}
function saveEvent(){
  const title=$('eventTitle').value.trim();const date=$('eventDate').value;const time=$('eventTime').value;const desc=$('eventDesc').value.trim();
  if(!title||!date)return alert('Title and date required');
  plannerData.events.push({title,date,time,desc});
  plannerData.events.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  savePlanner();renderCalendar();renderEventList();$('eventModal').classList.remove('open');
}
function deleteEvent(i){plannerData.events.splice(i,1);savePlanner();renderEventList();renderCalendar();}
function renderEventList(){
  const el=$('eventList');if(!el)return;
  if(!plannerData.events.length){el.innerHTML='<div class="plan-table-empty"><i class="fas fa-calendar-plus" style="font-size:2rem;display:block;margin-bottom:8px;color:var(--gold);opacity:0.3"></i>No events yet</div>';return;}
  el.innerHTML=plannerData.events.map((e,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;margin-bottom:4px;transition:var(--transition)" onmouseover="this.style.background='rgba(212,175,55,0.04)'" onmouseout="this.style.background='transparent'">
      <div style="width:36px;height:36px;border-radius:8px;background:rgba(212,175,55,0.1);display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:0.8rem"><i class="fas fa-calendar-day"></i></div>
      <div style="flex:1"><div style="font-size:0.9rem;color:var(--text);font-weight:500">${e.title}</div><div style="font-size:0.78rem;color:var(--text-light)">${e.date} ${e.time||''}</div></div>
      <button onclick="deleteEvent(${i})" style="background:none;border:none;color:var(--text-light);cursor:pointer;padding:6px"><i class="fas fa-trash" style="font-size:0.75rem"></i></button>
    </div>
  `).join('');
}

/* ===== NOTES ===== */
function renderNotes(){
  const el=$('notesContainer');if(!el)return;
  let notes=plannerData.notes||[];
  if(noteSearchQuery){const q=noteSearchQuery.toLowerCase();notes=notes.filter(n=>(n.title||'').toLowerCase().includes(q)||(n.body||'').toLowerCase().includes(q));}
  let html=`<div class="plan-note" style="border-style:dashed;cursor:pointer;align-items:center;justify-content:center;display:flex;min-height:160px" onclick="addNote()"><div class="plan-table-empty"><i class="fas fa-plus" style="font-size:1.5rem;display:block;margin-bottom:8px;color:var(--gold)"></i>Add Note</div></div>`;
  html+=notes.map((n,i)=>`
    <div class="plan-note">
      <div class="plan-note-title"><span>${n.title||'Untitled'}</span><button onclick="deleteNote(${i})" style="background:none;border:none;color:var(--text-light);cursor:pointer"><i class="fas fa-trash" style="font-size:0.75rem"></i></button></div>
      <div class="plan-note-body" contenteditable="true" onblur="updateNoteBody(${i},this.textContent)">${n.body||''}</div>
      <div class="plan-note-date">${n.date||''}</div>
    </div>
  `).join('');
  el.innerHTML=html;
}
function addNote(){const title=prompt('Note title:');if(!title)return;plannerData.notes.unshift({title:title.trim(),body:'',date:new Date().toLocaleDateString()});savePlanner();renderNotes();}
function deleteNote(i){if(confirm('Delete this note?')){plannerData.notes.splice(i,1);savePlanner();renderNotes();}}
function updateNoteBody(i,body){plannerData.notes[i].body=body;plannerData.notes[i].date=new Date().toLocaleDateString()+' (edited)';savePlanner();}
function searchNotes(v){noteSearchQuery=v;renderNotes();}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded',function(){
  loadPlanner();
  renderChecklist();renderBudget();renderVendors();renderGuests();renderSeating();
  initCalendar();renderEventList();renderNotes();updateStats();
  document.querySelectorAll('.plan-tab').forEach(t=>t.addEventListener('click',function(){switchTab(this.dataset.tab);}));
  document.querySelectorAll('.plan-modal-overlay').forEach(m=>m.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');}));
});
