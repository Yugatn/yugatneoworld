import { createDefaultWorld, distance } from "./domain/world.js";
import { loadWorld, saveWorld, resetWorld } from "./domain/persistence.js";
import { enterRoom } from "./domain/apartment.js";
import { getRoomCapabilities } from "./domain/room-capabilities.js";
import { EugeneMessengerAdapter } from "./integration/eugene.js";
import { SymbiontEventAdapter } from "./integration/symbiont.js";
import { createEvent } from "./integration/event-envelope.js";
import { RealtimeWorld } from "./integration/realtime.js";

const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const panel = document.querySelector("#panel");
const title = document.querySelector("#panel-title");
const desc = document.querySelector("#panel-description");
const actions = document.querySelector("#panel-actions");
const world = loadWorld(createDefaultWorld());
if (!world.apartment) world.apartment = createDefaultWorld().apartment;
const keys = new Set();
const eugene = new EugeneMessengerAdapter();
const symbiont = new SymbiontEventAdapter();
const realtime = new RealtimeWorld({ roomId: "apartment:demo", profile: { name: "Guest", avatar: "default" } });
let active = null;
let pointerId = null;
let lastPointer = null;
let lastMoveAt = 0;
let lastNetworkMoveAt = 0;

const labels = { mailbox:"📮",laptop:"💻",tv:"📺",player:"🎵",wardrobe:"👕",door:"🚪",fridge:"🧊",menu:"🍽",phone:"📱",pantry:"🛒",books:"📚",mirror:"🪞" };

