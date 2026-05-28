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
      // Update device_logs with real IP + geo
      await sb.from('device_logs')
        .update({ ip_address: ip })
        .eq('user_id', body.user_id)
        .order('logged_at', { ascending: false })
        .limit(1)

      // Also log to a login_events table with full geo
      await sb.from('activity_logs').insert({
        user_id:   body.user_id,
        app:       'landing',
        action:    `login | IP: ${ip} | ${[geo.city, geo.country].filter(Boolean).join(', ')} | ${geo.isp || ''}`,
        logged_at: new Date().toISOString(),
      }).catch(() => {})

    } else {
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