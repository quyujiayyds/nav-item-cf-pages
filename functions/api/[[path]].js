const JWT_SECRET_FALLBACK = 'nav-item-cf-worker-jwt-secret-change-me';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function getSecret(env) {
  return env.JWT_SECRET || JWT_SECRET_FALLBACK;
}

function b64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlString(str) {
  return b64url(new TextEncoder().encode(str));
}

function decodeB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function signToken(payload, secret, ttlSeconds = 7200) {
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + ttlSeconds };
  const header = b64urlString(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64urlString(JSON.stringify(full));
  const signingInput = `${header}.${body}`;
  const sig = b64url(await hmac(signingInput, secret));
  return `${signingInput}.${sig}`;
}

async function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('bad token');
  const signingInput = `${parts[0]}.${parts[1]}`;
  const expected = b64url(await hmac(signingInput, secret));
  if (expected !== parts[2]) throw new Error('bad signature');
  const payload = JSON.parse(new TextDecoder().decode(decodeB64url(parts[1])));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
  return payload;
}

async function hashPassword(password, salt = 'nav-item') {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return `sha256$${salt}$${b64url(new Uint8Array(digest))}`;
}

async function comparePassword(password, stored) {
  if (!stored) return false;
  if (stored.startsWith('sha256$')) {
    const [, salt] = stored.split('$');
    return await hashPassword(password, salt) === stored;
  }
  return false;
}

function getClientIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
}

function getShanghaiTime() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }).replace('T', ' ');
}

async function bodyJson(request) {
  try { return await request.json(); } catch { return {}; }
}

