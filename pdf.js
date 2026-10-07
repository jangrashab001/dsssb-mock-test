'use strict';
async function exportTestPdf(state,questions,sums){
 const enc=new TextEncoder(),objects=[null],pages=[],W=595.28,H=841.89,margin=40;
 const add=v=>{objects.push(v);return objects.length-1;};
 const ascii=s=>String(s).replace(/[^\x20-\x7e]/g,' ').replace(/[\\()]/g,'\\$&');
 const text=(s,x,y,size=12)=>`BT /F1 ${size} Tf ${x} ${H-y} Td (${ascii(s)}) Tj ET\n`;
 const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),pagesId=add('');
 const page=(content,imgs=[])=>{const stream=enc.encode(content),st=add([enc.encode(`<< /Length ${stream.length} >>\nstream\n`),stream,enc.encode('\nendstream')]);const r=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R >> /XObject << ${imgs.map(([name,id])=>`/${name} ${id} 0 R`).join(' ')} >> >> /Contents ${st} 0 R >>`);pages.push(r);};
 let content=text('DSSSB IMAGE MOCK TEST - SELF ANALYSIS',margin,55,18)+text('Correct: +1 | Wrong: -'+state.penalty+' | Unanswered: 0',margin,85);
 const duration=state.finishedAt-state.startedAt;
 content+=text('Score: '+sums.reduce((a,s)=>a+s.score,0).toFixed(2)+' / 100',margin,115,14)+text('Total time: '+fmt(duration)+' | Extra time: '+fmt(Math.max(0,duration-3600000)),margin,140);
 content+=text(state.title||'Image mock test',margin,160,12);let y=190;content+=text('SECTION                         SCORE    RIGHT / WRONG / BLANK    TIME',margin,y,10);y+=30;
 sums.forEach(s=>{content+=text(s.name,margin,y,12);y+=22;content+=text(`Score ${s.score.toFixed(2)} | Correct ${s.correct} | Wrong ${s.wrong} | Blank ${s.blank} | Time ${fmt(s.ms)}`,margin,y,11);y+=40;});
 content+=text('Section times include breaks while that section was open.',margin,y+15,11);content+=text('Question images and answer letters follow in the order attempted.',margin,y+38,11);page(content);
 const cache=new Map();
 async function getImage(src){src=ASSETS[src]||src;if(cache.has(src))return cache.get(src);const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);const b64=c.toDataURL('image/jpeg',.9).split(',')[1],bin=atob(b64),bytes=Uint8Array.from(bin,ch=>ch.charCodeAt(0));const id=add([enc.encode(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`),bytes,enc.encode('\nendstream')]);const value={id,w:c.width,h:c.height};cache.set(src,value);return value;}
 const seenPassage=new Set();
 for(let i=0;i<questions.length;i++){
  const {q,a}=questions[i];await prepareImages(q);let sources=[];
  if(q.passage&&!seenPassage.has(q.group)){sources.push(...q.passage.map(src=>({src,passage:true})));seenPassage.add(q.group);}
  sources.push(...q.images.map(src=>({src,passage:false})));
  for(let part=0;part<sources.length;part++){
   const {src,passage}=sources[part],im=await getImage(src),w=Math.min(W-2*margin,im.w),h=im.h*w/im.w,scale=Math.min(1,(H-155)/h),rw=w*scale,rh=h*scale;
   let c=text(`Question ${i+1} - ${SECTIONS[q.section]}`,margin,42,13);
   c+=text(`Your answer: ${a||'Unanswered'} | Correct answer: ${q.answer} | ${a===q.answer?'CORRECT':a?'WRONG':'UNANSWERED'}`,margin,65,11);
   c+=text(passage?'Shared comprehension passage':`Original question image${q.images.length>1?' (part '+(sources.filter((v,j)=>j<=part&&!v.passage).length)+')':''}`,margin,85,11);
   c+=`q ${rw} 0 0 ${rh} ${margin} ${H-105-rh} cm /Im Do Q\n`;
   c+=text(`Source: ${q.source} | Original question ${q.number} | PDF pages ${q.sourcePages.join(', ')}`,margin,H-25,9);page(c,[['Im',im.id]]);
  }
  if(i%5===0){const status=document.getElementById('export-status');if(status)status.textContent=`Preparing PDF: ${i+1} / ${questions.length} questions`;await new Promise(r=>setTimeout(r,0));}
 }
 objects[pagesId]=`<< /Type /Pages /Kids [${pages.map(p=>p+' 0 R').join(' ')}] /Count ${pages.length} >>`;
 const catalog=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`),chunks=[enc.encode('%PDF-1.4\n%image-test\n')],offsets=[0];let offset=chunks[0].length;
 for(let i=1;i<objects.length;i++){offsets.push(offset);const arr=[enc.encode(`${i} 0 obj\n`),...(Array.isArray(objects[i])?objects[i]:[enc.encode(objects[i])]),enc.encode('\nendobj\n')];arr.forEach(b=>{chunks.push(b);offset+=b.length;});}
 const xref=offset;chunks.push(enc.encode(`xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`));
 const url=URL.createObjectURL(new Blob(chunks,{type:'application/pdf'})),link=document.createElement('a');link.href=url;link.download='DSSSB-Test-With-Answers.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
