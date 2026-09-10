// Offline JS parser - mirrors backend/app/services/parse_service.py local_parse
// Works when OFFLINE - no API needed

const HINDI_NUMBERS = {
  ek:1, do:2, teen:3, chaar:4, char:4, paanch:5, panch:5, cheh:6, chhah:6, saat:7, aath:8, nau:9, das:10,
  gyarah:11, barah:12, terah:13, chaudah:14, pandrah:15, solah:16, satrah:17, atharah:18, unnis:19, bees:20,
  tees:30, chalis:40, pachas:50, saath:60, sattar:70, assi:80, nabbe:90,
  sau:100, sou:100, hazaar:1000, hazaaar:1000, lakh:100000
}

function hindiWordsToNumber(text) {
  const low = text.toLowerCase()
  const dedh = low.includes('dedh') || low.includes('dhedh')
  const dhai = low.includes('dhai') || low.includes('adhai') || low.includes('adai')
  const paune = low.includes('paune') || low.includes('pone')
  const saade = low.includes('saade') || low.includes('sade') || low.includes('sadhe')
  let words = (low.match(/[a-z\u0900-\u097F]+/g) || [])
  words = words.filter(w=> !['saade','sade','sadhe','aadhe','aadha','adha','dedh','dhedh','dhai','adhai','adai','paune','pone','sava'].includes(w))
  let total=0, cur=0, found=false
  for (const w of words) {
    if (HINDI_NUMBERS[w]!==undefined) {
      found=true
      const v=HINDI_NUMBERS[w]
      if(v===100){ if(cur===0) cur=1; cur*=100 }
      else if(v===1000){ if(cur===0) cur=1; cur*=1000; total+=cur; cur=0 }
      else if(v===100000){ if(cur===0) cur=1; cur*=100000; total+=cur; cur=0 }
      else cur+=v
    } else if(/^\d+$/.test(w)) { found=true; cur+= parseInt(w) }
  }
  total+=cur
  let result = found && total>0 ? total : null
  if (result===null) {
    if(dedh) return 150
    if(dhai) return 250
  }
  if (result) {
    if(dedh){ if(low.includes('sau')||low.includes('sou')){ if(result===100) result=150; else if(result%100===0) result=result+50 } else if(low.includes('hazaar')){ if(result===1000) result=1500; else result+=500 } }
    else if(dhai){ if(low.includes('sau')||low.includes('sou')){ if(result===100) result=250; else result+=50 } else if(low.includes('hazaar')){ if(result===1000) result=2500; else result+=500 } }
    else if(paune){ if(low.includes('sau')||low.includes('sou')) result-=50; else if(low.includes('hazaar')) result-=500; else result=Math.floor(result*0.75) }
    else if(saade){ if(low.includes('sau')||low.includes('sou')) result+=50; else if(low.includes('hazaar')) result+=500 }
    if(low.includes('sava') && result){ if(low.includes('sau')) result+=25; else if(low.includes('hazaar')) result+=250 }
  }
  if(!result){
    if(low.includes('dedh sau')) return 150
    if(low.includes('dhai sau')||low.includes('adhai sau')) return 250
    if(low.includes('sava sau')) return 125
  }
  return result
}