async function requireAuth(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new Response(JSON.stringify({ error: '未授权' }), { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  try { return await verifyToken(auth.slice(7), getSecret(env)); }
  catch { throw new Response(JSON.stringify({ error: '无效token' }), { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }
}

async function maybeInitAdmin(env) {
  const username = env.ADMIN_USERNAME || 'admin';
  const password = env.ADMIN_PASSWORD || '123456';
  const existing = await env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first();
  if (!existing) {
    const hash = await hashPassword(password, username);
    await env.DB.prepare('INSERT INTO users (username, password) VALUES (?, ?)').bind(username, hash).run();
  }
}


function cleanRow(row, fields) {
  const out = {};
  for (const f of fields) out[f] = row?.[f] ?? null;
  return out;
}

async function exportData(DB) {
  const [menus, subMenus, cards, ads, friends] = await Promise.all([
    DB.prepare('SELECT id, name, "order" FROM menus ORDER BY "order", id').all(),
    DB.prepare('SELECT id, parent_id, name, "order" FROM sub_menus ORDER BY parent_id, "order", id').all(),
    DB.prepare('SELECT id, menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order" FROM cards ORDER BY COALESCE(menu_id, 0), COALESCE(sub_menu_id, 0), "order", id').all(),
    DB.prepare('SELECT id, position, img, url FROM ads ORDER BY id').all(),
    DB.prepare('SELECT id, title, url, logo FROM friends ORDER BY id').all()
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'nav-item-cf',
    data: {
      menus: menus.results || [],
      sub_menus: subMenus.results || [],
      cards: cards.results || [],
      ads: ads.results || [],
      friends: friends.results || []
    }
  };
}

async function importData(DB, payload) {
  const data = payload?.data || payload || {};
  const menus = Array.isArray(data.menus) ? data.menus : [];
  const subMenus = Array.isArray(data.sub_menus) ? data.sub_menus : (Array.isArray(data.subMenus) ? data.subMenus : []);
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const ads = Array.isArray(data.ads) ? data.ads : [];
  const friends = Array.isArray(data.friends) ? data.friends : [];

  if (!Array.isArray(menus) || !Array.isArray(subMenus) || !Array.isArray(cards)) throw new Error('导入文件格式错误');
  if (menus.length > 500 || subMenus.length > 1000 || cards.length > 5000 || ads.length > 500 || friends.length > 500) throw new Error('导入数据量过大');

  const statements = [
    DB.prepare('DELETE FROM cards'),
    DB.prepare('DELETE FROM sub_menus'),
    DB.prepare('DELETE FROM menus'),
    DB.prepare('DELETE FROM ads'),
    DB.prepare('DELETE FROM friends')
  ];

  for (const row of menus) {
    const r = cleanRow(row, ['id', 'name', 'order']);
    if (!r.name) continue;
    statements.push(DB.prepare('INSERT INTO menus (id, name, "order") VALUES (?, ?, ?)').bind(r.id || null, String(r.name), Number(r.order) || 0));
  }
  for (const row of subMenus) {
    const r = cleanRow(row, ['id', 'parent_id', 'name', 'order']);
    if (!r.parent_id || !r.name) continue;
    statements.push(DB.prepare('INSERT INTO sub_menus (id, parent_id, name, "order") VALUES (?, ?, ?, ?)').bind(r.id || null, r.parent_id, String(r.name), Number(r.order) || 0));
  }
  for (const row of cards) {
    const r = cleanRow(row, ['id', 'menu_id', 'sub_menu_id', 'title', 'url', 'logo_url', 'custom_logo_path', 'desc', 'order']);
    if (!r.title || !r.url) continue;
    statements.push(DB.prepare('INSERT INTO cards (id, menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(r.id || null, r.menu_id || null, r.sub_menu_id || null, String(r.title), String(r.url), r.logo_url || '', r.custom_logo_path || '', r.desc || '', Number(r.order) || 0));
  }
  for (const row of ads) {
    const r = cleanRow(row, ['id', 'position', 'img', 'url']);
    if (!r.position || !r.img || !r.url) continue;
    statements.push(DB.prepare('INSERT INTO ads (id, position, img, url) VALUES (?, ?, ?, ?)').bind(r.id || null, String(r.position), String(r.img), String(r.url)));
  }
  for (const row of friends) {
    const r = cleanRow(row, ['id', 'title', 'url', 'logo']);
    if (!r.title || !r.url) continue;
    statements.push(DB.prepare('INSERT INTO friends (id, title, url, logo) VALUES (?, ?, ?, ?)').bind(r.id || null, String(r.title), String(r.url), r.logo || ''));
  }

  await DB.batch(statements);
  return { menus: menus.length, sub_menus: subMenus.length, cards: cards.length, ads: ads.length, friends: friends.length };
}

function withDisplayLogo(card) {
  if (!card.custom_logo_path) {
    card.display_logo = card.logo_url || (card.url ? card.url.replace(/\/+$/, '') + '/favicon.ico' : '');
  } else {
    card.display_logo = card.custom_logo_path.startsWith('data:') ? card.custom_logo_path : '/uploads/' + card.custom_logo_path;
  }
  return card;
}

async function handleApi(request, env) {
  await maybeInitAdmin(env);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const method = request.method;
  const DB = env.DB;

  if (method === 'POST' && path === '/login') {
    const { username, password } = await bodyJson(request);
    const user = await DB.prepare('SELECT * FROM users WHERE username=?').bind(username || '').first();
    if (!user || !(await comparePassword(password || '', user.password))) return json({ error: '用户名或密码错误' }, 401);
    const lastLoginTime = user.last_login_time;
    const lastLoginIp = user.last_login_ip;
    await DB.prepare('UPDATE users SET last_login_time=?, last_login_ip=? WHERE id=?').bind(getShanghaiTime(), getClientIp(request), user.id).run();
    const token = await signToken({ id: user.id, username: user.username }, getSecret(env));
    return json({ token, lastLoginTime, lastLoginIp });
  }


  if (method === 'GET' && path === '/data/export') {
    await requireAuth(request, env);
    const payload = await exportData(DB);
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="nav-item-backup-${new Date().toISOString().slice(0, 10)}.json"`
      }
    });
  }

  if (method === 'POST' && path === '/data/import') {
    await requireAuth(request, env);
    const payload = await bodyJson(request);
    try {
      const imported = await importData(DB, payload);
      return json({ message: '导入成功', imported });
    } catch (e) {
      return json({ message: e.message || '导入失败' }, 400);
    }
  }

  if (method === 'GET' && path === '/menus') {
    const page = url.searchParams.get('page');
    const pageSize = url.searchParams.get('pageSize');
    if (!page && !pageSize) {
      const menus = (await DB.prepare('SELECT * FROM menus ORDER BY "order"').all()).results || [];
      const subMenus = (await DB.prepare('SELECT * FROM sub_menus ORDER BY "order"').all()).results || [];
      return json(menus.map(m => ({ ...m, subMenus: subMenus.filter(s => s.parent_id === m.id) })));
    }
    const pageNum = parseInt(page || '1', 10); const size = parseInt(pageSize || '10', 10); const offset = (pageNum - 1) * size;
    const count = await DB.prepare('SELECT COUNT(*) as total FROM menus').first();
    const rows = (await DB.prepare('SELECT * FROM menus ORDER BY "order" LIMIT ? OFFSET ?').bind(size, offset).all()).results || [];
    return json({ total: count.total, page: pageNum, pageSize: size, data: rows });
  }

  let m = path.match(/^\/menus\/(\d+)\/submenus$/);
  if (method === 'GET' && m) {
    const rows = (await DB.prepare('SELECT * FROM sub_menus WHERE parent_id=? ORDER BY "order"').bind(m[1]).all()).results || [];
    return json(rows);
  }
  if (method === 'POST' && m) {
    await requireAuth(request, env);
    const { name, order } = await bodyJson(request);
    const r = await DB.prepare('INSERT INTO sub_menus (parent_id, name, "order") VALUES (?, ?, ?)').bind(m[1], name, order || 0).run();
    return json({ id: r.meta.last_row_id });
  }
  m = path.match(/^\/menus\/submenus\/(\d+)$/);
  if (m && method === 'PUT') {
    await requireAuth(request, env); const { name, order } = await bodyJson(request);
    const r = await DB.prepare('UPDATE sub_menus SET name=?, "order"=? WHERE id=?').bind(name, order || 0, m[1]).run();
    return json({ changed: r.meta.changes });
  }
  if (m && method === 'DELETE') {
    await requireAuth(request, env); const r = await DB.prepare('DELETE FROM sub_menus WHERE id=?').bind(m[1]).run(); return json({ deleted: r.meta.changes });
  }
  m = path.match(/^\/menus\/(\d+)$/);
  if (method === 'POST' && path === '/menus') {
    await requireAuth(request, env); const { name, order } = await bodyJson(request);
    const r = await DB.prepare('INSERT INTO menus (name, "order") VALUES (?, ?)').bind(name, order || 0).run(); return json({ id: r.meta.last_row_id });
  }
  if (m && method === 'PUT') {
    await requireAuth(request, env); const { name, order } = await bodyJson(request);
    const r = await DB.prepare('UPDATE menus SET name=?, "order"=? WHERE id=?').bind(name, order || 0, m[1]).run(); return json({ changed: r.meta.changes });
  }
  if (m && method === 'DELETE') {
    await requireAuth(request, env); const r = await DB.prepare('DELETE FROM menus WHERE id=?').bind(m[1]).run(); return json({ deleted: r.meta.changes });
  }

  m = path.match(/^\/cards\/(\d+)$/);
  if (m && method === 'GET') {
    const subMenuId = url.searchParams.get('subMenuId');
    const q = subMenuId ? DB.prepare('SELECT * FROM cards WHERE sub_menu_id=? ORDER BY "order"').bind(subMenuId) : DB.prepare('SELECT * FROM cards WHERE menu_id=? AND sub_menu_id IS NULL ORDER BY "order"').bind(m[1]);
    const rows = ((await q.all()).results || []).map(withDisplayLogo);
    return json(rows);
  }
  if (method === 'POST' && path === '/cards') {
    await requireAuth(request, env); const b = await bodyJson(request);
    const r = await DB.prepare('INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, custom_logo_path, desc, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(b.menu_id || null, b.sub_menu_id || null, b.title, b.url, b.logo_url || '', b.custom_logo_path || '', b.desc || '', b.order || 0).run(); return json({ id: r.meta.last_row_id });
  }
  m = path.match(/^\/cards\/(\d+)$/);
  if (m && method === 'PUT') {
    await requireAuth(request, env); const b = await bodyJson(request);
    const r = await DB.prepare('UPDATE cards SET menu_id=?, sub_menu_id=?, title=?, url=?, logo_url=?, custom_logo_path=?, desc=?, "order"=? WHERE id=?').bind(b.menu_id || null, b.sub_menu_id || null, b.title, b.url, b.logo_url || '', b.custom_logo_path || '', b.desc || '', b.order || 0, m[1]).run(); return json({ changed: r.meta.changes });
  }
  if (m && method === 'DELETE') {
    await requireAuth(request, env); const r = await DB.prepare('DELETE FROM cards WHERE id=?').bind(m[1]).run(); return json({ deleted: r.meta.changes });
  }

  if (method === 'POST' && path === '/upload') {
    await requireAuth(request, env);
    const form = await request.formData();
    const file = form.get('logo');
    if (!file || typeof file === 'string') return json({ error: 'No file uploaded' }, 400);
    if (file.size > 1024 * 1024) return json({ error: 'Cloudflare版本当前限制上传1MB以内图片' }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${btoa(String.fromCharCode(...bytes))}`;
    return json({ filename: dataUrl, url: dataUrl });
  }

  for (const resource of ['ads', 'friends']) {
    if (path === `/${resource}` && method === 'GET') {
      const page = url.searchParams.get('page'); const pageSize = url.searchParams.get('pageSize');
      if (!page && !pageSize) return json((await DB.prepare(`SELECT * FROM ${resource}`).all()).results || []);
      const pageNum = parseInt(page || '1', 10), size = parseInt(pageSize || '10', 10), offset = (pageNum - 1) * size;
      const count = await DB.prepare(`SELECT COUNT(*) as total FROM ${resource}`).first();
      const rows = (await DB.prepare(`SELECT * FROM ${resource} LIMIT ? OFFSET ?`).bind(size, offset).all()).results || [];
      return json({ total: count.total, page: pageNum, pageSize: size, data: rows });
    }
  }
  if (path === '/ads' && method === 'POST') { await requireAuth(request, env); const b = await bodyJson(request); const r = await DB.prepare('INSERT INTO ads (position, img, url) VALUES (?, ?, ?)').bind(b.position, b.img, b.url).run(); return json({ id: r.meta.last_row_id }); }
  m = path.match(/^\/ads\/(\d+)$/);
  if (m && method === 'PUT') { await requireAuth(request, env); const b = await bodyJson(request); const r = await DB.prepare('UPDATE ads SET img=?, url=? WHERE id=?').bind(b.img, b.url, m[1]).run(); return json({ changed: r.meta.changes }); }
  if (m && method === 'DELETE') { await requireAuth(request, env); const r = await DB.prepare('DELETE FROM ads WHERE id=?').bind(m[1]).run(); return json({ deleted: r.meta.changes }); }

  if (path === '/friends' && method === 'POST') { await requireAuth(request, env); const b = await bodyJson(request); const r = await DB.prepare('INSERT INTO friends (title, url, logo) VALUES (?, ?, ?)').bind(b.title, b.url, b.logo).run(); return json({ id: r.meta.last_row_id }); }
  m = path.match(/^\/friends\/(\d+)$/);
  if (m && method === 'PUT') { await requireAuth(request, env); const b = await bodyJson(request); const r = await DB.prepare('UPDATE friends SET title=?, url=?, logo=? WHERE id=?').bind(b.title, b.url, b.logo, m[1]).run(); return json({ changed: r.meta.changes }); }
  if (m && method === 'DELETE') { await requireAuth(request, env); const r = await DB.prepare('DELETE FROM friends WHERE id=?').bind(m[1]).run(); return json({ deleted: r.meta.changes }); }

  if (path === '/users/profile' && method === 'GET') { const u = await requireAuth(request, env); const user = await DB.prepare('SELECT id, username FROM users WHERE id=?').bind(u.id).first(); return user ? json({ data: user }) : json({ message: '用户不存在' }, 404); }
  if (path === '/users/me' && method === 'GET') { const u = await requireAuth(request, env); const user = await DB.prepare('SELECT id, username, last_login_time, last_login_ip FROM users WHERE id=?').bind(u.id).first(); return user ? json({ last_login_time: user.last_login_time, last_login_ip: user.last_login_ip }) : json({ message: '用户不存在' }, 404); }
  if (path === '/users/password' && method === 'PUT') {
    const u = await requireAuth(request, env); const { oldPassword, newPassword } = await bodyJson(request);
    if (!oldPassword || !newPassword) return json({ message: '请提供旧密码和新密码' }, 400);
    if (newPassword.length < 6) return json({ message: '新密码长度至少6位' }, 400);
    const user = await DB.prepare('SELECT * FROM users WHERE id=?').bind(u.id).first();
    if (!user || !(await comparePassword(oldPassword, user.password))) return json({ message: '旧密码错误' }, 400);
    await DB.prepare('UPDATE users SET password=? WHERE id=?').bind(await hashPassword(newPassword, user.username), u.id).run();
    return json({ message: '密码修改成功' });
  }
  if (path === '/users' && method === 'GET') {
    await requireAuth(request, env); const page = url.searchParams.get('page'), pageSize = url.searchParams.get('pageSize');
    if (!page && !pageSize) return json({ data: (await DB.prepare('SELECT id, username FROM users').all()).results || [] });
    const pageNum = parseInt(page || '1', 10), size = parseInt(pageSize || '10', 10), offset = (pageNum - 1) * size;
    const count = await DB.prepare('SELECT COUNT(*) as total FROM users').first();
    const rows = (await DB.prepare('SELECT id, username FROM users LIMIT ? OFFSET ?').bind(size, offset).all()).results || [];
    return json({ total: count.total, page: pageNum, pageSize: size, data: rows });
  }

  return json({ error: 'Not found' }, 404);
}


export async function onRequest(context) {
  const { request, env } = context;
  return handleApi(request, env).catch(e => e instanceof Response ? e : json({ error: e.message || 'server error' }, 500));
}
