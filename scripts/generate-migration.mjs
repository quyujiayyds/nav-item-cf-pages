import fs from 'node:fs';
const src = fs.readFileSync('db.js', 'utf8');
function extract(name) {
  const idx = src.indexOf(`const ${name} =`);
  if (idx < 0) throw new Error(`missing ${name}`);
  const start = src.indexOf('[', idx);
  let depth = 0, inStr = false, quote = '', esc = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (esc) esc=false; else if (c==='\\') esc=true; else if (c===quote) inStr=false; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr=true; quote=c; continue; }
    if (c === '[') depth++;
    if (c === ']') { depth--; if (depth === 0) return src.slice(start, i+1); }
  }
  throw new Error(`unterminated ${name}`);
}
const defaultMenus = Function(`return (${extract('defaultMenus')})`)();
const subMenus = Function(`return (${extract('subMenus')})`)();
const cards = Function(`return (${extract('cards')})`)();
const q = v => v == null ? 'NULL' : `'${String(v).replaceAll("'", "''")}'`;
let sql = `PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS menus (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, "order" INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_menus_order ON menus("order");
CREATE TABLE IF NOT EXISTS sub_menus (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER NOT NULL, name TEXT NOT NULL, "order" INTEGER DEFAULT 0, FOREIGN KEY(parent_id) REFERENCES menus(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_sub_menus_parent_id ON sub_menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_sub_menus_order ON sub_menus("order");
CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, menu_id INTEGER, sub_menu_id INTEGER, title TEXT NOT NULL, url TEXT NOT NULL, logo_url TEXT, custom_logo_path TEXT, desc TEXT, "order" INTEGER DEFAULT 0, FOREIGN KEY(menu_id) REFERENCES menus(id) ON DELETE CASCADE, FOREIGN KEY(sub_menu_id) REFERENCES sub_menus(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_cards_menu_id ON cards(menu_id);
CREATE INDEX IF NOT EXISTS idx_cards_sub_menu_id ON cards(sub_menu_id);
CREATE INDEX IF NOT EXISTS idx_cards_order ON cards("order");
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, last_login_time TEXT, last_login_ip TEXT);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE TABLE IF NOT EXISTS ads (id INTEGER PRIMARY KEY AUTOINCREMENT, position TEXT NOT NULL, img TEXT NOT NULL, url TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position);
CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, url TEXT NOT NULL, logo TEXT);
CREATE INDEX IF NOT EXISTS idx_friends_title ON friends(title);
`;
for (const [name, order] of defaultMenus) sql += `INSERT INTO menus (name, "order") SELECT ${q(name)}, ${Number(order)||0} WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name=${q(name)});\n`;
for (const sm of subMenus) sql += `INSERT INTO sub_menus (parent_id, name, "order") SELECT menus.id, ${q(sm.name)}, ${Number(sm.order)||0} FROM menus WHERE menus.name=${q(sm.parentMenu)} AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name=${q(sm.name)} AND parent_id=menus.id);\n`;
for (const c of cards) {
  if (c.subMenu) sql += `INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, "order") SELECT NULL, sub_menus.id, ${q(c.title)}, ${q(c.url)}, ${q(c.logo_url||'')}, ${q(c.desc||'')}, 0 FROM sub_menus WHERE sub_menus.name=${q(c.subMenu)} AND NOT EXISTS (SELECT 1 FROM cards WHERE title=${q(c.title)} AND url=${q(c.url)} AND sub_menu_id=sub_menus.id);\n`;
  else sql += `INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, "order") SELECT menus.id, NULL, ${q(c.title)}, ${q(c.url)}, ${q(c.logo_url||'')}, ${q(c.desc||'')}, 0 FROM menus WHERE menus.name=${q(c.menu)} AND NOT EXISTS (SELECT 1 FROM cards WHERE title=${q(c.title)} AND url=${q(c.url)} AND menu_id=menus.id);\n`;
}
fs.writeFileSync('migrations/0001_schema_and_seed.sql', sql);
console.log(`wrote migration with ${defaultMenus.length} menus, ${subMenus.length} submenus, ${cards.length} cards`);
