import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()

    const ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'

    let geo = { country: null, city: null, isp: null }
    if (ip && ip !== 'unknown' && !ip.startsWith('127.')) {
      try {
        const r = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,isp,status`)
        const d = await r.json()
        if (d.status === 'success') geo = { country: d.country, city: d.city, isp: d.isp }
      } catch(e) {}
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (body.reason === 'success' && body.user_id) {
      await sb.from('device_logs').insert({
        user_id:      body.user_id,
        device_type:  body.device_type,
        os:           body.os,
        browser:      body.browser,
        screen_width:  body.screen_width,
        screen_height: body.screen_height,
        timezone:     body.timezone,
        language:     body.language,
        user_agent:   body.user_agent,
        ip_address:   ip,
        city:         geo.city,
        country:      geo.country,
        isp:          geo.isp,
        logged_at:    new Date().toISOString(),
      })}
   else {
      // Failed login — write to failed_logins
      await sb.from('failed_logins').insert({
        ...body,
        ip_address:   ip,
        country:      geo.country,
        city:         geo.city,
        isp:          geo.isp,
        attempted_at: new Date().toISOString(),
      })
    }

    return new Response(JSON.stringify({ ok: true, ip, geo }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})