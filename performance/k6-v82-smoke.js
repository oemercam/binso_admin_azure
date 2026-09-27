import http from 'k6/http'
import { check, sleep } from 'k6'

export const options={vus:Number(__ENV.VUS||5),duration:__ENV.DURATION||'30s',thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<1000']}}
const base=__ENV.BASE_URL
const cookie=__ENV.SESSION_COOKIE
if(!base) throw new Error('BASE_URL required')

export default function v82Smoke(){
  const headers=cookie?{Cookie:cookie}:{}
  const health=http.get(`${base}/api/health/ready`,{headers})
  check(health,{'ready 200':r=>r.status===200})
  if(cookie){
    const customers=http.get(`${base}/api/business/records?resource=customers&limit=50`,{headers})
    check(customers,{'customers bounded':r=>r.status===200||r.status===403})
    const invoices=http.get(`${base}/api/business/records?resource=invoices&limit=50`,{headers})
    check(invoices,{'invoices bounded':r=>r.status===200||r.status===403})
  }
  sleep(1)
}
