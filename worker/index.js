const JWT_SECRET_FALLBACK = 'nav-item-cf-worker-jwt-secret-change-me';

const INITIAL_SQL = [
  "PRAGMA foreign_keys=ON",
  "CREATE TABLE IF NOT EXISTS menus (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, \"order\" INTEGER DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS idx_menus_order ON menus(\"order\")",
  "CREATE TABLE IF NOT EXISTS sub_menus (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER NOT NULL, name TEXT NOT NULL, \"order\" INTEGER DEFAULT 0, FOREIGN KEY(parent_id) REFERENCES menus(id) ON DELETE CASCADE)",
  "CREATE INDEX IF NOT EXISTS idx_sub_menus_parent_id ON sub_menus(parent_id)",
  "CREATE INDEX IF NOT EXISTS idx_sub_menus_order ON sub_menus(\"order\")",
  "CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, menu_id INTEGER, sub_menu_id INTEGER, title TEXT NOT NULL, url TEXT NOT NULL, logo_url TEXT, custom_logo_path TEXT, desc TEXT, \"order\" INTEGER DEFAULT 0, FOREIGN KEY(menu_id) REFERENCES menus(id) ON DELETE CASCADE, FOREIGN KEY(sub_menu_id) REFERENCES sub_menus(id) ON DELETE CASCADE)",
  "CREATE INDEX IF NOT EXISTS idx_cards_menu_id ON cards(menu_id)",
  "CREATE INDEX IF NOT EXISTS idx_cards_sub_menu_id ON cards(sub_menu_id)",
  "CREATE INDEX IF NOT EXISTS idx_cards_order ON cards(\"order\")",
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, last_login_time TEXT, last_login_ip TEXT)",
  "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
  "CREATE TABLE IF NOT EXISTS ads (id INTEGER PRIMARY KEY AUTOINCREMENT, position TEXT NOT NULL, img TEXT NOT NULL, url TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position)",
  "CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, url TEXT NOT NULL, logo TEXT)",
  "CREATE INDEX IF NOT EXISTS idx_friends_title ON friends(title)",
  "INSERT INTO menus (name, \"order\") SELECT 'Home', 1 WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name='Home')",
  "INSERT INTO menus (name, \"order\") SELECT 'Ai Stuff', 2 WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name='Ai Stuff')",
  "INSERT INTO menus (name, \"order\") SELECT 'Cloud', 3 WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name='Cloud')",
  "INSERT INTO menus (name, \"order\") SELECT 'Software', 4 WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name='Software')",
  "INSERT INTO menus (name, \"order\") SELECT 'Tools', 5 WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name='Tools')",
  "INSERT INTO menus (name, \"order\") SELECT 'Other', 6 WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name='Other')",
  "INSERT INTO sub_menus (parent_id, name, \"order\") SELECT menus.id, 'AI chat', 1 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name='AI chat' AND parent_id=menus.id)",
  "INSERT INTO sub_menus (parent_id, name, \"order\") SELECT menus.id, 'AI tools', 2 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name='AI tools' AND parent_id=menus.id)",
  "INSERT INTO sub_menus (parent_id, name, \"order\") SELECT menus.id, 'Dev Tools', 1 FROM menus WHERE menus.name='Tools' AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name='Dev Tools' AND parent_id=menus.id)",
  "INSERT INTO sub_menus (parent_id, name, \"order\") SELECT menus.id, 'Mac', 1 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name='Mac' AND parent_id=menus.id)",
  "INSERT INTO sub_menus (parent_id, name, \"order\") SELECT menus.id, 'iOS', 2 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name='iOS' AND parent_id=menus.id)",
  "INSERT INTO sub_menus (parent_id, name, \"order\") SELECT menus.id, 'Android', 3 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name='Android' AND parent_id=menus.id)",
  "INSERT INTO sub_menus (parent_id, name, \"order\") SELECT menus.id, 'Windows', 4 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM sub_menus WHERE name='Windows' AND parent_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Baidu', 'https://www.baidu.com', '', '全球最大的中文搜索引擎', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Baidu' AND url='https://www.baidu.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Youtube', 'https://www.youtube.com', 'https://img.icons8.com/ios-filled/100/ff1d06/youtube-play.png', '全球最大的视频社区', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Youtube' AND url='https://www.youtube.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Gmail', 'https://mail.google.com', 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico', '', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Gmail' AND url='https://mail.google.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'GitHub', 'https://github.com', '', '全球最大的代码托管平台', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='GitHub' AND url='https://github.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'ip.sb', 'https://ip.sb', '', 'ip地址查询', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='ip.sb' AND url='https://ip.sb' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Cloudflare', 'https://dash.cloudflare.com', '', '全球最大的cdn服务商', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Cloudflare' AND url='https://dash.cloudflare.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'ChatGPT', 'https://chat.openai.com', 'https://cdn.oaistatic.com/assets/favicon-eex17e9e.ico', '人工智能AI聊天机器人', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='ChatGPT' AND url='https://chat.openai.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Huggingface', 'https://huggingface.co', '', '全球最大的开源模型托管平台', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Huggingface' AND url='https://huggingface.co' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'ITDOG - 在线ping', 'https://www.itdog.cn/tcping', '', '在线tcping', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='ITDOG - 在线ping' AND url='https://www.itdog.cn/tcping' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Ping0', 'https://ping0.cc', '', 'ip地址查询', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Ping0' AND url='https://ping0.cc' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '浏览器指纹', 'https://www.browserscan.net/zh', '', '浏览器指纹查询', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='浏览器指纹' AND url='https://www.browserscan.net/zh' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'nezha面板', 'https://ssss.nyc.mn', 'https://nezha.wiki/logo.png', 'nezha面板', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='nezha面板' AND url='https://ssss.nyc.mn' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Api测试', 'https://hoppscotch.io', '', '在线api测试工具', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Api测试' AND url='https://hoppscotch.io' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '域名检查', 'https://who.cx', '', '域名可用性查询', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='域名检查' AND url='https://who.cx' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '域名比价', 'https://www.whois.com', '', '域名价格比较', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='域名比价' AND url='https://www.whois.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'NodeSeek', 'https://www.nodeseek.com', 'https://www.nodeseek.com/static/image/favicon/favicon-32x32.png', '主机论坛', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='NodeSeek' AND url='https://www.nodeseek.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Linux do', 'https://linux.do', 'https://linux.do/uploads/default/optimized/3X/9/d/9dd49731091ce8656e94433a26a3ef36062b3994_2_32x32.png', '新的理想型社区', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Linux do' AND url='https://linux.do' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '在线音乐', 'https://music.eooce.com', 'https://p3.music.126.net/tBTNafgjNnTL1KlZMt7lVA==/18885211718935735.jpg', '在线音乐', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='在线音乐' AND url='https://music.eooce.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '在线电影', 'https://libretv.eooce.com', 'https://img.icons8.com/color/240/cinema---v1.png', '在线电影', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='在线电影' AND url='https://libretv.eooce.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '免费接码', 'https://www.smsonline.cloud/zh', '', '免费接收短信验证码', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='免费接码' AND url='https://www.smsonline.cloud/zh' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '订阅转换', 'https://sublink.eooce.com', 'https://img.icons8.com/color/96/link--v1.png', '最好用的订阅转换工具', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='订阅转换' AND url='https://sublink.eooce.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'webssh', 'https://ssh.eooce.com', 'https://img.icons8.com/fluency/240/ssh.png', '最好用的webssh终端管理工具', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='webssh' AND url='https://ssh.eooce.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '文件快递柜', 'https://filebox.nnuu.nyc.mn', 'https://img.icons8.com/nolan/256/document.png', '文件输出分享', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='文件快递柜' AND url='https://filebox.nnuu.nyc.mn' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '真实地址生成', 'https://address.nnuu.nyc.mn', 'https://static11.meiguodizhi.com/favicon.ico', '基于当前ip生成真实的地址', 0 FROM menus WHERE menus.name='Home' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='真实地址生成' AND url='https://address.nnuu.nyc.mn' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'ChatGPT', 'https://chat.openai.com', 'https://cdn.oaistatic.com/assets/favicon-eex17e9e.ico', 'OpenAI官方AI对话', 0 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='ChatGPT' AND url='https://chat.openai.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Deepseek', 'https://www.deepseek.com', 'https://cdn.deepseek.com/chat/icon.png', 'Deepseek AI搜索', 0 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Deepseek' AND url='https://www.deepseek.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Claude', 'https://claude.ai', 'https://img.icons8.com/fluency/240/claude-ai.png', 'Anthropic Claude AI', 0 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Claude' AND url='https://claude.ai' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Google Gemini', 'https://gemini.google.com', 'https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg', 'Google Gemini大模型', 0 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Google Gemini' AND url='https://gemini.google.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '阿里千问', 'https://chat.qwenlm.ai', 'https://g.alicdn.com/qwenweb/qwen-ai-fe/0.0.11/favicon.ico', '阿里云千问大模型', 0 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='阿里千问' AND url='https://chat.qwenlm.ai' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Kimi', 'https://www.kimi.com', '', '月之暗面Moonshot AI', 0 FROM menus WHERE menus.name='Ai Stuff' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Kimi' AND url='https://www.kimi.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT NULL, sub_menus.id, 'ChatGPT', 'https://chat.openai.com', 'https://cdn.oaistatic.com/assets/favicon-eex17e9e.ico', 'OpenAI官方AI对话', 0 FROM sub_menus WHERE sub_menus.name='AI chat' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='ChatGPT' AND url='https://chat.openai.com' AND sub_menu_id=sub_menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT NULL, sub_menus.id, 'Deepseek', 'https://www.deepseek.com', 'https://cdn.deepseek.com/chat/icon.png', 'Deepseek AI搜索', 0 FROM sub_menus WHERE sub_menus.name='AI chat' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Deepseek' AND url='https://www.deepseek.com' AND sub_menu_id=sub_menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT NULL, sub_menus.id, 'ChatGPT', 'https://chat.openai.com', 'https://cdn.oaistatic.com/assets/favicon-eex17e9e.ico', 'OpenAI官方AI对话', 0 FROM sub_menus WHERE sub_menus.name='AI tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='ChatGPT' AND url='https://chat.openai.com' AND sub_menu_id=sub_menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT NULL, sub_menus.id, 'Deepseek', 'https://www.deepseek.com', 'https://cdn.deepseek.com/chat/icon.png', 'Deepseek AI搜索', 0 FROM sub_menus WHERE sub_menus.name='AI tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Deepseek' AND url='https://www.deepseek.com' AND sub_menu_id=sub_menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '阿里云', 'https://www.aliyun.com', 'https://img.alicdn.com/tfs/TB1_ZXuNcfpK1RjSZFOXXa6nFXa-32-32.ico', '阿里云官网', 0 FROM menus WHERE menus.name='Cloud' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='阿里云' AND url='https://www.aliyun.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '腾讯云', 'https://cloud.tencent.com', '', '腾讯云官网', 0 FROM menus WHERE menus.name='Cloud' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='腾讯云' AND url='https://cloud.tencent.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '甲骨文云', 'https://cloud.oracle.com', '', 'Oracle Cloud', 0 FROM menus WHERE menus.name='Cloud' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='甲骨文云' AND url='https://cloud.oracle.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '亚马逊云', 'https://aws.amazon.com', 'https://img.icons8.com/color/144/amazon-web-services.png', 'Amazon AWS', 0 FROM menus WHERE menus.name='Cloud' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='亚马逊云' AND url='https://aws.amazon.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'DigitalOcean', 'https://www.digitalocean.com', 'https://www.digitalocean.com/_next/static/media/apple-touch-icon.d7edaa01.png', 'DigitalOcean VPS', 0 FROM menus WHERE menus.name='Cloud' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='DigitalOcean' AND url='https://www.digitalocean.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Vultr', 'https://www.vultr.com', '', 'Vultr VPS', 0 FROM menus WHERE menus.name='Cloud' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Vultr' AND url='https://www.vultr.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Hellowindows', 'https://hellowindows.cn', 'https://hellowindows.cn/logo-s.png', 'windows系统及office下载', 0 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Hellowindows' AND url='https://hellowindows.cn' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '奇迹秀', 'https://www.qijishow.com/down', 'https://www.qijishow.com/img/ico.ico', '设计师的百宝箱', 0 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='奇迹秀' AND url='https://www.qijishow.com/down' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '易破解', 'https://www.ypojie.com', 'https://www.ypojie.com/favicon.ico', '精品windows软件', 0 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='易破解' AND url='https://www.ypojie.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '软件先锋', 'https://topcracked.com', 'https://cdn.mac89.com/win_macxf_node/static/favicon.ico', '精品windows软件', 0 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='软件先锋' AND url='https://topcracked.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Macwk', 'https://www.macwk.com', 'https://www.macwk.com/favicon-32x32.ico', '精品Mac软件', 0 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Macwk' AND url='https://www.macwk.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Macsc', 'https://mac.macsc.com', 'https://cdn.mac89.com/macsc_node/static/favicon.ico', '', 0 FROM menus WHERE menus.name='Software' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Macsc' AND url='https://mac.macsc.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'JSON工具', 'https://www.json.cn', 'https://img.icons8.com/nolan/128/json.png', 'JSON格式化/校验', 0 FROM menus WHERE menus.name='Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='JSON工具' AND url='https://www.json.cn' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'base64工具', 'https://www.qqxiuzi.cn/bianma/base64.htm', 'https://cdn.base64decode.org/assets/images/b64-180.webp', '在线base64编码解码', 0 FROM menus WHERE menus.name='Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='base64工具' AND url='https://www.qqxiuzi.cn/bianma/base64.htm' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '二维码生成', 'https://cli.im', 'https://img.icons8.com/fluency/96/qr-code.png', '二维码生成工具', 0 FROM menus WHERE menus.name='Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='二维码生成' AND url='https://cli.im' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'JS混淆', 'https://obfuscator.io', 'https://img.icons8.com/color/240/javascript--v1.png', '在线Javascript代码混淆', 0 FROM menus WHERE menus.name='Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='JS混淆' AND url='https://obfuscator.io' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Python混淆', 'https://freecodingtools.org/tools/obfuscator/python', 'https://img.icons8.com/color/240/python--v1.png', '在线python代码混淆', 0 FROM menus WHERE menus.name='Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Python混淆' AND url='https://freecodingtools.org/tools/obfuscator/python' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Remove.photos', 'https://remove.photos/zh-cn', 'https://img.icons8.com/doodle/192/picture.png', '一键抠图', 0 FROM menus WHERE menus.name='Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Remove.photos' AND url='https://remove.photos/zh-cn' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT NULL, sub_menus.id, 'Uiverse', 'https://uiverse.io/elements', 'https://img.icons8.com/fluency/96/web-design.png', 'CSS动画和设计元素', 0 FROM sub_menus WHERE sub_menus.name='Dev Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Uiverse' AND url='https://uiverse.io/elements' AND sub_menu_id=sub_menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT NULL, sub_menus.id, 'Icons8', 'https://igoutu.cn/icons', 'https://maxst.icons8.com/vue-static/landings/primary-landings/favs/icons8_fav_32×32.png', '免费图标和设计资源', 0 FROM sub_menus WHERE sub_menus.name='Dev Tools' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Icons8' AND url='https://igoutu.cn/icons' AND sub_menu_id=sub_menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Gmail', 'https://mail.google.com', 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico', 'Google邮箱', 0 FROM menus WHERE menus.name='Other' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Gmail' AND url='https://mail.google.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Outlook', 'https://outlook.live.com', 'https://img.icons8.com/color/256/ms-outlook.png', '微软Outlook邮箱', 0 FROM menus WHERE menus.name='Other' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Outlook' AND url='https://outlook.live.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'Proton Mail', 'https://account.proton.me', 'https://account.proton.me/assets/apple-touch-icon-120x120.png', '安全加密邮箱', 0 FROM menus WHERE menus.name='Other' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='Proton Mail' AND url='https://account.proton.me' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, 'QQ邮箱', 'https://mail.qq.com', 'https://mail.qq.com/zh_CN/htmledition/images/favicon/qqmail_favicon_96h.png', '腾讯QQ邮箱', 0 FROM menus WHERE menus.name='Other' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='QQ邮箱' AND url='https://mail.qq.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '雅虎邮箱', 'https://mail.yahoo.com', 'https://img.icons8.com/color/240/yahoo--v2.png', '雅虎邮箱', 0 FROM menus WHERE menus.name='Other' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='雅虎邮箱' AND url='https://mail.yahoo.com' AND menu_id=menus.id)",
  "INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc, \"order\") SELECT menus.id, NULL, '10分钟临时邮箱', 'https://linshiyouxiang.net', 'https://linshiyouxiang.net/static/index/zh/images/favicon.ico', '10分钟临时邮箱', 0 FROM menus WHERE menus.name='Other' AND NOT EXISTS (SELECT 1 FROM cards WHERE title='10分钟临时邮箱' AND url='https://linshiyouxiang.net' AND menu_id=menus.id)"
];

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


async function ensureDatabase(DB) {
  const usersTable = await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first().catch(() => null);
  if (!usersTable) {
    await DB.batch(INITIAL_SQL.map(sql => DB.prepare(sql)));
    return;
  }

  const menusCount = await DB.prepare('SELECT COUNT(*) as count FROM menus').first().catch(() => null);
  if (menusCount && menusCount.count === 0) {
    const seedStatements = INITIAL_SQL.filter(sql => sql.trim().toUpperCase().startsWith('INSERT INTO'));
    await DB.batch(seedStatements.map(sql => DB.prepare(sql)));
  }
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
  await ensureDatabase(env.DB);
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env).catch(e => e instanceof Response ? e : json({ error: e.message || 'server error' }, 500));
    return env.ASSETS.fetch(request);
  }
};
