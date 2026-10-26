/* Texas Campus student portal shared logic.
   Uses existing Supabase Auth session, course_orders, courses and profiles tables. */
(() => {
"use strict";
const SUPABASE_URL = "https://dykxmozruyzgkiyopvlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: window.localStorage }
});
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateText = v => v ? new Date(v).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}) : "—";
const money = (amount,currency="LKR") => `${currency} ${Number(amount||0).toLocaleString("en-LK")}`;
const statusOf = o => String(o.payment_status || o.status || o.order_status || "pending").toLowerCase().trim();
const approved = o => /^(approved|paid|complete|completed|success|active|confirmed)$/.test(statusOf(o)) && (o.course_access === true || o.course_access === "true");
const isPending = o => /pending|awaiting|review|processing/.test(statusOf(o));
const orderCourseId = o => o.course_id || o.courseId || o.product_id || null;
let currentUser = null, profile = null, allOrders = [], packageOrders = [], courses = [], progressRows = [];
function notice(msg){const n=$("notice");if(n){n.textContent=msg;n.classList.remove("hidden");}}
function clearNotice(){const n=$("notice");if(n){n.textContent="";n.classList.add("hidden");}}
function initials(s){return String(s||"Student").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"ST";}
function requireEl(id){const e=$(id);if(!e)console.warn(`Optional portal element #${id} is not on this page.`);return e;}
function navActive(){const page=document.body.dataset.page;document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===page));}
function shellUser(){
 const name=profile?.full_name||profile?.username||currentUser?.user_metadata?.full_name||currentUser?.email?.split("@")[0]||"Student";
 if($("profileName"))$("profileName").textContent=name;
 if($("welcomeName"))$("welcomeName").textContent=name;
 if($("avatar"))$("avatar").textContent=initials(name);
 if($("todayDate"))$("todayDate").textContent=new Date().toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
async function getProfile(user){
 const {data,error}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(error) console.warn("Profile lookup:",error.message);
 return data||null;
}
async function getOrders(user){
 const {data,error}=await sb.from("course_orders").select("*").eq("student_id",user.id).order("created_at",{ascending:false});
 if(error) throw new Error("Could not load payment/course orders: "+error.message);
 return data||[];
}
async function getPackageOrders(user){
 const {data,error}=await sb.from("course_package_orders").select("*").eq("student_id",user.id).order("created_at",{ascending:false});
 if(error) throw new Error("Could not load package orders: "+error.message);
 return data||[];
}
async function getCourses(){
 const ids=[...new Set(allOrders.map(orderCourseId).filter(Boolean))];
 let byId=[];
 if(ids.length){
  const {data,error}=await sb.from("courses").select("*").in("id",ids);
  if(error) console.warn("Course details:",error.message);
  byId=data||[];
 }
 const {data:published,error:pubError}=await sb.from("courses").select("*").eq("is_published",true).order("created_at",{ascending:true});
 if(pubError) console.warn("Catalogue:",pubError.message);
 courses=[...new Map([...byId,...(published||[])].map(c=>[String(c.id),c])).values()];
 return courses;
}
async function getProgress(user){
 const {data,error}=await sb.from("course_lesson_progress").select("*").eq("student_id",user.id);
 if(error){console.info("Progress table not configured yet:",error.message);return [];}
 return data||[];
}
function approvedOrders(){
 const individual = allOrders.filter(approved);
 const packageAccess = packageOrders.filter(approved).flatMap(order =>
  (Array.isArray(order.course_ids) ? order.course_ids : []).map(courseId => ({
   ...order,
   id: `package:${order.id}:${courseId}`,
   course_id: courseId,
   package_access: true,
   package_order_id: order.id
  }))
 );
 return [...individual, ...packageAccess];
}
function courseFor(order){return courses.find(c=>String(c.id)===String(orderCourseId(order)))||null;}
function titleFor(order){return courseFor(order)?.title||order.package_name||order.course_title||order.title||order.course_name||"Purchased course";}
function slugFor(order){return courseFor(order)?.slug||order.course_slug||"";}
function approvalDate(order){return order.reviewed_at||order.approved_at||order.created_at||null;}
function expiryDate(order){const base=approvalDate(order);if(!base)return null;const d=new Date(base);d.setFullYear(d.getFullYear()+2);return d;}
function daysLeft(order){const d=expiryDate(order);return d?Math.ceil((d.getTime()-Date.now())/86400000):null;}
function progressFor(order){
 const rows=progressRows.filter(r=>String(r.course_id)===String(orderCourseId(order)));
 const total=rows.length;const done=rows.filter(r=>r.completed===true||r.completed_at).length;
 return {total,done,pct:total?Math.round(done/total*100):0,rows};
}
function courseLogo(course){
 const slug=String(course?.slug||"").toLowerCase();
 const map={"myob":"myob.svg","quickbooks-desktop":"quickbooks.svg","quickbooks-online":"quickbooks.svg","tally":"tally.svg","sage":"sage-50.svg","xero":"xero.svg","zoho":"zoho-books.svg","freshbooks":"freshbooks.svg","chatgpt":"chatgpt.svg","gemini":"gemini.svg","claude":"claude.svg","gamma":"gamma.svg"};
 return map[slug]?`./assets/logos/${map[slug]}`:null;
}
function courseCard(order){
 const course=courseFor(order), title=titleFor(order), id=orderCourseId(order), slug=slugFor(order);
 const exp=expiryDate(order), days=daysLeft(order), p=progressFor(order), logo=courseLogo(course);
 const expired=days!==null&&days<=0;
 const validity=days===null?"Validity: 2 years from approval":expired?`Access expired ${dateText(exp)}`:`${days} day${days===1?"":"s"} remaining · Expires ${dateText(exp)}`;
 const mark=logo?`<img src="${logo}" alt="" onerror="this.remove()">`:"▦";
 return `<article class="course-card"><div class="course-mark">${mark}</div><div class="course-main"><h3>${esc(title)}</h3><p>${esc(course?.category||"Enrolled course")}</p><div class="progress-row"><div class="bar"><span style="width:${p.pct}%"></span></div><small>${p.total?`${p.done}/${p.total} lessons`:"Progress not recorded"}</small></div><div class="validity ${expired?"expired":""}">◷ ${esc(validity)}</div></div><a class="btn ${expired?"secondary":""}" ${expired?'aria-disabled="true"':`href="./course-view.html?course=${encodeURIComponent(slug)}&id=${encodeURIComponent(id||"")}"`}>${expired?"Expired":"Open course →"}</a></article>`;
}
function renderCourseCards(target,orders){
 if(!target)return;
 target.innerHTML=orders.length?orders.map(courseCard).join(""):`<div class="empty"><strong>No approved courses yet</strong>Your admin-approved courses will appear here once payment is approved and course access is enabled.</div>`;
}
function renderPayments(target){
 if(!target)return;
 const payments=[...allOrders,...packageOrders];
 target.innerHTML=payments.length?payments.map(o=>`<div class="payment-row"><div class="task-icon">＄</div><div class="task-copy"><strong>${esc(titleFor(o))}</strong><small>${esc(dateText(o.created_at))} · ${esc(o.payment_reference||"No reference")} · ${esc(money(o.amount,o.currency||"LKR"))}</small></div><span class="status ${approved(o)?"approved":statusOf(o)==="rejected"?"rejected":""}">${esc(statusOf(o).replaceAll("_"," "))}</span></div>`).join(""):`<div class="empty">No payment records found for this account.</div>`;
}
function renderAccount(target){
 if(!target)return;
 const p=profile||{};
 target.innerHTML=`<div class="field-grid"><div class="field"><label>Full name</label><input id="editFullName" value="${esc(p.full_name||currentUser.user_metadata?.full_name||"")}" autocomplete="name"></div><div class="field"><label>Username</label><input id="editUsername" value="${esc(p.username||"")}" autocomplete="username"></div><div class="field"><label>Email</label><input id="editEmail" type="email" value="${esc(p.email||currentUser.email||"")}" autocomplete="email"></div><div class="field"><label>Mobile</label><input id="editMobile" value="${esc(p.mobile||"")}" autocomplete="tel"></div><div class="field full"><label>New password (leave blank to keep current password)</label><input id="newPassword" type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters"></div></div><div class="form-actions"><button class="btn" id="saveAccount" type="button">Save account details</button></div><p class="page-subtitle" id="accountFeedback" aria-live="polite"></p>`;
 $("saveAccount")?.addEventListener("click",saveAccount);
}
async function saveAccount(){
 const btn=$("saveAccount"),feedback=$("accountFeedback");if(btn)btn.disabled=true;if(feedback)feedback.textContent="Saving…";
 try{
  const full_name=$("editFullName").value.trim(),username=$("editUsername").value.trim(),email=$("editEmail").value.trim(),mobile=$("editMobile").value.trim(),password=$("newPassword").value;
  if(password&&password.length<8)throw new Error("Password must be at least 8 characters.");
  if(email&&email!==currentUser.email){const {error}=await sb.auth.updateUser({email});if(error)throw error;}
  if(password){const {error}=await sb.auth.updateUser({password});if(error)throw error;}
  const {error:profileError}=await sb.from("profiles").upsert({id:currentUser.id,full_name,username,email:email||currentUser.email,mobile},{onConflict:"id"});
  if(profileError)throw profileError;
  profile={...(profile||{}),full_name,username,email:email||currentUser.email,mobile};shellUser();
  if(feedback)feedback.textContent="Account details saved. If you changed email, confirm it using the email Supabase sends.";
 }catch(e){if(feedback)feedback.textContent=e.message||"Could not save account details.";}
 finally{if(btn)btn.disabled=false;}
}
function renderDashboard(){
 const approvedList=approvedOrders();
 if($("enrolledCount"))$("enrolledCount").textContent=approvedList.length;
 if($("activeNote"))$("activeNote").textContent=approvedList.length?`${approvedList.length} approved course${approvedList.length===1?"":"s"}`:"No approved courses yet";
 if($("certificateCount"))$("certificateCount").textContent=allOrders.filter(o=>o.certificate_issued===true||o.certificate_status==="issued").length;
 renderCourseCards($("courseList"),approvedList);
 renderPayments($("paymentList"));
 if($("overallProgress")){
  const all=approvedList.flatMap(o=>progressFor(o).rows);const total=all.length,done=all.filter(r=>r.completed===true||r.completed_at).length;
  $("overallProgress").textContent=total?`${Math.round(done/total*100)}%`:"—";
  if($("progressNote"))$("progressNote").textContent=total?`${done} of ${total} lessons complete`:"Progress appears as lessons are tracked";
 }
 const hours=progressRows.reduce((sum,r)=>sum+Number(r.minutes_spent||0),0)/60;
 if($("learningTime"))$("learningTime").textContent=hours?`${hours.toFixed(1)}h`:"—";
 const chart=$("activityChart");
 if(chart){
  const vals=Array(7).fill(0),now=new Date();
  progressRows.forEach(r=>{const d=new Date(r.updated_at||r.completed_at||r.created_at||0);const delta=Math.floor((now-d)/86400000);if(delta>=0&&delta<7)vals[(now.getDay()+6-delta+7)%7]+=Number(r.minutes_spent||0)/60;});
  chart.innerHTML=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>`<div class="day"><div class="bar-column"><span style="--h:${Math.max(4,Math.min(100,vals[i]/4*100))}%"></span></div><span>${day}</span></div>`).join("");
 }
 if($("weekHours"))$("weekHours").textContent=`${progressRows.reduce((s,r)=>s+Number(r.minutes_spent||0),0)/60}h`;
 if($("taskList")){
  const pending=approvedList.flatMap(o=>progressFor(o).rows.filter(r=>!(r.completed===true||r.completed_at)).map(r=>({o,r}))).slice(0,5);
  $("taskList").innerHTML=pending.length?pending.map(({o,r})=>`<a class="task-row" href="./course-view.html?course=${encodeURIComponent(slugFor(o))}&id=${encodeURIComponent(orderCourseId(o)||"")}#lesson-${encodeURIComponent(r.lesson_id||"")}"><div class="task-icon">▶</div><div class="task-copy"><strong>${esc(r.lesson_title||"Continue lesson")}</strong><small>${esc(titleFor(o))}</small></div><span class="status">Pending</span></a>`).join(""):`<div class="empty">Pending video lessons appear here after course lesson records are connected.</div>`;
 }
}
async function loadCatalogue(target){
 if(!target)return;
 const {data,error}=await sb.from("courses").select("*").eq("is_published",true).order("created_at",{ascending:true});
 if(error){target.innerHTML=`<div class="empty">Catalogue could not load: ${esc(error.message)}</div>`;return;}
 const list=data||[];
 target.innerHTML=list.length?list.map(c=>{
  const owned=approvedOrders().some(o=>String(orderCourseId(o))===String(c.id));
  const logo=courseLogo(c);
  return `<article class="course-card"><div class="course-mark">${logo?`<img src="${logo}" alt="" onerror="this.remove()">`:"✦"}</div><div class="course-main"><h3>${esc(c.title)}</h3><p>${esc(c.summary||c.category||"Texas Campus course")}</p><div class="validity">${esc(money(c.price,c.currency||"LKR"))}</div></div>${owned?'<span class="status approved">Enrolled</span>':`<a class="btn" href="./course.html?course=${encodeURIComponent(c.slug)}#buy">View / Buy →</a>`}</article>`;
 }).join(""):`<div class="empty">No published courses available.</div>`;
}
async function loadCourseView(){
 const params=new URLSearchParams(location.search),slug=params.get("course"),id=params.get("id");
 const order=approvedOrders().find(o=>String(orderCourseId(o))===String(id)||slugFor(o)===slug);
 const course=order?courseFor(order):courses.find(c=>c.slug===slug);
 const target=$("courseContent");if(!target)return;
 if(!order||!course){target.innerHTML='<div class="empty"><strong>Course access required</strong>This course is not linked to an approved order on your account.</div>';return;}
 const days=daysLeft(order);if(days!==null&&days<=0){target.innerHTML='<div class="notice">This course access has expired. Contact Texas Campus administration for renewal.</div>';return;}
 const folder=course.drive_folder_url;
 const lessonRows=progressRows.filter(r=>String(r.course_id)===String(course.id));
 const lessonMarkup=lessonRows.length?lessonRows.map((r,i)=>`<div class="lesson" id="lesson-${esc(r.lesson_id)}"><input type="checkbox" data-lesson-id="${esc(r.lesson_id)}" ${r.completed||r.completed_at?"checked":""} aria-label="Mark ${esc(r.lesson_title)} complete"><div class="lesson-main"><strong>${esc(r.lesson_title||`Lesson ${i+1}`)}</strong><small>${r.completed||r.completed_at?"Completed":"Not completed yet"}</small></div>${r.lesson_url?`<a href="${esc(r.lesson_url)}" target="_blank" rel="noopener noreferrer">Open lesson ↗</a>`:""}</div>`).join(""):'<div class="empty">Individual lesson records are not configured yet. For now, use the Google Drive folder to access the course videos and tutorial materials.</div>';
 target.innerHTML=`<div class="panel"><div class="panel-head"><div><h2>${esc(course.title)}</h2><p>${esc(course.summary||"Your course learning space")}</p></div><span class="status approved">${days} days remaining</span></div><p class="page-subtitle">Course videos and tutorial materials are provided through the course Google Drive folder.</p>${folder?`<a class="btn" href="${esc(folder)}" target="_blank" rel="noopener noreferrer">Open Google Drive course folder ↗</a>`:'<div class="empty">The Google Drive folder has not been added by the administrator yet.</div>'}</div><div class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Video lessons & tutorial materials</h2><p>Lessons appear here when they are added to the lesson progress table.</p></div></div><div class="lesson-list">${lessonMarkup}</div>${folder?`<div class="form-actions"><a class="btn secondary" href="${esc(folder)}" target="_blank" rel="noopener noreferrer">Open full Drive folder ↗</a></div>`:""}</div>`;
 target.querySelectorAll("[data-lesson-id]").forEach(box=>box.addEventListener("change",async()=>{
  const lesson_id=box.dataset.lessonId;const lesson=lessonRows.find(r=>String(r.lesson_id)===String(lesson_id));if(!lesson)return;
  const completed=box.checked;const now=new Date().toISOString();
  const {error}=await sb.from("course_lesson_progress").upsert({student_id:currentUser.id,course_id:course.id,lesson_id,lesson_title:lesson.lesson_title||"Lesson",lesson_url:lesson.lesson_url||null,completed,completed_at:completed?now:null,updated_at:now},{onConflict:"student_id,course_id,lesson_id"});
  if(error){box.checked=!completed;notice("Progress could not be saved: "+error.message);return;}
  lesson.completed=completed;lesson.completed_at=completed?now:null;notice("Lesson progress saved.");
 }));
}
async function loadPage(){
 const page=document.body.dataset.page||"dashboard";navActive();
 const {data,error}=await sb.auth.getSession();
 if(error)throw error;
 if(!data.session?.user){location.replace("./index.html#student-login");return;}
 currentUser=data.session.user;profile=await getProfile(currentUser);shellUser();
 allOrders=await getOrders(currentUser);packageOrders=await getPackageOrders(currentUser);await getCourses();progressRows=await getProgress(currentUser);
 if(page==="dashboard")renderDashboard();
 if(page==="my-courses")renderCourseCards($("courseList"),approvedOrders());
 if(page==="catalogue")await loadCatalogue($("catalogueList"));
 if(page==="payments")renderPayments($("paymentList"));
 if(page==="account")renderAccount($("accountDetails"));
 if(page==="course-view")await loadCourseView();
 if(page==="assignments"&&$("assignmentList")){
  const todo=approvedOrders().flatMap(o=>progressFor(o).rows.filter(r=>!(r.completed===true||r.completed_at)).map(r=>({o,r})));
  $("assignmentList").innerHTML=todo.length?todo.map(({o,r})=>`<a class="task-row" href="./course-view.html?course=${encodeURIComponent(slugFor(o))}&id=${encodeURIComponent(orderCourseId(o)||"")}#lesson-${encodeURIComponent(r.lesson_id||"")}"><div class="task-icon">▶</div><div class="task-copy"><strong>${esc(r.lesson_title||"Continue lesson")}</strong><small>${esc(titleFor(o))}</small></div><span class="status">Pending</span></a>`).join(""):'<div class="empty">No pending lessons have been recorded yet. Lesson records must be added for each Google Drive course.</div>';
 }
 if(page==="certificates"&&$("certificateList")){
  const certs=allOrders.filter(o=>o.certificate_issued===true||o.certificate_status==="issued");
  $("certificateList").innerHTML=certs.length?certs.map(o=>`<div class="payment-row"><div class="task-icon">🏆</div><div class="task-copy"><strong>${esc(titleFor(o))}</strong><small>Certificate issued · ${esc(dateText(o.reviewed_at||o.created_at))}</small></div><span class="status approved">Issued</span></div>`).join(""):'<div class="empty"><strong>End-of-course certificate</strong>Certificate will appear here when the course is completed and the administrator records it as issued.</div>';
 }
 const expiryTarget=$("expiryList");
 if(expiryTarget){
  const expiring=approvedOrders().map(o=>({o,d:daysLeft(o)})).sort((a,b)=>(a.d??99999)-(b.d??99999));
  expiryTarget.innerHTML=expiring.length?expiring.map(({o,d})=>`<div class="task-row"><div class="task-icon">◷</div><div class="task-copy"><strong>${esc(titleFor(o))}</strong><small>${d===null?"Validity begins from approval":d<=0?"Access expired":`${d} days remaining · Expires ${dateText(expiryDate(o))}`}</small></div><span class="status ${d!==null&&d<=0?"expired":"approved"}">${d!==null&&d<=0?"Expired":"Active"}</span></div>`).join(""):'<div class="empty">No approved courses yet.</div>';
 }
}
async function logout(){const b=$("signOut");if(b)b.disabled=true;const {error}=await sb.auth.signOut();if(error){notice("Could not log out: "+error.message);if(b)b.disabled=false;return;}location.replace("./index.html#student-login");}
document.addEventListener("DOMContentLoaded",()=>{
 navActive();$("signOut")?.addEventListener("click",logout);
 $("notificationButton")?.addEventListener("click",()=>notice("No new notifications."));
 loadPage().catch(e=>{console.error(e);notice(e.message||"Portal could not load.");});
});
})();
