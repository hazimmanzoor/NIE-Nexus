const express=require('express'),{DatabaseSync:Database}=require('node:sqlite'),bcrypt=require('bcryptjs'),session=require('express-session'),crypto=require('crypto'),path=require('path');
const app=express(),db=new Database(path.join(__dirname,'campuspulse.db'));db.exec('PRAGMA journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,role TEXT,paid INTEGER DEFAULT 0,rate INTEGER DEFAULT 0);CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,title TEXT,category TEXT,day TEXT,venue TEXT,price INTEGER,capacity INTEGER,organizer_id INTEGER,description TEXT,start_time TEXT DEFAULT '10:00',end_time TEXT DEFAULT '12:00');CREATE TABLE IF NOT EXISTS assignments(id INTEGER PRIMARY KEY,event_id INTEGER,worker_id INTEGER,title TEXT,status TEXT DEFAULT 'Pending',hours REAL DEFAULT 0,rating INTEGER DEFAULT 0);CREATE TABLE IF NOT EXISTS registrations(id INTEGER PRIMARY KEY,event_id INTEGER,user_id INTEGER,payment TEXT DEFAULT 'demo-paid',checked_in INTEGER DEFAULT 0,UNIQUE(event_id,user_id));CREATE TABLE IF NOT EXISTS queries(id INTEGER PRIMARY KEY,user_id INTEGER,event_id INTEGER,question TEXT,answer TEXT DEFAULT '',status TEXT DEFAULT 'Pending');CREATE TABLE IF NOT EXISTS shifts(id INTEGER PRIMARY KEY,worker_id INTEGER,event_id INTEGER,day TEXT,hours REAL,approved INTEGER DEFAULT 0);CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY,event_id INTEGER,user_id INTEGER,stars INTEGER,comment TEXT);`);
if(!db.prepare('PRAGMA table_info(queries)').all().some(c=>c.name==='status'))db.exec("ALTER TABLE queries ADD COLUMN status TEXT DEFAULT 'Pending'");
db.exec("UPDATE queries SET status='Answered' WHERE answer<>'' AND status='Pending'");
const eventColumns=db.prepare('PRAGMA table_info(events)').all().map(c=>c.name);
if(!eventColumns.includes('start_time'))db.exec("ALTER TABLE events ADD COLUMN start_time TEXT DEFAULT '10:00'");
if(!eventColumns.includes('end_time'))db.exec("ALTER TABLE events ADD COLUMN end_time TEXT DEFAULT '12:00'");
// Apply sample times only once when upgrading an older database.
if(!eventColumns.includes('start_time')){
 const schedule=[['09:00','16:00'],['17:30','21:00'],['10:30','12:00'],['07:30','09:30'],['11:00','15:00'],['18:00','20:00'],['15:30','18:00'],['09:30','13:30'],['14:00','16:30'],['18:30','21:30'],['12:30','17:00'],['10:00','13:00']];
 for(const row of db.prepare('SELECT id FROM events ORDER BY id LIMIT 12').all()){
  const pair=schedule[(row.id-1)%12];db.prepare('UPDATE events SET start_time=?,end_time=? WHERE id=?').run(...pair,row.id);
 }
}
require('./workflow').migrate(db);
if(!db.prepare('SELECT id FROM users LIMIT 1').get()){
const roles=['admin','organizer','worker','student','student'];let insert=db.prepare('INSERT INTO users(name,email,password,role,paid,rate) VALUES(?,?,?,?,?,?)');for(let i=0;i<25;i++){let role=roles[Math.floor(i/5)];insert.run(`${role[0].toUpperCase()+role.slice(1)} ${(i>=20?i-14:i%5+1)}`,`${role}${i>=20?i-14:i%5+1}@demo.test`,bcrypt.hashSync('Campus123!',10),role,role==='worker'&&i%2===0?1:0,role==='worker'?150:0)}
let titles=['TechNova Hackathon','Cultural Carnival','Campus Quiz','Photography Walk','Robotics Arena','Open Mic Night','Dance Battle','Code Sprint','Entrepreneurship Summit','Music Festival','Gaming League','Design Workshop'];let ev=db.prepare('INSERT INTO events(title,category,day,venue,price,capacity,organizer_id,description,start_time,end_time,budget) VALUES(?,?,?,?,?,?,?,?,?,?,?)');titles.forEach((t,i)=>ev.run(t,['Technical','Cultural','Competition','Workshop'][i%4],`2026-12-${String(i+2).padStart(2,'0')}`,['Auditorium','Main Ground','Innovation Lab'][i%3],i===3?0:[99,149,199,249,299,399,499,699,999][i%9],100+i*10,6+i%5,'Join us for an unforgettable campus experience.',...([['09:00','16:00'],['17:30','21:00'],['10:30','12:00'],['07:30','09:30'],['11:00','15:00'],['18:00','20:00'],['15:30','18:00'],['09:30','13:30'],['14:00','16:30'],['18:30','21:30'],['12:30','17:00'],['10:00','13:00']][i]),10000));
let as=db.prepare('INSERT INTO assignments(event_id,worker_id,title,status,hours,rating) VALUES(?,?,?,?,?,?)');for(let i=0;i<24;i++)as.run(i%12+1,11+i%5,['Stage setup','Registration desk','Audio support','Crowd coordination','Decorations','Guest assistance'][i%6],['Pending','In Progress','Completed'][i%3],i%5+1,i%3===2?4+i%2:0);
let reg=db.prepare('INSERT INTO registrations(event_id,user_id,payment) VALUES(?,?,?)');for(let i=0;i<36;i++)reg.run(i%12+1,16+i%10,'demo-paid');
let shift=db.prepare('INSERT INTO shifts(worker_id,event_id,day,hours,approved,paid,rate) VALUES(?,?,?,?,?,?,?)');for(let i=0;i<18;i++)shift.run(11+i%5,i%12+1,'2026-12-02',2+i%5,i%2,db.prepare('SELECT paid FROM users WHERE id=?').get(11+i%5).paid,150);
let q=db.prepare('INSERT INTO queries(user_id,event_id,question,answer) VALUES(?,?,?,?)');for(let i=0;i<16;i++)q.run(16+i%10,i%12+1,['What is the reporting time?','Is there a dress code?','Where is the venue?','Can I bring a guest?'][i%4],i%3===0?'Please check the event details.':'');
let f=db.prepare('INSERT INTO feedback(event_id,user_id,stars,comment) VALUES(?,?,?,?)');for(let i=0;i<12;i++)f.run(i%12+1,16+i%10,3+i%3,'Great college event!');}
require('./workflow').retireOldRole(db);
app.use(express.json());app.use(session({secret:process.env.SESSION_SECRET||crypto.randomBytes(32).toString('hex'),resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',maxAge:1000*60*60*8}}));app.use(express.static(path.join(__dirname,'public')));
const safe=(fn)=>(req,res)=>{try{fn(req,res)}catch(e){res.status(400).json({error:e.message})}},requireLogin=(req,res,next)=>{const u=req.session.user&&db.prepare('SELECT id,name,role FROM users WHERE id=?').get(req.session.user.id);if(!u||!['admin','organizer','worker','student'].includes(u.role))return res.status(401).json({error:'Please sign in'});req.session.user=u;next()},allow=(...roles)=>(req,res,next)=>roles.includes(req.session.user.role)?next():res.status(403).json({error:'Access denied'});
app.get('/api/public/events',safe((req,res)=>{const fields='id,title,category,day,venue,price,capacity,description,start_time,end_time';const published="event_approval='Approved' AND budget_approval='Approved' AND fee_approval='Approved'";let rows=db.prepare('SELECT '+fields+' FROM events WHERE '+published+" AND day>=date('now') ORDER BY day,start_time LIMIT 6").all();if(!rows.length)rows=db.prepare('SELECT '+fields+' FROM events WHERE '+published+' ORDER BY day DESC,start_time LIMIT 3').all();res.json(rows);}));app.post('/api/login',safe((req,res)=>{let u=db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email);if(!u||!bcrypt.compareSync(req.body.password||'',u.password))return res.status(401).json({error:'Incorrect email or password'});if(req.body.role&&req.body.role!==u.role)return res.status(403).json({error:'This account belongs to the '+u.role+' portal. Select the matching role.'});req.session.regenerate(err=>{if(err)return res.status(500).json({error:'Could not start your session. Please try again.'});req.session.user={id:u.id,name:u.name,role:u.role};res.json(req.session.user)});}));
app.post('/api/signup',safe((req,res)=>{const {name,email,password,role}=req.body||{};if(!['student','worker'].includes(role))return res.status(403).json({error:'This role requires Admin assignment'});if(typeof name!=='string'||name.trim().length<2||name.length>80||typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<8||password.length>128)return res.status(400).json({error:'Enter a valid name, email and password of at least 8 characters'});const normalized=email.trim().toLowerCase();if(db.prepare('SELECT id FROM users WHERE lower(email)=?').get(normalized))return res.status(409).json({error:'Email already registered'});const result=db.prepare('INSERT INTO users(name,email,password,role,paid,rate) VALUES(?,?,?,?,0,0)').run(name.trim(),normalized,bcrypt.hashSync(password,10),role);req.session.user={id:Number(result.lastInsertRowid),name:name.trim(),role};res.status(201).json(req.session.user)}));
app.post('/api/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));app.get('/api/me',(req,res)=>{const u=req.session.user&&db.prepare('SELECT id,name,role FROM users WHERE id=?').get(req.session.user.id);res.json(u||null)});
app.get('/api/overview',requireLogin,safe((req,res)=>{const u=req.session.user;let data={events:require('./workflow').eventCount(db,u),registrations:db.prepare('SELECT count(*) n FROM registrations').get().n,workers:db.prepare("SELECT count(*) n FROM users WHERE role='worker'").get().n,assignments:db.prepare('SELECT count(*) n FROM assignments').get().n};res.json(data)}));
app.get('/api/users',requireLogin,allow('admin','organizer'),safe((req,res)=>res.json(db.prepare('SELECT id,name,email,role,paid,rate FROM users ORDER BY role,name').all())));
app.post('/api/register',requireLogin,allow('student'),safe((req,res)=>{let ev=db.prepare('SELECT * FROM events WHERE id=?').get(req.body.eventId);if(!ev)throw Error('Event not found');if(!require('./workflow').isPublished(ev))throw Error('This event is awaiting admin approval');let count=db.prepare('SELECT count(*) n FROM registrations WHERE event_id=?').get(ev.id).n;if(count>=ev.capacity)throw Error('Event full');db.prepare('INSERT INTO registrations(event_id,user_id,payment) VALUES(?,?,?)').run(ev.id,req.session.user.id,ev.price===0?'free':'demo-paid');res.json({ok:true,message:ev.price===0?'Free ticket confirmed':'Demo payment successful — no money charged'})}));
app.get('/api/registrations',requireLogin,safe((req,res)=>{let u=req.session.user;let sql=`SELECT r.id,r.event_id,r.user_id,r.payment,r.checked_in,e.title,e.day,e.venue,e.price,u.name attendee FROM registrations r JOIN events e ON e.id=r.event_id JOIN users u ON u.id=r.user_id`;let rows=u.role==='admin'?db.prepare(sql).all():u.role==='organizer'?db.prepare(sql+' WHERE e.organizer_id=?').all(u.id):db.prepare(sql+' WHERE r.user_id=?').all(u.id);res.json(rows)}));
app.post('/api/checkin',requireLogin,allow('admin','organizer'),safe((req,res)=>{let r=db.prepare('SELECT r.*,e.organizer_id FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.id=?').get(Number(req.body.ticketId));if(!r)throw Error('Ticket not found');if(r.checked_in)throw Error('Ticket already used');if(req.session.user.role==='organizer'&&r.organizer_id!==req.session.user.id)return res.status(403).json({error:'Not assigned event'});db.prepare('UPDATE registrations SET checked_in=1 WHERE id=?').run(r.id);res.json({ok:true})}));
app.get('/api/assignments',requireLogin,safe((req,res)=>{let u=req.session.user,sql=`SELECT a.*,e.title event,w.name worker,w.paid,w.rate FROM assignments a JOIN events e ON e.id=a.event_id JOIN users w ON w.id=a.worker_id`;res.json(u.role==='worker'?db.prepare(sql+' WHERE a.worker_id=?').all(u.id):u.role==='admin'?db.prepare(sql).all():u.role==='organizer'?db.prepare(sql+' WHERE e.organizer_id=?').all(u.id):[]) }));
app.post('/api/assignments',requireLogin,allow('admin','organizer'),safe((req,res)=>{let {event_id,worker_id,title}=req.body,ev=db.prepare('SELECT * FROM events WHERE id=?').get(event_id),w=db.prepare('SELECT * FROM users WHERE id=?').get(worker_id);if(!ev||!w||w.role!=='worker')throw Error('Invalid event or worker');if(!require('./workflow').isPublished(ev))throw Error('Event, budget and fee must be approved before assigning workers');if(req.session.user.role==='organizer'&&ev.organizer_id!==req.session.user.id)return res.status(403).json({error:'Not your event'});db.prepare('INSERT INTO assignments(event_id,worker_id,title) VALUES(?,?,?)').run(event_id,worker_id,title);res.json({ok:true})}));
app.patch('/api/assignments/:id',requireLogin,safe((req,res)=>{let a=db.prepare('SELECT a.*,e.organizer_id FROM assignments a JOIN events e ON e.id=a.event_id WHERE a.id=?').get(req.params.id),u=req.session.user;if(!a)throw Error('Not found');if(u.role==='worker'&&a.worker_id===u.id){if(!['Pending','In Progress','Completed'].includes(req.body.status))throw Error('Invalid status');db.prepare('UPDATE assignments SET status=? WHERE id=?').run(req.body.status,a.id)}else if(u.role==='admin'||u.role==='organizer'&&a.organizer_id===u.id){let rating=Number(req.body.rating);if(!Number.isInteger(rating)||rating<1||rating>5)throw Error('Rating must be 1–5');db.prepare('UPDATE assignments SET rating=? WHERE id=?').run(rating,a.id)}else return res.status(403).json({error:'Access denied'});res.json({ok:true})}));
app.get('/api/queries',requireLogin,safe((req,res)=>{
 const u=req.session.user;
 const sql=`SELECT q.*,u.name,e.title event_title FROM queries q JOIN users u ON u.id=q.user_id LEFT JOIN events e ON e.id=q.event_id`;
 let rows=u.role==='admin'?db.prepare(sql+' ORDER BY q.id DESC').all():
 u.role==='organizer'?db.prepare(sql+' WHERE e.organizer_id=? ORDER BY q.id DESC').all(u.id):
 db.prepare(sql+' WHERE q.user_id=? ORDER BY q.id DESC').all(u.id);
 res.json(rows);
}));
app.post('/api/queries',requireLogin,allow('student','worker'),safe((req,res)=>{
 const question=String(req.body.question||'').trim(), eventId=Number(req.body.eventId);
 if(!question||question.length>500)throw Error('Question must be 1–500 characters');
 if(!db.prepare('SELECT id FROM events WHERE id=?').get(eventId))throw Error('Select an event');
 db.prepare('INSERT INTO queries(user_id,event_id,question,status) VALUES(?,?,?,?)').run(req.session.user.id,eventId,question,'Pending');
 res.json({ok:true});
}));
app.patch('/api/queries/:id',requireLogin,allow('admin','organizer'),safe((req,res)=>{
 const q=db.prepare('SELECT q.*,e.organizer_id FROM queries q JOIN events e ON e.id=q.event_id WHERE q.id=?').get(Number(req.params.id));
 if(!q)throw Error('Query not found');
 if(req.session.user.role==='organizer'&&q.organizer_id!==req.session.user.id)return res.status(403).json({error:'Not your event'});
 const status=String(req.body.status||'Answered');
 if(!['Pending','Answered','Escalated','Closed'].includes(status))throw Error('Invalid status');
 const answer=String(req.body.answer||'').trim().slice(0,1000);
 if(status==='Answered'&&!answer)throw Error('Reply is required');
 db.prepare('UPDATE queries SET answer=?,status=? WHERE id=?').run(answer,status,q.id);
 res.json({ok:true});
}));
// Additive activity migration: existing installations keep their data.
db.exec(`CREATE TABLE IF NOT EXISTS activity(id INTEGER PRIMARY KEY,user_id INTEGER,event_id INTEGER,text TEXT,at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TRIGGER IF NOT EXISTS registration_activity AFTER INSERT ON registrations BEGIN INSERT INTO activity(user_id,event_id,text) VALUES(NEW.user_id,NEW.event_id,'Registered · '||(SELECT title FROM events WHERE id=NEW.event_id)); END;
CREATE TRIGGER IF NOT EXISTS checkin_activity AFTER UPDATE OF checked_in ON registrations WHEN NEW.checked_in<>OLD.checked_in BEGIN INSERT INTO activity(user_id,event_id,text) VALUES(NEW.user_id,NEW.event_id,'Checked in · '||(SELECT title FROM events WHERE id=NEW.event_id)); END;
CREATE TRIGGER IF NOT EXISTS query_activity AFTER INSERT ON queries BEGIN INSERT INTO activity(user_id,event_id,text) VALUES(NEW.user_id,NEW.event_id,'Question submitted · '||(SELECT title FROM events WHERE id=NEW.event_id)); END;
CREATE TRIGGER IF NOT EXISTS reply_activity AFTER UPDATE OF answer,status ON queries WHEN NEW.answer<>OLD.answer OR NEW.status<>OLD.status BEGIN INSERT INTO activity(user_id,event_id,text) VALUES(NEW.user_id,NEW.event_id,'Query '||NEW.status||' · '||(SELECT title FROM events WHERE id=NEW.event_id)); END;`);
app.get('/api/dashboard',requireLogin,safe((req,res)=>{
 const u=req.session.user,where=u.role==='admin'?'1=1':u.role==='organizer'?'e.organizer_id=?':'r.user_id=?',params=u.role==='admin'?[]:[u.id];
 const counts=db.prepare('SELECT count(*) registrations,coalesce(sum(r.checked_in=0),0) valid,coalesce(sum(r.checked_in=1),0) used FROM registrations r JOIN events e ON e.id=r.event_id WHERE '+where).get(...params);
 const scope=u.role==='admin'?'1=1':u.role==='organizer'?'e.organizer_id=?':'a.user_id=?';
 const activity=db.prepare('SELECT a.text,a.at FROM activity a JOIN events e ON e.id=a.event_id WHERE '+scope+' ORDER BY a.id DESC LIMIT 8').all(...params);
 res.json({...counts,activity});
}));


// Demo products and purchases are separate from event registration/entry tickets.
const studentProducts=[
 {id:'single',name:'Single Event Pass',price:99,scope:'event',benefits:['Choose one upcoming event','One pass purchase','Personal purchase receipt']},
 {id:'day',name:'Day Pass',price:249,scope:'day',benefits:['Choose an upcoming event day','Access package for that day','Personal purchase receipt']},
 {id:'festival',name:'Festival Pass',price:699,scope:'festival',benefits:['Campus festival package','Covers all currently listed upcoming dates','Personal purchase receipt']}
];
db.exec(`CREATE TABLE IF NOT EXISTS student_pass_purchases(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,product_id TEXT NOT NULL,product_name TEXT NOT NULL,price INTEGER NOT NULL,selection_key TEXT NOT NULL,event_id INTEGER,pass_day TEXT,coverage TEXT NOT NULL,payment TEXT NOT NULL DEFAULT 'demo-paid',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,product_id,selection_key));`);
app.get('/api/student-pass-catalog',requireLogin,allow('student'),safe((req,res)=>res.json(studentProducts)));
app.get('/api/student-passes',requireLogin,allow('student'),safe((req,res)=>res.json(db.prepare('SELECT * FROM student_pass_purchases WHERE user_id=? ORDER BY id DESC').all(req.session.user.id))));
app.post('/api/student-passes',requireLogin,allow('student'),safe((req,res)=>{
 const product=studentProducts.find(p=>p.id===req.body.productId);if(!product)throw Error('Choose a valid pass');
 if(req.body.confirmPurchase!==true)throw Error('Please acknowledge the purchase terms');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const upcoming=db.prepare("SELECT id,title,day FROM events WHERE day>=? AND event_approval='Approved' AND budget_approval='Approved' AND fee_approval='Approved' ORDER BY day,id").all(today);if(!upcoming.length)throw Error('No upcoming events are available for purchase');
 let eventId=null,day=null,key,coverage;
 if(product.scope==='event'){const e=upcoming.find(e=>e.id===Number(req.body.eventId));if(!e)throw Error('Choose an upcoming event');eventId=e.id;key=String(e.id);coverage=e.title+' · '+e.day;}
 else if(product.scope==='day'){day=String(req.body.passDay||'');if(!upcoming.some(e=>e.day===day))throw Error('Choose an available event day');key=day;coverage='Event day · '+day;}
 else{key='festival';coverage=upcoming[0].day+' to '+upcoming.at(-1).day+' · listed events at purchase time';}
 if(db.prepare('SELECT id FROM student_pass_purchases WHERE user_id=? AND product_id=? AND selection_key=?').get(req.session.user.id,product.id,key))return res.status(409).json({error:'You already purchased this pass. See My purchases below.'});
 const result=db.prepare('INSERT INTO student_pass_purchases(user_id,product_id,product_name,price,selection_key,event_id,pass_day,coverage) VALUES(?,?,?,?,?,?,?,?)').run(req.session.user.id,product.id,product.name,product.price,key,eventId,day,coverage);
 res.status(201).json({id:Number(result.lastInsertRowid),message:'Purchase successful. No money was charged.'});
}));
require('./workflow').install(app,db,safe,requireLogin,allow);
app.listen(3000,'0.0.0.0',()=>console.log('CampusPulse running at http://localhost:3000 (LAN: http://YOUR-IP:3000)'));