function extractAmount(text){
  let m = text.match(/[\u20b9₹]?\s*([\d,]+(?:\.\d+)?)\s*(?:rupees?|rs\.?|rupaye)?/i)
  if(m){ const v=parseFloat(m[1].replace(/,/g,'')); if(v>0) return v }
  const hw=hindiWordsToNumber(text)
  if(hw) return hw
  return null
}
function extractType(text){
  const l=' '+text.toLowerCase()+' '
  const has_se=l.includes(' se ')||l.includes(' se,')
  const has_ko=l.includes(' ko ')
  const has_ne=l.includes(' ne ')
  const payCues=['wapas','mila','mile','liye','liya wapas','jama','jma','bhugtan','payment','lautaya','lautaye','chuka','chukaye','paid','vasool','vasul','wasool','de gaya','return','vaapas']
  if(has_se){
    for(const cue of ['wapas','mila','mile','jama','vasool','vasul','wasool','lautaya','chuka','bhugtan','paid','liye','liya','return']){
      if(l.includes(cue)){
        if(l.includes('udhaar liya')||l.includes('udhar liya')) return 'credit_given'
        return 'payment_received'
      }
    }
  }
  if(has_ne && (l.includes('wapas')||l.includes('vasool')||l.includes('jama')||l.includes('lautaya'))) return 'payment_received'
  for(const c of payCues){ if(l.includes(c)){ if(l.includes('udhaar diya')||l.includes('udhar diya')){ if(l.includes('wapas')||l.includes('vasool')) return 'payment_received'; return 'credit_given'} return 'payment_received'} }
  const cred=['udhaar','udhar','udhaari','baaki','lena','dena']
  for(const c of cred){ if(l.includes(c)) return 'credit_given' }
  if(l.includes('diya')||l.includes('diye')){ if(has_ko) return 'credit_given'; if(has_se||has_ne) return 'payment_received'; return 'credit_given' }
  if(l.includes('liya')||l.includes('liye')){ if(has_se) return 'payment_received'; return 'credit_given' }
  return 'credit_given'
}
function extractPhoneHint(text){
  const low=text.toLowerCase()
  if(low.includes('wale')||low.includes('wala')||low.includes('vale')){
    let m=low.match(/\b(\d{2,4})\s*(?:wale|wala|vale)\b/)
    if(m) return m[1]
    let m2=low.match(/(\d{2,4})\s*wale/)
    if(m2) return m2[1]
  }
  return null
}
function extractAmountWithPhone(text, phone_hint){
  let tmp=text
  if(phone_hint){
    tmp=tmp.replace(new RegExp(`\\b${phone_hint}\\s*(?:wale|wala|vale)\\b`,'i'),' ')
    tmp=tmp.replace(new RegExp(`\\b${phone_hint}\\b`),' ')
  }
  let m=tmp.match(/[\u20b9₹]?\s*([\d,]+(?:\.\d+)?)\s*(?:rupees?|rs\.?|rupaye)?/i)
  if(m){ const v=parseFloat(m[1].replace(/,/g,'')); if(v>0) return v }
  const hw=hindiWordsToNumber(tmp)
  if(hw) return hw
  return null
}
function extractName(text){
  const clean=text.replace(/[^\w\s\u0900-\u097F]/g,' ')
  let m=clean.match(/([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+){0,2})\s+(?:ko|se|ke|ne|ji|wale)\b/i)
  if(m){
    let name=m[1].trim()
    const stop=new Set(['aur','ko','se','ne','ke','ji','koi','yeh','woh','usko','isko','give','gave','take','took','wala','wale','wali'])
    let words=name.split(/\s+/).filter(w=>!stop.has(w.toLowerCase()) && !/^\d+$/.test(w) && w.length>1)
    const amtWords=new Set(['paanch','panch','sau','sou','hazaar','hazaaar','lakh','ek','do','teen','chaar','dedh','dhai','paune','saade','sade','hundred','thousand'])
    words=words.filter(w=>!amtWords.has(w.toLowerCase()))
    if(words.length) return words.map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ')
  }
  let m2=text.match(/\b(?:to|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\b/i)
  if(m2){ let n=m2[1].trim(); if(!/^\d+$/.test(n.replace(/\s/g,''))) return n.split(/\s+/).slice(0,2).map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ') }
  let m3=text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/)
  if(m3){ let c=m3[1].trim(); if(!['Give','Gave','Take','Took','Pay','Paid'].includes(c)) return c }
  const stops=new Set(['give','gave','take','to','for','ko','se','ne','ke','ji','aur','paanch','panch','sau','sou','hazaar','udhaar','udhar','diya','diye','wapas','mile','mila','vasool','jama'])
  for(const w of clean.trim().split(/\s+/)){ if(!stops.has(w.toLowerCase()) && !/^\d+$/.test(w) && w.length>1) return w[0].toUpperCase()+w.slice(1).toLowerCase() }
  return 'Unknown'
}

export function localParse(text){
  const phone_hint=extractPhoneHint(text)
  let amount=extractAmountWithPhone(text, phone_hint)
  if(amount===null) amount=extractAmount(text)
  if(amount===null){
    let tmp=text
    if(phone_hint) tmp=tmp.replace(new RegExp(`\\b${phone_hint}\\b`),' ')
    const nums=tmp.match(/\d+/g)
    amount= nums? parseFloat(nums[nums.length-1]):0 // last number after wale
  }
  const type=extractType(text)
  let name=extractName(text)
  if(/^\d+$/.test(name)) name='Unknown'
  return { customer_name:name, amount: Number(amount)||0, type, confidence: amount>0?0.65:0.3, raw_text:text, phone_hint }
}
export function findCandidates(name, customers, phone_hint){
  if(!name || name==='Unknown') return []
  const low=name.toLowerCase()
  let cands = customers.filter(c=> c.name.toLowerCase().includes(low))
  if(phone_hint && cands.length>1){
    const filt=cands.filter(c=> (c.phone||'').includes(phone_hint))
    if(filt.length) cands=filt
  }
  // exact match优先: if one exact, no need disambig
  const exact=cands.filter(c=>c.name.toLowerCase()===low)
  if(exact.length===1 && cands.length>1) {
    // if exact exists, prefer it; only ambiguous if multiple partial without exact
    // but if name is 'Ramesh' and we have Ramesh Kumar, that's not exact, so keep cands
  }
  if(exact.length===1 && cands.length===exact.length) return []
  // if single candidate and its name is same as search? still need?
  if(cands.length===1 && cands[0].name.toLowerCase()!==low) return cands // single partial -> suggest
  if(cands.length>1) return cands.slice(0,5)
  if(cands.length===1) return cands
  return []
}
