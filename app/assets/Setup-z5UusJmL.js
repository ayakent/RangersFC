import{c as R,r as d,j as e,u as k,a as E,b as C,d as N,P as h,B as g,C as m,e as y,f as U,s as O,E as B,i as I,g as L,h as P,k as V,l as z,m as F}from"./index-BAzg4Cfq.js";/**
 * @license lucide-react v1.52.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D={name:"copy",size:24,node:[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]};D.node;const K=R(D),q=t=>{let n="";return t.forEach(o=>{n+=String.fromCharCode(o)}),btoa(n).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},v=t=>Uint8Array.from(atob(t.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-t.length%4)%4)),n=>n.charCodeAt(0)),M=t=>{try{const n=v(t.trim());return n.length===65&&n[0]===4}catch{return!1}};async function G(t=crypto.subtle){const n=await t.generateKey({name:"ECDSA",namedCurve:"P-256"},!0,["sign","verify"]),o=await t.exportKey("jwk",n.privateKey),s=new Uint8Array(65);return s[0]=4,s.set(v(o.x),1),s.set(v(o.y),33),{publicKey:q(s),privateKey:o.d}}function $(t,n){return`-- Rangers App: send push alerts every minute. Safe to run again.
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'rangers-send-push';
select cron.schedule('rangers-send-push', '* * * * *', $job$
  select net.http_post(url := '${t.replace(/\/$/,"")}/functions/v1/send-push',
    headers := '{"Authorization": "Bearer ${n}", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $job$);
select * from public.rangers_health();`}const J=`// Rangers App: keeps coaches' videos in this Google account's Drive (free: uses this account's 15 GB).
// Set it up with the CLUB's Google account, not a personal one, so the videos stay with the club.
// The app shows these steps with every value filled in: Settings, Videos in Google Drive.
// 1. script.google.com > New project. Paste this whole file over Code.gs.
// 2. Project Settings (gear) > tick "Show appsscript.json manifest file". Back in Editor, open appsscript.json and
//    paste the manifest from the app. It limits this script to the files it makes itself: it cannot open anything
//    else in this Drive.
// 3. Choose "setup" at the top and press Run. Allow access (Advanced > Go to project, if Google warns you).
// 4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy. Copy the Web app URL into the app.
// Every upload and removal is checked with the person's own sign-in to the Rangers App (coaches only),
// so the web app link is safe to have in the app.
const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
const FOLDER_NAME = 'Rangers App videos';
const MAX_BYTES = 1024 * 1024 * 1024;   // one video at most 1 GB
const KEEP_FREE = 300 * 1024 * 1024;    // leave room in the account for its own email
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

/** Run once from the editor: asks for permission and makes the folder. */
function setup() {
  const id = folderId_();
  console.log('Ready. Videos go into the Drive folder "' + FOLDER_NAME + '" (' + id + '). Now Deploy > New deployment.');
}

function doGet() { return out_({ ok: true, app: 'rangers-videos', v: 1 }); }

function doPost(e) {
  try {
    const r = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (r.a === 'start') return out_(start_(r));
    if (r.a === 'chunk') return out_(chunk_(r));
    if (r.a === 'status') return out_(status_(r));
    if (r.a === 'delete') return out_(remove_(r));
    if (r.a === 'space') return out_(space_(r));
    return out_({ error: 'unknown' });
  } catch (err) {
    return out_({ error: String((err && err.message) || err).slice(0, 300) });
  }
}

/** Starts an upload: checks the person, the size and the free space, then opens a Drive upload session. */
function start_(r) {
  if (!allowed_(r.token, 'upload')) return { error: 'not-allowed' };
  const size = Number(r.size); const type = String(r.type || '').split(';')[0];
  if (!(size > 0)) return { error: 'empty' };
  if (size > MAX_BYTES) return { error: 'too-big' };
  if (!/^video\\/[a-z0-9.+-]+$/.test(type)) return { error: 'not-video' };
  const q = quota_();
  if (q && q.free !== null && q.free < size + KEEP_FREE) return { error: 'full' };
  const ext = /^[a-z0-9]{2,4}$/.test(String(r.ext || '')) ? r.ext : 'mp4';
  // A plain name: never a child's name in Drive.
  const name = 'Rangers video ' + Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd HHmm') + ' ' + Utilities.getUuid().slice(0, 6) + '.' + ext;
  const res = UrlFetchApp.fetch(UPLOAD + '/files?uploadType=resumable&fields=id', {
    method: 'post', contentType: 'application/json; charset=UTF-8', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(size) },
    payload: JSON.stringify({ name: name, parents: [folderId_()], description: 'Added in the Rangers App' }),
  });
  const at = header_(res, 'Location');
  if (res.getResponseCode() !== 200 || !at) return { error: 'drive: ' + res.getResponseCode() };
  const id = Utilities.getUuid();
  CacheService.getScriptCache().put('up:' + id, JSON.stringify({ at: at, size: size }), 21600);
  return { upload: id };
}