function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(canvas.clientWidth*d);canvas.height=Math.round(canvas.clientHeight*d);ctx.setTransform(d,0,0,d,0,0)}
addEventListener("resize",resize); resize();
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function moveToward(point){
  const dx=point.x-world.avatar.x,dy=point.y-world.avatar.y,len=Math.hypot(dx,dy); if(len<4)return;
  const step=Math.min(len,Math.max(2.5,Math.min(canvas.clientWidth,canvas.clientHeight)*.006));
  world.avatar.x=Math.max(45,Math.min(canvas.clientWidth-45,world.avatar.x+dx/len*step));
  world.avatar.y=Math.max(75,Math.min(canvas.clientHeight-45,world.avatar.y+dy/len*step));
}
function startPointer(e){if(!panel.hidden)return;pointerId=e.pointerId;lastPointer=canvasPoint(e);canvas.setPointerCapture?.(pointerId);e.preventDefault()}
function movePointer(e){if(pointerId!==e.pointerId||!lastPointer)return;const p=canvasPoint(e),now=performance.now();if(now-lastMoveAt>=16)moveToward(p);lastMoveAt=now;lastPointer=p;e.preventDefault()}
function endPointer(e){if(pointerId!==e.pointerId)return;pointerId=null;lastPointer=null;saveWorld(world);e.preventDefault()}
canvas.addEventListener("pointerdown",startPointer,{passive:false});canvas.addEventListener("pointermove",movePointer,{passive:false});canvas.addEventListener("pointerup",endPointer,{passive:false});canvas.addEventListener("pointercancel",endPointer,{passive:false});
canvas.addEventListener("click",e=>{if(pointerId!==null)return;const p=canvasPoint(e),o=currentObjects().find(i=>distance(p,i)<=i.r+12);if(o){active=o;openPanel(o);publish("object.interacted",{}, {objectId:o.id})}});
addEventListener("keydown",e=>{keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==="e")interact()});addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
function currentObjects(){return world.objects.filter(o=>o.roomId===world.apartment.currentRoom)}
function nearest(){let b=null,bd=Infinity;for(const o of currentObjects()){const d=distance(world.avatar,o);if(d<o.r+26&&d<bd){b=o;bd=d}}return b}
function publish(type,payload={},context={}){symbiont.publish(createEvent(type,payload,{...context,worldId:"local-world",apartmentId:"local-apartment"}))}
function openRoomCapabilities(){const room=getRoomCapabilities(world.apartment.currentRoom);if(!room)return;title.textContent="🏠 "+room.title;desc.textContent="This room provides contextual capabilities.";actions.innerHTML="";for(const c of room.capabilities){const b=document.createElement("button");b.textContent=c.label;b.onclick=()=>runRoomCapability(c.id);actions.appendChild(b)}const back=document.createElement("button");back.textContent="Close";back.onclick=()=>panel.hidden=true;actions.appendChild(back);panel.hidden=false}
function interact(){const o=nearest();if(!o){if(world.apartment.currentRoom!=="livingRoom")openRoomCapabilities();return}active=o;openPanel(o);publish("object.interacted",{}, {objectId:o.id})}
function openPanel(o){title.textContent=(labels[o.type]||"◈")+" "+o.name;desc.textContent="This object is the spatial interface for its capability.";actions.innerHTML="";for(const c of o.capabilities){const b=document.createElement("button");b.textContent=c;b.onclick=()=>runCapability(o,c);actions.appendChild(b)}if(realtime.users.size){for(const user of realtime.users.values()){const b=document.createElement("button");b.textContent="Invite "+(user.profile?.name||"user")+" to visit";b.onclick=()=>realtime.invite(user.id);actions.appendChild(b)}}panel.hidden=false}
async function runRoomCapability(c){if(c==="food.delivery")desc.textContent="Food & Delivery: choose a cafe, restaurant or grocery store. Ordering requires explicit confirmation and a verified commerce connector.";else if(c==="cafe.search")desc.textContent="Cafes: connector placeholder. No real availability or prices are claimed.";else if(c==="restaurant.search")desc.textContent="Restaurants: connector placeholder. No real availability or prices are claimed.";else if(c==="grocery.search")desc.textContent="Grocery stores: connector placeholder. No external order is placed.";else if(c==="messenger")desc.textContent="Eugene Messenger capability is exposed through its adapter.";else if(c==="social")desc.textContent="eWorld social capability.";else if(c==="video")desc.textContent="Video capability.";else if(c==="music")desc.textContent="Music capability.";else if(c==="avatar.edit"){world.avatar.appearance.clothes=world.avatar.appearance.clothes==="casual"?"formal":"casual";desc.textContent="Avatar outfit changed to "+world.avatar.appearance.clothes+".";saveWorld(world)}else if(c==="furniture.edit")desc.textContent="Apartment editor is the next furniture implementation stage.";else if(c==="inventory")desc.textContent="Inventory capability.";publish(c+".requested",{}, {capability:c})}
async function runCapability(o,c){if(c==="room.enter"){enterRoom(world.apartment,o.targetRoom);world.avatar.x=180;world.avatar.y=350;panel.hidden=true;active=null;saveWorld(world);publish("room.entered",{roomId:o.targetRoom},{objectId:o.id,capability:c});return}if(c==="message.read"||c==="message.compose"){await eugene.listConversations();desc.textContent="Eugene Messenger adapter is ready; verified external transport is not connected yet."}else if(c==="messenger"||c==="social")desc.textContent="Social workspace adapter placeholder. Eugene integration stays behind its verified API contract.";else if(c==="video")desc.textContent="Video player capability placeholder.";else if(c==="music")desc.textContent="Music player capability placeholder.";else if(c==="avatar.edit"){world.avatar.appearance.clothes=world.avatar.appearance.clothes==="casual"?"formal":"casual";desc.textContent="Avatar outfit changed to "+world.avatar.appearance.clothes+".";saveWorld(world)}publish(c+".requested",{}, {objectId:o.id,capability:c})}
document.querySelector("#close-panel").onclick=()=>{panel.hidden=true;active=null};document.querySelector("#save").onclick=()=>saveWorld(world);document.querySelector("#reset").onclick=()=>{resetWorld();location.reload()};
realtime.on(event=>{if(event.type==="realtime.status"){document.querySelector("#status").textContent=event.status==="online"?"Online · "+world.apartment.rooms.find(r=>r.id===world.apartment.currentRoom)?.name:"Offline"}if(event.type==="presence.invite"){title.textContent="🏠 Invitation";desc.textContent="You have been invited to visit the apartment.";actions.innerHTML="";const b=document.createElement("button");b.textContent="Accept";b.onclick=()=>{realtime.send("room.join",{roomId:event.payload.roomId,x:180,y:350,profile:{name:"Guest",avatar:"default"}});panel.hidden=true};actions.appendChild(b);panel.hidden=false}if(event.type==="interaction.proximity"){desc.textContent="Another user interacted nearby.";panel.hidden=false}if(event.type==="user.joined"||event.type==="user.left"||event.type==="room.snapshot"){}});
realtime.connect(world.avatar);
function tick(){let dx=0,dy=0;if(keys.has("w")||keys.has("arrowup"))dy--;if(keys.has("s")||keys.has("arrowdown"))dy++;if(keys.has("a")||keys.has("arrowleft"))dx--;if(keys.has("d")||keys.has("arrowright"))dx++;if(dx||dy)moveToward({x:world.avatar.x+dx*100,y:world.avatar.y+dy*100});if(performance.now()-lastNetworkMoveAt>50){realtime.move(world.avatar.x,world.avatar.y);lastNetworkMoveAt=performance.now()}draw();requestAnimationFrame(tick)}
function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle="#26312b";ctx.fillRect(0,0,w,h);ctx.fillStyle="#35443a";ctx.fillRect(25,70,w-50,h-95);ctx.strokeStyle="#647268";ctx.lineWidth=3;ctx.strokeRect(25,70,w-50,h-95);
  const room=world.apartment.currentRoom;ctx.fillStyle="#d6dfd7";ctx.font="18px system-ui";ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillText(world.apartment.rooms.find(r=>r.id===room)?.name||room,45,105);ctx.strokeStyle="#56645b";ctx.lineWidth=2;ctx.strokeRect(60,130,w-120,h-180);
  for(const o of currentObjects()){const near=nearest()===o;ctx.fillStyle=near?"#e8d37a":"#9aa69c";ctx.beginPath();ctx.arc(o.x,o.y,near?o.r+6:o.r,0,Math.PI*2);ctx.fill();ctx.fillStyle="#172019";ctx.font="26px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(labels[o.type]||"◈",o.x,o.y);ctx.font="12px system-ui";ctx.fillText(o.name,o.x,o.y+o.r+14)}
  for(const u of realtime.users.values()){ctx.fillStyle="#f1a6cf";ctx.beginPath();ctx.arc(u.x,u.y,18,0,Math.PI*2);ctx.fill();ctx.fillStyle="#222";ctx.beginPath();ctx.arc(u.x,u.y-3,5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#eee";ctx.font="12px system-ui";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(u.profile?.name||"Guest",u.x,u.y+34);if(distance(world.avatar,u)<70){ctx.strokeStyle="#e8d37a";ctx.beginPath();ctx.arc(u.x,u.y,28,0,Math.PI*2);ctx.stroke()}}
  ctx.fillStyle="#b9d7ff";ctx.beginPath();ctx.arc(world.avatar.x,world.avatar.y,18,0,Math.PI*2);ctx.fill();ctx.fillStyle="#222";ctx.beginPath();ctx.arc(world.avatar.x,world.avatar.y-3,5,0,Math.PI*2);ctx.fill();ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle="#ddd";ctx.font="12px system-ui";ctx.fillText("You",world.avatar.x-14,world.avatar.y+34);
  const o=nearest();document.querySelector("#status").textContent=(realtime.socket?.readyState===1?"Online · ":"Offline · ")+(o?"Near: "+o.name:world.apartment.rooms.find(r=>r.id===room)?.name||room)
}
tick();
