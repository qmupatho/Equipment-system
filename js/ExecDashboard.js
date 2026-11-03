<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<base target="_top">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  :root{--navy:#13294B;--bg:#F4F6FA;--card:#FFFFFF;--line:#E2E8F0;--muted:#64748B;--txt:#1E293B;--ok:#0F766E;--warn:#B45309;--bad:#BE123C;--info:#0369A1}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Sarabun",Tahoma,sans-serif;background:var(--bg);color:var(--txt);font-size:14px}
  header{background:var(--navy);color:#fff;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
  header h1{font-size:22px;font-weight:800}header p{font-size:12px;color:#C9D6E8;margin-top:2px}
  .ctl{display:flex;gap:8px;align-items:center}
  select,button{font-family:inherit;font-size:13px;border-radius:8px;border:1px solid #CBD5E1;padding:7px 10px;background:#fff;color:var(--txt)}
  button{cursor:pointer;font-weight:700;background:#F2A65A;border-color:#F2A65A;color:#13294B}
  main{padding:22px 28px;max-width:1500px;margin:0 auto}
  .grid{display:grid;gap:14px}.k{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:16px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px}
  .kpi .l{font-size:12px;color:var(--muted);font-weight:600}.kpi .v{font-size:28px;font-weight:800;margin-top:4px}.kpi .s{font-size:11.5px;color:var(--muted);margin-top:2px}
  .two{grid-template-columns:1fr 1fr;margin-bottom:16px}@media(max-width:900px){.two{grid-template-columns:1fr}header{padding:14px 16px}main{padding:16px}}
  h2{font-size:15px;font-weight:700;margin-bottom:10px;color:var(--navy)}
  .ch{position:relative;height:280px}
  table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left}th{background:#F8FAFC;color:var(--muted);font-size:12px}
  td.r,th.r{text-align:right}.tag{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11.5px;font-weight:700}
  .bad{color:var(--bad)}.ok{color:var(--ok)}.warn{color:var(--warn)}
  .alerts{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}.alerts div{background:#fff;border:1px solid var(--line);border-left:5px solid var(--warn);border-radius:10px;padding:10px 14px;font-size:13px}
  .note{font-size:11.5px;color:var(--muted);margin-top:8px}
  footer{text-align:center;font-size:11.5px;color:var(--muted);padding:18px}
  @media print{header{-webkit-print-color-adjust:exact;print-color-adjust:exact}.ctl{display:none}.card{break-inside:avoid}body{background:#fff}}
</style>
</head>
<body>
<header>
  <div><h1>แดชบอร์ดผู้บริหาร · เครื่องมือห้องปฏิบัติการ</h1><p id="gen">สาขาวิชาพยาธิวิทยา</p></div>
  <div class="ctl"><select id="dept" onchange="render()"><option value="">ทุกหน่วยงาน</option></select><button onclick="window.print()">พิมพ์</button></div>
</header>
<main>
  <div id="kpi" class="grid k"></div>
  <div id="alerts" class="alerts"></div>
  <div class="grid two">
    <div class="card"><h2>แผนสอบเทียบ / บำรุงรักษา 12 เดือนข้างหน้า</h2><div class="ch"><canvas id="cDue"></canvas></div></div>
    <div class="card"><h2>สถานะเครื่องมือ</h2><div class="ch"><canvas id="cStatus"></canvas></div></div>
    <div class="card"><h2>อายุเครื่องมือตามกลุ่ม</h2><div class="ch"><canvas id="cAge"></canvas></div></div>
    <div class="card"><h2>ค่าใช้จ่ายสอบเทียบรายปีงบประมาณ (บาท)</h2><div class="ch"><canvas id="cCost"></canvas></div></div>
  </div>
  <div class="grid two">
    <div class="card"><h2>สรุปตามหน่วยงาน</h2><div style="overflow-x:auto"><table id="tDept"></table></div></div>
    <div class="card"><h2>เครื่องที่ต้องติดตาม</h2><div style="overflow-x:auto;max-height:420px;overflow-y:auto"><table id="tWatch"></table></div></div>
  </div>
  <p class="note">มูลค่าสุทธิคำนวณด้วยวิธีเส้นตรง ราคาซาก 1 บาท คิดตามปีงบประมาณ (ใช้ประกอบการวางแผน) · อัตราผ่านสอบเทียบนับผลใน 12 เดือนล่าสุด · ไม่รวมเครื่องที่ปลดระวาง</p>
</main>
<footer>ข้อมูลจากระบบบริหารจัดการเครื่องมือห้องปฏิบัติการ · อ่านอย่างเดียว</footer>
<script>
var DATA = <?!= dataJson ?>;
var STOPPED = ['สอบเทียบไม่ผ่านเกณฑ์','เครื่องมือเสีย','ส่งซ่อม','ระงับการใช้งาน'];
var charts = {};
function iso(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
var TODAY = iso(new Date());
function num(v){var n=parseFloat(String(v||'').replace(/[^0-9.\-]/g,''));return isFinite(n)?n:NaN;}
function baht(n){if(!isFinite(n))return '-';var a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(2)+' ล้าน':Math.round(n).toLocaleString('th-TH');}
function thd(s){if(!s)return '-';var d=new Date(s+'T00:00:00');return isNaN(d)?s:d.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'});}
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function days(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);}
function fyOf(s){var d=new Date(s+'T00:00:00');return d.getFullYear()+(d.getMonth()>=9?1:0);}
// ค่าเสื่อมสะสมวิธีเส้นตรง (เต็มปีงบ = ค่าเสื่อมต่อปี, ปีไม่เต็ม = รายวัน/365, ปิดยอดที่ราคาซาก)
function accSL(cost,life,start,asOf){
  var sv=Math.min(1,cost),base=cost-sv,annual=base/life; if(asOf<start)return 0;
  var s=new Date(start+'T00:00:00'),end=new Date(s);end.setMonth(end.getMonth()+Math.round(life*12));
  var cut=new Date(asOf+'T00:00:00');cut.setDate(cut.getDate()+1); if(cut>end)return base;
  var acc=0,fy=s.getFullYear()+(s.getMonth()>=9?1:0);
  while(true){var fs=new Date(fy-1,9,1),fe=new Date(fy,9,1); if(fs>=cut)break;
    var a=fs>s?fs:s,b=fe<cut?fe:cut,full=(+a===+fs&&+fe<=+cut);
    acc+= full?annual:annual/365*Math.round((b-a)/86400000); fy++;}
  return Math.min(base,acc);
}
(function init(){
  document.getElementById('gen').textContent='สาขาวิชาพยาธิวิทยา · ข้อมูล ณ '+DATA.generatedAt+' น.';
  var locs={};DATA.eqs.forEach(function(e){locs[e.loc]=1;});
  var sel=document.getElementById('dept');
  Object.keys(locs).sort().forEach(function(l){var o=document.createElement('option');o.value=l;o.textContent=l;sel.appendChild(o);});
  render();
})();
function render(){
  var dep=document.getElementById('dept').value;
  var all=DATA.eqs.filter(function(e){return !dep||e.loc===dep;});
  var act=all.filter(function(e){return e.status!=='จำหน่ายออก';});
  var ids={};act.forEach(function(e){ids[e.id]=1;});
  var sched=act.filter(function(e){return (e.need==='สอบเทียบ'||e.need==='บำรุงรักษา')&&e.next;});
  var stopped=act.filter(function(e){return STOPPED.indexOf(e.status)!==-1;});
  var running=act.filter(function(e){return STOPPED.indexOf(e.status)===-1;});
  var overdue=sched.filter(function(e){return STOPPED.indexOf(e.status)===-1&&e.next<TODAY;});
  var due60=sched.filter(function(e){var d=days(TODAY,e.next);return STOPPED.indexOf(e.status)===-1&&d>=0&&d<=60;});
  var cal=DATA.cal.filter(function(c){return ids[c.id];}),pass=cal.filter(function(c){return c.pass;}).length;
  var cost=0,nbv=0,valued=0,ages=[],over=0;
  act.forEach(function(e){var v=num(e.value),l=num(e.life);
    if(e.start){var age=days(e.start,TODAY)/365.25;ages.push(age);if(l>0&&age>l)over++;}
    if(v>0){cost+=v;if(l>0&&e.start){nbv+=v-accSL(v,l,e.start,TODAY);valued++;}else nbv+=v;}});
  var curFY=fyOf(TODAY),fyCost=DATA.costs.filter(function(c){return ids[c.id]&&c.date&&fyOf(c.date)===curFY;}).reduce(function(s,c){return s+c.cost;},0);
  var ready=act.filter(function(e){return e.status==='พร้อมใช้งาน'||e.status==='';}).length;
  function k(l,v,s,c){return '<div class="card kpi"><div class="l">'+l+'</div><div class="v '+(c||'')+'">'+v+'</div><div class="s">'+(s||'')+'</div></div>';}
  document.getElementById('kpi').innerHTML=
     k('เครื่องมือที่ใช้งาน',act.length.toLocaleString(),'ไม่รวมปลดระวาง '+(all.length-act.length)+' เครื่อง')
    +k('พร้อมใช้งาน',act.length?Math.round(ready/act.length*100)+'%':'-',ready+' เครื่อง','ok')
    +k('หยุดใช้ / ซ่อม',stopped.length,'ติดป้ายห้ามใช้งาน',stopped.length?'bad':'')
    +k('สอบเทียบเกินกำหนด',overdue.length,'ครบใน 60 วัน '+due60.length+' เครื่อง',overdue.length?'bad':'ok')
    +k('อัตราผ่านสอบเทียบ (12 เดือน)',cal.length?Math.round(pass/cal.length*100)+'%':'-',pass+' / '+cal.length+' ครั้ง',cal.length&&pass/cal.length<0.9?'warn':'ok')
    +k('มูลค่าเครื่องมือรวม',baht(cost)+' ฿','มูลค่าสุทธิ '+baht(nbv)+' ฿')
    +k('อายุเฉลี่ย',ages.length?(ages.reduce(function(a,b){return a+b;},0)/ages.length).toFixed(1)+' ปี':'-','เกินอายุใช้งาน '+over+' เครื่อง',over?'warn':'')
    +k('ค่าสอบเทียบ ปีงบ '+(curFY+543),baht(fyCost)+' ฿','ตามที่บันทึกในระบบ');
  var ia=DATA.iaOpen.filter(function(i){return ids[i];}).length,vr=DATA.vrPending.filter(function(i){return ids[i];}).length,al=[];
  if(overdue.length)al.push('<div>⚠️ สอบเทียบเกินกำหนด <b>'+overdue.length+'</b> เครื่อง</div>');
  if(ia)al.push('<div>📋 ประเมินผลกระทบย้อนหลังที่ยังไม่ปิด <b>'+ia+'</b> เรื่อง</div>');
  if(vr)al.push('<div>✅ ทวนสอบก่อนใช้งานรออนุมัติ <b>'+vr+'</b> เรื่อง</div>');
  if(over)al.push('<div>⏳ เครื่องเกินอายุการใช้งาน <b>'+over+'</b> เครื่อง ควรพิจารณาจัดหาทดแทน</div>');
  document.getElementById('alerts').innerHTML=al.join('');
  Object.keys(charts).forEach(function(c){charts[c].destroy();});
  if(typeof Chart==='undefined')return;
  Chart.defaults.font.family='Sarabun, Tahoma, sans-serif';
  // A: due by month
  var labels=['เกินกำหนด'],cnt=[overdue.length],base=new Date();base.setDate(1);
  for(var m=0;m<12;m++){var d=new Date(base.getFullYear(),base.getMonth()+m,1);labels.push(d.toLocaleDateString('th-TH',{month:'short',year:'2-digit'}));
    var ym=iso(d).slice(0,7);cnt.push(sched.filter(function(e){return STOPPED.indexOf(e.status)===-1&&e.next.slice(0,7)===ym&&e.next>=TODAY;}).length);}
  charts.a=new Chart(document.getElementById('cDue'),{type:'bar',data:{labels:labels,datasets:[{label:'จำนวนเครื่อง',data:cnt,backgroundColor:cnt.map(function(v,i){return i===0?'#BE123C':'#0369A1';}),borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}});
  // B: status
  var vrw=act.filter(function(e){return e.status==='รอทวนสอบก่อนใช้';}).length,other=act.length-ready-stopped.length-vrw;
  charts.b=new Chart(document.getElementById('cStatus'),{type:'doughnut',data:{labels:['พร้อมใช้งาน','หยุดใช้ / ซ่อม','รอทวนสอบ','อื่นๆ'],datasets:[{data:[ready,stopped.length,vrw,Math.max(0,other)],backgroundColor:['#0F766E','#BE123C','#0369A1','#CBD5E1']}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right'}}}});
  // C: age by type
  var g={};act.forEach(function(e){var t=g[e.type]=g[e.type]||{n:0,b:[0,0,0,0,0]};t.n++;var a=e.start?days(e.start,TODAY)/365.25:null;t.b[a===null?4:a<=3?0:a<=5?1:a<=10?2:3]++;});
  var top=Object.keys(g).sort(function(a,b){return g[b].n-g[a].n;}).slice(0,8),bk=[['≤ 3 ปี','#0F766E'],['3–5 ปี','#0369A1'],['5–10 ปี','#D97706'],['> 10 ปี','#BE123C'],['ไม่ระบุ','#CBD5E1']];
  charts.c=new Chart(document.getElementById('cAge'),{type:'bar',data:{labels:top.map(function(t){return t.length>24?t.slice(0,23)+'…':t;}),datasets:bk.map(function(b,i){return{label:b[0],data:top.map(function(t){return g[t].b[i];}),backgroundColor:b[1]};})},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10}}},scales:{x:{stacked:true,ticks:{precision:0}},y:{stacked:true}}}});
  // D: cost by FY
  var fys=[curFY-3,curFY-2,curFY-1,curFY],cs=fys.map(function(f){return DATA.costs.filter(function(c){return ids[c.id]&&c.date&&fyOf(c.date)===f;}).reduce(function(s,c){return s+c.cost;},0);});
  charts.d=new Chart(document.getElementById('cCost'),{type:'bar',data:{labels:fys.map(function(f){return 'ปีงบ '+(f+543);}),datasets:[{label:'บาท',data:cs,backgroundColor:'#B45309',borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return baht(v);}}}}}});
  // ตารางหน่วยงาน
  var D={};act.forEach(function(e){var x=D[e.loc]=D[e.loc]||{n:0,ready:0,over:0,stop:0,val:0};x.n++;if(e.status==='พร้อมใช้งาน'||e.status==='')x.ready++;if(STOPPED.indexOf(e.status)!==-1)x.stop++;
    if((e.need==='สอบเทียบ'||e.need==='บำรุงรักษา')&&e.next&&e.next<TODAY&&STOPPED.indexOf(e.status)===-1)x.over++;var v=num(e.value);if(v>0)x.val+=v;});
  document.getElementById('tDept').innerHTML='<tr><th>หน่วยงาน</th><th class="r">เครื่อง</th><th class="r">พร้อมใช้</th><th class="r">หยุดใช้</th><th class="r">เกินกำหนด</th><th class="r">มูลค่า (บาท)</th></tr>'
    +Object.keys(D).sort(function(a,b){return D[b].n-D[a].n;}).map(function(l){var x=D[l];return '<tr><td>'+esc(l)+'</td><td class="r">'+x.n+'</td><td class="r ok">'+Math.round(x.ready/x.n*100)+'%</td><td class="r '+(x.stop?'bad':'')+'">'+x.stop+'</td><td class="r '+(x.over?'bad':'')+'">'+x.over+'</td><td class="r">'+baht(x.val)+'</td></tr>';}).join('');
  // เครื่องที่ต้องติดตาม
  var watch=overdue.map(function(e){return{e:e,why:'เกินกำหนด '+(-days(TODAY,e.next))+' วัน',c:'bad',o:0};})
    .concat(stopped.map(function(e){return{e:e,why:e.status,c:'bad',o:1};}))
    .concat(due60.map(function(e){return{e:e,why:'ครบกำหนด '+thd(e.next),c:'warn',o:2};}))
    .sort(function(a,b){return a.o-b.o;}).slice(0,30);
  document.getElementById('tWatch').innerHTML='<tr><th>เครื่องมือ</th><th>หน่วยงาน</th><th>สถานะ</th></tr>'
    +(watch.length?watch.map(function(w){return '<tr><td><b>'+esc(w.e.code||w.e.id)+'</b><br><span style="color:#64748B;font-size:12px">'+esc(w.e.name)+'</span></td><td>'+esc(w.e.loc)+'</td><td class="'+w.c+'">'+esc(w.why)+'</td></tr>';}).join('')
    :'<tr><td colspan="3" class="ok" style="text-align:center">ไม่มีเครื่องที่ต้องติดตาม 👍</td></tr>');
}
</script>
</body>
</html>