/** One piece of the video (base64), sent on to Drive. Answers with where to carry on, or the finished file. */
function chunk_(r) {
  const u = session_(r.upload); if (!u) return { error: 'expired' };
  const bytes = Utilities.base64Decode(String(r.data || ''));
  const from = Number(r.from);
  if (!(from >= 0) || !bytes.length || from + bytes.length > u.size) return { error: 'bad-range' };
  const res = UrlFetchApp.fetch(u.at, {
    method: 'put', payload: bytes, contentType: 'application/octet-stream', muteHttpExceptions: true, followRedirects: false,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'Content-Range': 'bytes ' + from + '-' + (from + bytes.length - 1) + '/' + u.size },
  });
  return after_(r.upload, res);
}

/** After a lost connection: asks Drive how much it already has. */
function status_(r) {
  const u = session_(r.upload); if (!u) return { error: 'expired' };
  const res = UrlFetchApp.fetch(u.at, {
    method: 'put', payload: '', muteHttpExceptions: true, followRedirects: false,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'Content-Range': 'bytes */' + u.size },
  });
  return after_(r.upload, res);
}

function after_(upload, res) {
  const code = res.getResponseCode();
  if (code === 308) { const range = header_(res, 'Range'); return { next: range ? Number(String(range).split('-')[1]) + 1 : 0 }; }
  if (code === 200 || code === 201) {
    const f = JSON.parse(res.getContentText());
    // Anyone with the link can watch (like an unlisted YouTube video). The link is only shown inside the app.
    UrlFetchApp.fetch(API + '/files/' + f.id + '/permissions', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, payload: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
    CacheService.getScriptCache().remove('up:' + upload);
    return { file: f.id };
  }
  return { error: 'drive: ' + code };
}

/** Moves a video to this Drive's bin (Google keeps it there for 30 days, in case it was a mistake). */
function remove_(r) {
  const id = String(r.file || '');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(id)) return { error: 'bad-file' };
  if (!allowed_(r.token, 'delete', id)) return { error: 'not-allowed' };
  const res = UrlFetchApp.fetch(API + '/files/' + id, {
    method: 'patch', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, payload: JSON.stringify({ trashed: true }),
  });
  const code = res.getResponseCode();
  return code === 200 || code === 404 ? { ok: true } : { error: 'drive: ' + code };
}

/** How much space is left (for coaches, shown in the app). */
function space_(r) {
  if (!allowed_(r.token, 'upload')) return { error: 'not-allowed' };
  const q = quota_();
  return q ? { used: q.used, free: q.free } : { error: 'unknown' };
}

/** Asks the Rangers database, with the person's own sign-in, whether they may do this. */
function allowed_(token, action, file) {
  if (!token || typeof token !== 'string') return false;
  const res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/rpc/drive_ok', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ action: action, file_id: file || null }),
  });
  return res.getResponseCode() === 200 && String(res.getContentText()).trim() === 'true';
}

