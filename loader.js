'use strict';
window.ASSETS={};const packLoads=new Map();
function loadPack(name){if(!name)return Promise.resolve();if(packLoads.has(name))return packLoads.get(name);const task=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='packs/'+name+'.js';s.onload=()=>resolve();s.onerror=()=>{packLoads.delete(name);s.remove();reject(new Error('Question pack could not be loaded. Keep the packs folder next to index.html.'));};document.body.appendChild(s);});packLoads.set(name,task);return task;}
async function prepareImages(q){await loadPack(q.pack);if(![...q.images,...(q.passage||[])].every(p=>ASSETS[p]))throw new Error('Question image is missing from its pack.');}
