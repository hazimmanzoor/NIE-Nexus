// Decorative layers use CSS only, with no timers, canvas loops or network assets.
const roleVisuals={student:['🎓','Student workspace'],organizer:['▣','Organizer workspace'],worker:['⚒','Worker workspace'],admin:['✦','Admin workspace']};
const art=document.querySelector('.orbit-art');
art.insertAdjacentHTML('afterbegin','<div class="login-halo"></div><div class="login-orbit orbit-three"></div><div class="login-orbit orbit-four"></div><div class="login-satellite satellite-one">✦</div><div class="login-satellite satellite-two">◷</div><div class="login-satellite satellite-three">◇</div><div class="orbit-dust"><i></i><i></i><i></i><i></i><i></i></div>');
art.insertAdjacentHTML('beforeend','<span id="orbitWorkspace" class="orbit-workspace">Student workspace</span>');
document.querySelector('.login-story').insertAdjacentHTML('beforeend','<div class="login-mesh" aria-hidden="true"></div><div class="login-streak" aria-hidden="true"></div>');
document.querySelector('.login-access').insertAdjacentHTML('beforeend','<button id="loginMotion" class="login-motion" type="button" aria-pressed="true">Animations: on</button>');
function loginMotion(on){document.documentElement.dataset.loginMotion=on?'on':'off';$('loginMotion').textContent=on?'Animations: on':'Animations: paused';$('loginMotion').setAttribute('aria-pressed',String(on));}
try{loginMotion(localStorage.getItem('nexus-login-motion')!=='off');}catch{loginMotion(true);}
$('loginMotion').onclick=()=>{const on=document.documentElement.dataset.loginMotion!=='on';loginMotion(on);try{localStorage.setItem('nexus-login-motion',on?'on':'off');}catch{}};
const beforeAnimatedRole=selectRole;
selectRole=function(role){beforeAnimatedRole(role);const visual=roleVisuals[role];document.querySelector('.orbit-core').textContent=visual[0];$('orbitWorkspace').textContent=visual[1];document.querySelector('.nexus-login').dataset.workspace=role;};selectRole(selectedRole);
const beforeAtmosphereInit=init;
init=async function(){await beforeAtmosphereInit();if(!$('lightScene'))$('app').insertAdjacentHTML('afterbegin','<div id="lightScene" class="atmosphere-scene light-scene" aria-hidden="true"><div class="aurora aurora-one"></div><div class="aurora aurora-two"></div><div class="light-grid"></div><div class="floating-geometry"><i></i><i></i><i></i><i></i></div></div><div id="darkScene" class="atmosphere-scene dark-scene" aria-hidden="true"><div class="nebula nebula-one"></div><div class="nebula nebula-two"></div><div class="star-field stars-near"></div><div class="star-field stars-far"></div><div class="constellation"></div><div class="shooting-star"></div></div>');};
