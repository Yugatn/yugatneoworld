export const CITY_VERSION="0.1";

const places=[
 {id:"company-symbiont",type:"employer",name:"Symbiont Network",x:220,y:190,description:"Technology and social infrastructure.",jobs:["job-1","job-3"]},
 {id:"company-media",type:"employer",name:"Yugatn Media",x:520,y:190,description:"Creative production.",jobs:["job-2"]},
 {id:"education-center",type:"education",name:"Learning Center",x:820,y:190,description:"Education and skills development.",jobs:[]},
 {id:"coworking",type:"coworking",name:"City Coworking",x:220,y:450,description:"Flexible work space.",jobs:[]},
 {id:"gym",type:"service",name:"Fitness Center",x:520,y:450,description:"Health and physical activity.",jobs:[]},
 {id:"yoga",type:"service",name:"Yoga Center",x:820,y:450,description:"Movement and recovery.",jobs:[]}
];

export function createCityState(){return{version:CITY_VERSION,places:places.map(p=>({...p,jobs:[...p.jobs]}))}}
export function findCityPlace(state,id){return state.places.find(p=>p.id===id)}
export function nearbyPlaces(state,x,y,r=180){return state.places.filter(p=>Math.hypot(p.x-x,p.y-y)<=r)}
