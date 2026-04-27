import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { key, hwid } = req.body;
  if (!key || !hwid)
    return res.status(400).json({ valid: false, reason: 'Missing fields' });

  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) return res.json({ valid: false, reason: 'Not found' });
  if (!data.active)  return res.json({ valid: false, reason: 'Revoked' });

  // Первая активация — привязываем к железу
  if (!data.hwid) {
    await supabase
      .from('licenses')
      .update({ hwid })
      .eq('key', key);
    return res.json({ valid: true });
  }

  // Проверяем совпадение железа
  if (data.hwid !== hwid)
    return res.json({ valid: false, reason: 'HWID mismatch' });

  res.json({ valid: true });
}