function quota_() {
  const res = UrlFetchApp.fetch(API + '/about?fields=storageQuota', { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
  if (res.getResponseCode() !== 200) return null;
  const q = JSON.parse(res.getContentText()).storageQuota || {};
  const used = Number(q.usage || 0);
  return { used: used, free: q.limit ? Number(q.limit) - used : null };
}

function folderId_() {
  const p = PropertiesService.getScriptProperties(); const known = p.getProperty('FOLDER');
  if (known) return known;
  const res = UrlFetchApp.fetch(API + '/files?fields=id', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  if (res.getResponseCode() !== 200) throw new Error('Could not make the folder: ' + res.getContentText().slice(0, 200));
  const id = JSON.parse(res.getContentText()).id; p.setProperty('FOLDER', id);
  return id;
}

function session_(id) { const v = id && CacheService.getScriptCache().get('up:' + id); return v ? JSON.parse(v) : null; }
function header_(res, name) { const h = res.getAllHeaders(); const k = Object.keys(h).find(function (x) { return x.toLowerCase() === name.toLowerCase(); }); return k ? h[k] : ''; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
`,Y=`{
  "timeZone": "Asia/Manila",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" }
}
`,H=`// Supabase Edge Function (Deno). Sends due rows from notification_queue as Web Push messages.
// Scheduled every minute with pg_cron + pg_net (the app's Settings, Push alerts, gives the SQL).
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase. Tested on Deno 2.1 against the local stack and a pretend push service
// (the alert decrypts, the VAPID signature verifies); not yet against a live Supabase project.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async () => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const { data: due } = await db.from('notification_queue').select('*').is('sent_at', null).lte('send_at', new Date().toISOString()).limit(200);
  let sent = 0, dead = 0;
  for (const n of due ?? []) {
    const { data: subs } = await db.from('push_subscriptions').select('*').eq('user_id', n.user_id);
    for (const s of subs ?? []) {
      try {
        // high urgency: phones deliver it straight away, even when asleep; kept for a day if the phone is off
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.id }), { urgency: 'high', TTL: 86400 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        console.error('push failed', code ?? '', String((e as Error).message ?? e).slice(0, 200));   // shows in Supabase, Edge Functions, Logs
        if (code === 404 || code === 410) { await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint); dead++; }
      }
    }
    await db.from('notification_queue').update({ sent_at: new Date().toISOString() }).eq('id', n.id);
  }
  return new Response(JSON.stringify({ due: due?.length ?? 0, sent, dead }), { headers: { 'content-type': 'application/json' } });
});
`;function a({label:t,value:n,rows:o=1,secret:s}){const[u,c]=d.useState(!1),l=async()=>{try{await navigator.clipboard.writeText(n),c(!0),setTimeout(()=>c(!1),2e3)}catch{c(!1)}};return e.jsxs("div",{className:"grid gap-1",children:[e.jsx("span",{className:"text-sm font-semibold",children:t}),o>1?e.jsx("textarea",{className:"field py-2 font-mono text-xs",rows:o,readOnly:!0,value:n,"aria-label":t,onFocus:p=>p.currentTarget.select()}):e.jsx("input",{className:"field font-mono text-xs",readOnly:!0,value:n,"aria-label":t,onFocus:p=>p.currentTarget.select()}),e.jsxs("button",{className:"btn ghost min-h-[44px]",onClick:()=>void l(),children:[e.jsx(K,{size:16,"aria-hidden":"true"}),u?"Copied":"Copy",s?" (paste it only into Supabase)":""]})]})}const i=({n:t,title:n,children:o})=>e.jsxs(m,{className:"mb-3 grid gap-2",children:[e.jsxs("h3",{className:"text-lg font-bold",children:[t,". ",n]}),o]}),f=({href:t,children:n})=>e.jsxs("a",{className:"underline",href:t,target:"_blank",rel:"noreferrer",children:[n,e.jsx(B,{size:12,className:"ml-1 inline","aria-hidden":"true"})]}),T=e.jsx(m,{children:e.jsx("p",{children:"This needs sign-in (accounts) switched on for the club first."})});function Q(){const t=k(),n=E(),o=C(),[s,u]=d.useState(t.settings.driveUrl??""),[c,l]=d.useState(""),p=J.replace("__SUPABASE_URL__",y.url).replace("__SUPABASE_ANON_KEY__",y.anon),j=async()=>{if(l("Checking..."),!I(s)){l("That is not a web app link. It starts with https://script.google.com/macros/s/ and ends with /exec.");return}if(!await L(s.trim())){l('No answer from that link. Check step 5: Who has access must be "Anyone".');return}P(b=>({...b,settings:{...b.settings,driveUrl:s.trim()}}));const r=await V(F(s.trim()),await z()).catch(()=>null);l(r?`Connected. Coaches can now upload videos in the app.${r.free!==null?` ${(r.free/1073741824).toFixed(1)} GB free in the club's Drive.`:""}`:"Connected, but the script could not check your sign-in. Run the latest update.sql in Supabase, then press Check again.")};return!N||o.status!=="ready"?e.jsx(h,{title:"Videos in Google Drive",back:e.jsx(g,{to:"/settings"}),children:T}):n!=="admin"?e.jsx(h,{title:"Videos in Google Drive",back:e.jsx(g,{to:"/settings"}),children:e.jsx(m,{children:e.jsx("p",{children:"Only a club admin can set this up."})})}):e.jsxs(h,{title:"Videos in Google Drive",back:e.jsx(g,{to:"/settings"}),children:[e.jsxs(m,{className:"mb-3 grid gap-2",children:[e.jsx("p",{children:"Coaches upload videos inside the app; they are kept in the club's Google Drive (free, 15 GB) and play here in the app. About 10 minutes, once, on a computer."}),e.jsxs("p",{className:"text-sm",children:[e.jsx("b",{children:"Use the club's Google account"}),", not a personal one, so the videos stay with the club when people change. The script can only open the files it makes itself, nothing else in that Drive."]})]}),e.jsxs(i,{n:1,title:"Make the script",children:[e.jsxs("p",{children:["Sign in to Google with the club account, open ",e.jsx(f,{href:"https://script.google.com/home/projects/create",children:"script.google.com, New project"}),', and name it "Rangers videos". Delete what is in Code.gs and paste this:']}),e.jsx(a,{label:"The script (Code.gs)",value:p,rows:5})]}),e.jsxs(i,{n:2,title:"Limit what it can open",children:[e.jsxs("p",{children:["Click the gear (Project Settings) and tick ",e.jsx("b",{children:'Show "appsscript.json" manifest file'}),". Go back to the Editor, open ",e.jsx("b",{children:"appsscript.json"}),", delete what is there and paste:"]}),e.jsx(a,{label:"appsscript.json",value:Y.trim(),rows:4})]}),e.jsxs(i,{n:3,title:"Run setup once",children:[e.jsxs("p",{children:["At the top, choose ",e.jsx("b",{children:"setup"})," and press ",e.jsx("b",{children:"Run"}),`. Google asks for permission: Review permissions, choose the club account. If it says "Google hasn't verified this app": Advanced, then Go to Rangers videos. It is your own script. Allow.`]}),e.jsx("p",{className:"muted text-sm",children:'It makes a Drive folder called "Rangers App videos".'})]}),e.jsxs(i,{n:4,title:"Publish it as a web app",children:[e.jsxs("p",{children:[e.jsx("b",{children:"Deploy"}),", ",e.jsx("b",{children:"New deployment"}),', the gear next to "Select type", ',e.jsx("b",{children:"Web app"}),". Execute as: ",e.jsx("b",{children:"Me"}),". Who has access: ",e.jsx("b",{children:"Anyone"}),". Deploy, then copy the ",e.jsx("b",{children:"Web app URL"}),"."]}),e.jsx("p",{className:"muted text-sm",children:'"Anyone" is needed because families and coaches do not sign in to Google. Every upload and removal is still checked with their Rangers sign-in: only coaches can upload.'})]}),e.jsxs(i,{n:5,title:"Paste the link here",children:[e.jsxs("label",{className:"grid gap-1 text-sm font-semibold",children:["Web app URL",e.jsx("input",{className:"field",inputMode:"url",placeholder:"https://script.google.com/macros/s/.../exec",value:s,onChange:r=>u(r.target.value)})]}),e.jsx("button",{className:"btn",onClick:()=>void j(),children:"Check and save"}),c&&e.jsx("p",{role:"status",children:c})]}),e.jsx("p",{className:"muted text-sm",children:"Changed the script later? Deploy, Manage deployments, the pencil, Version: New version, Deploy. The link stays the same."})]})}function X(){var w;const t=k(),n=E(),o=C(),[s,u]=d.useState(null),[c,l]=d.useState(""),[p,j]=d.useState(""),r=(s==null?void 0:s.publicKey)??t.settings.vapidPublic??"";d.useEffect(()=>()=>u(null),[]);const b=async()=>{if(t.settings.vapidPublic&&!confirm("Make new keys? Alerts stop on every phone until each person taps Turn on alerts again. Only do this if the private key was lost."))return;const A=await G();u(A),P(_=>({..._,settings:{..._.settings,vapidPublic:A.publicKey}}))};if(!N||o.status!=="ready")return e.jsx(h,{title:"Push alerts",back:e.jsx(g,{to:"/settings"}),children:T});if(n!=="admin")return e.jsx(h,{title:"Push alerts",back:e.jsx(g,{to:"/settings"}),children:e.jsx(m,{children:e.jsx("p",{children:"Only a club admin can set this up."})})});const S=(w=y.url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/))==null?void 0:w[1],x=S?`https://supabase.com/dashboard/project/${S}`:"https://supabase.com/dashboard";return e.jsxs(h,{title:"Push alerts",back:e.jsx(g,{to:"/settings"}),children:[e.jsx(m,{className:"mb-3",children:e.jsx("p",{children:"Alerts pop up on phones for announcements, messages, new tasks and the day before events, even when the app is closed. Free. About 15 minutes, once, best on a computer."})}),e.jsxs(i,{n:1,title:"Make the alert keys",children:[r&&!s&&e.jsxs("p",{className:"text-sm",children:["Keys were made already",M(r)?"":" (but the public key looks wrong)",". If you still have the private key in Supabase, skip to step 3."]}),e.jsx("button",{className:"btn",onClick:()=>void b(),children:r?"Make new keys":"Make the keys"}),s&&e.jsxs(e.Fragment,{children:[e.jsx(a,{label:"Public key",value:s.publicKey}),e.jsx(a,{label:"Private key (secret)",value:s.privateKey,secret:!0}),e.jsx("p",{className:"text-sm text-red",children:"The private key is shown only now. Paste it into Supabase in step 2 and nowhere else: not in chat, email or GitHub."})]})]}),e.jsxs(i,{n:2,title:"Put the keys in Supabase",children:[e.jsxs("p",{children:["Open ",e.jsx(f,{href:`${x}/functions/secrets`,children:"Supabase, Edge Functions, Secrets"})," and add these three (name, then value):"]}),e.jsx(a,{label:"Name 1",value:"VAPID_PUBLIC_KEY"}),r&&e.jsx(a,{label:"Value 1 (public key)",value:r}),e.jsx(a,{label:"Name 2",value:"VAPID_PRIVATE_KEY"}),e.jsx("p",{className:"muted text-sm",children:"Value 2: the private key from step 1."}),e.jsx(a,{label:"Name 3",value:"VAPID_SUBJECT"}),e.jsx(a,{label:"Value 3",value:`mailto:${o.email||"admin@rangersfc.net"}`})]}),e.jsxs(i,{n:3,title:"Add the sending function",children:[e.jsxs("p",{children:["Open ",e.jsx(f,{href:`${x}/functions`,children:"Supabase, Edge Functions"}),", ",e.jsx("b",{children:"Deploy a new function"}),", ",e.jsx("b",{children:"Via Editor"}),". Name it exactly ",e.jsx("b",{children:"send-push"}),". Delete the example code, paste this, then ",e.jsx("b",{children:"Deploy function"}),":"]}),e.jsx(a,{label:"The function code",value:H,rows:5})]}),e.jsxs(i,{n:4,title:"Send alerts every minute",children:[e.jsxs("p",{children:["In ",e.jsx(f,{href:`${x}/database/extensions`,children:"Database, Extensions"})," turn on ",e.jsx("b",{children:"pg_net"})," (pg_cron is on already). Then ",e.jsx(f,{href:`${x}/sql/new`,children:"SQL Editor, New query"}),': paste this and Run. The last line, "Push alerts sending", should say true.']}),e.jsx(a,{label:"SQL",value:$(y.url,y.anon),rows:5})]}),e.jsxs(i,{n:5,title:"Try it on this phone",children:[e.jsx("button",{className:"btn",onClick:async()=>l(await U()),children:"Turn on alerts on this phone"}),c&&e.jsx("p",{role:"status",children:c}),e.jsx("button",{className:"btn ghost",onClick:async()=>j(await O()),children:"Send me a test alert"}),p&&e.jsx("p",{role:"status",children:p}),e.jsx("p",{className:"muted text-sm",children:"Then ask each coach and family to tap More, Alerts and sound, Turn on alerts. On iPhone they must first add the app to the Home Screen (Share, Add to Home Screen) and open it from there."})]})]})}export{a as CopyBox,Q as DriveSetup,X as PushSetup};
