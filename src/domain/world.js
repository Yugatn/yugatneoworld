import { createApartment } from "./apartment.js";
import { createInventory } from "./inventory.js";
import { createSmartHome } from "./smart-home.js";
import { createAvatarState, toLegacyAppearance } from "./avatar.js";
import { createOrderBook } from "./commerce.js";
import { createScheduleState } from "./schedule.js";
import { createClassesState } from "./classes.js";

export const WORLD_VERSION = 9;

export function createDefaultWorld() {
  const avatarState = createAvatarState();
  return {
    version: WORLD_VERSION,
    avatar: {
      x: 180,
      y: 220,
      appearance: toLegacyAppearance(avatarState)
    },
    avatarState,
    inventory: createInventory(),
    apartment: createApartment(),
    smartHome: createSmartHome(),
    commerce: createOrderBook(),
    /** Sims-like life: lessons, training reminders */
    schedule: createScheduleState(),
    /** Classes + product presentations */
    classes: createClassesState(),
    objects: [
      // —— Гостиная (livingRoom) ——
      { id:"mailbox",roomId:"livingRoom",type:"mailbox",name:"Mailbox",x:130,y:120,r:38,capabilities:["message.read","message.compose"] },
      { id:"laptop",roomId:"livingRoom",type:"laptop",name:"Laptop",x:360,y:130,r:42,capabilities:["messenger","social","employment","shop.browse","class.manage","presentation.host"] },
      { id:"tv",roomId:"livingRoom",type:"tv",name:"Television",x:620,y:125,r:45,capabilities:["video","smarthome.tv","presentation.view"] },
      { id:"player",roomId:"livingRoom",type:"player",name:"Music Player",x:820,y:130,r:42,capabilities:["music","smarthome.music"] },
      { id:"sofa",roomId:"livingRoom",type:"sofa",name:"Sofa",x:480,y:320,r:50,capabilities:["social.relax","video"] },
      { id:"thermostat",roomId:"livingRoom",type:"thermostat",name:"Thermostat",x:250,y:380,r:36,capabilities:["smarthome.climate"] },
      { id:"light-switch",roomId:"livingRoom",type:"switch",name:"Light switch",x:90,y:280,r:34,capabilities:["smarthome.lights"] },
      { id:"kitchen",roomId:"livingRoom",type:"door",name:"Kitchen",x:930,y:500,r:42,targetRoom:"kitchen",capabilities:["room.enter"] },
      { id:"study",roomId:"livingRoom",type:"door",name:"Study",x:80,y:500,r:42,targetRoom:"study",capabilities:["room.enter"] },
      { id:"bedroom",roomId:"livingRoom",type:"door",name:"Bedroom",x:500,y:500,r:42,targetRoom:"bedroom",capabilities:["room.enter"] },
      { id:"bathroom-door",roomId:"livingRoom",type:"door",name:"Bathroom",x:320,y:500,r:42,targetRoom:"bathroom",capabilities:["room.enter"] },
      { id:"kids-door",roomId:"livingRoom",type:"door",name:"Kids room",x:680,y:500,r:42,targetRoom:"kidsRoom",capabilities:["room.enter"] },
      { id:"company-portal",roomId:"livingRoom",type:"portal",name:"City & Work",x:860,y:500,r:42,capabilities:["street.enter"]},
      // —— Кухня ——
      { id:"fridge",roomId:"kitchen",type:"fridge",name:"Refrigerator",x:170,y:150,r:45,capabilities:["food.delivery","grocery.search","supplies.view"] },
      { id:"menu-board",roomId:"kitchen",type:"menu",name:"Food Menu",x:390,y:150,r:42,capabilities:["cafe.search","restaurant.search"] },
      { id:"phone",roomId:"kitchen",type:"phone",name:"Delivery Phone",x:650,y:150,r:40,capabilities:["food.delivery","shop.browse"] },
      { id:"pantry",roomId:"kitchen",type:"pantry",name:"Pantry",x:850,y:150,r:42,capabilities:["grocery.search","supplies.view"] },
      { id:"recipe-book",roomId:"kitchen",type:"book",name:"Recipe book",x:520,y:280,r:40,capabilities:["recipe.list","recipe.order"] },
      { id:"kitchen-switch",roomId:"kitchen",type:"switch",name:"Kitchen light",x:100,y:280,r:34,capabilities:["smarthome.lights"] },
      // —— Кабинет ——
      { id:"study-laptop",roomId:"study",type:"laptop",name:"Work Laptop",x:350,y:160,r:42,capabilities:["messenger","social","employment","shop.browse","class.manage","presentation.host"] },
      { id:"study-books",roomId:"study",type:"books",name:"Bookshelf",x:720,y:160,r:42,capabilities:["books","education"] },
      { id:"presentation-board",roomId:"study",type:"board",name:"Presentation board",x:500,y:300,r:44,capabilities:["presentation.host","presentation.view","class.manage"] },
      { id:"study-switch",roomId:"study",type:"switch",name:"Study light",x:100,y:280,r:34,capabilities:["smarthome.lights"] },
      // —— Спальня ——
      { id:"wardrobe",roomId:"bedroom",type:"wardrobe",name:"Wardrobe",x:300,y:160,r:45,capabilities:["avatar.edit","avatar.clothes"] },
      { id:"mirror",roomId:"bedroom",type:"mirror",name:"Mirror",x:650,y:160,r:42,capabilities:["avatar.edit","avatar.shave"] },
      { id:"bedroom-switch",roomId:"bedroom",type:"switch",name:"Bedroom light",x:100,y:280,r:34,capabilities:["smarthome.lights"] },
      // —— Ванная ——
      { id:"bath",roomId:"bathroom",type:"bath",name:"Bathtub",x:200,y:180,r:48,capabilities:["bathroom.use","shop.bathroom"] },
      { id:"shower",roomId:"bathroom",type:"shower",name:"Shower",x:450,y:180,r:42,capabilities:["bathroom.use","avatar.wet"] },
      { id:"bath-sink",roomId:"bathroom",type:"sink",name:"Sink",x:700,y:160,r:40,capabilities:["avatar.shave","bathroom.use"] },
      { id:"cabinet",roomId:"bathroom",type:"cabinet",name:"Bathroom cabinet",x:850,y:200,r:40,capabilities:["shop.bathroom","supplies.view"] },
      { id:"toilet",roomId:"bathroom",type:"toilet",name:"Toilet",x:320,y:380,r:36,capabilities:["bathroom.use"] },
      { id:"bathroom-switch",roomId:"bathroom",type:"switch",name:"Bathroom light",x:100,y:280,r:34,capabilities:["smarthome.lights"] },
      // —— Детская ——
      { id:"kids-bed",roomId:"kidsRoom",type:"bed",name:"Kids bed",x:200,y:180,r:48,capabilities:["kids.rest"] },
      { id:"toy-box",roomId:"kidsRoom",type:"toys",name:"Toy box",x:450,y:160,r:42,capabilities:["kids.play","inventory"] },
      { id:"kids-desk",roomId:"kidsRoom",type:"desk",name:"Study desk",x:720,y:160,r:42,capabilities:["education","kids.stories","schedule.view"] },
      { id:"kids-shelf",roomId:"kidsRoom",type:"books",name:"Kids bookshelf",x:850,y:300,r:40,capabilities:["kids.stories","education"] },
      { id:"kids-calendar",roomId:"kidsRoom",type:"calendar",name:"Kids calendar",x:300,y:320,r:40,capabilities:["schedule.view","schedule.edit","lesson.remind"] },
      { id:"kids-rug",roomId:"kidsRoom",type:"rug",name:"Play rug",x:400,y:360,r:50,capabilities:["kids.play"] },
      { id:"kids-switch",roomId:"kidsRoom",type:"switch",name:"Kids room light",x:100,y:280,r:34,capabilities:["smarthome.lights"] }
    ]
  };
}

export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
