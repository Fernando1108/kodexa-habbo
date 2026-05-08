import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kodexa Hotel database...');

  // ── Permissions / ranks (Arcturus-compatible, 9 levels) ─────────────
  const ranks = [
    // Rank 1 — Normal
    {
      id: 1, rankName: 'Normal', badge: '', level: 1,
      accTrade: 1, accMoverotate: 1,
    },
    // Rank 2 — VIP
    {
      id: 2, rankName: 'VIP', badge: 'VIP', level: 2, prefixColor: '#F59E0B',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1,
    },
    // Rank 3 — Guía
    {
      id: 3, rankName: 'Guía', badge: 'AMB', level: 3, prefixColor: '#3B82F6',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
    },
    // Rank 4 — Moderador
    {
      id: 4, rankName: 'Moderador', badge: 'MOD', level: 4, prefixColor: '#10B981',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1, cmdUnmute: 1,
      cmdBan: 1, cmdKick: 1, cmdAlert: 1, cmdRoomalert: 1, cmdTeleport: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
      accSupporttool: 1, accAnyroomrights: 1, accHideIp: 1,
    },
    // Rank 5 — Senior Mod
    {
      id: 5, rankName: 'Senior Mod', badge: 'SMOD', level: 5, prefixColor: '#F97316',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1, cmdUnmute: 1,
      cmdBan: 1, cmdKick: 1, cmdAlert: 1, cmdRoomalert: 1, cmdTeleport: 1,
      cmdSuperban: 1, cmdIpban: 1, cmdDisconnect: 1, cmdRoomkick: 1,
      cmdGiveCredits: 1, cmdGivePixels: 1, cmdGiveBadge: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
      accSupporttool: 1, accAnyroomrights: 1, accHideIp: 1,
    },
    // Rank 6 — Gamemaster
    {
      id: 6, rankName: 'Gamemaster', badge: 'GM', level: 6, prefixColor: '#EC4899',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1, cmdUnmute: 1,
      cmdBan: 1, cmdKick: 1, cmdAlert: 1, cmdRoomalert: 1, cmdTeleport: 1,
      cmdSuperban: 1, cmdIpban: 1, cmdDisconnect: 1, cmdRoomkick: 1,
      cmdGiveCredits: 1, cmdGivePixels: 1, cmdGiveBadge: 1,
      cmdGivePoints: 1, cmdChangeName: 1, cmdEmptyBots: 1, cmdEmptyPets: 1,
      cmdRoomItem: 1, cmdSay: 1, cmdShout: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
      accSupporttool: 1, accAnyroomrights: 1, accHideIp: 1,
      accAnyRoomOwner: 1, accUnlimitedBots: 1, accUnlimitedPets: 1, accHideOnline: 1,
    },
    // Rank 7 — Admin
    {
      id: 7, rankName: 'Admin', badge: 'ADM', level: 7, prefixColor: '#EF4444',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1, cmdUnmute: 1,
      cmdBan: 1, cmdKick: 1, cmdAlert: 1, cmdRoomalert: 1, cmdTeleport: 1,
      cmdSuperban: 1, cmdIpban: 1, cmdDisconnect: 1, cmdRoomkick: 1,
      cmdGiveCredits: 1, cmdGivePixels: 1, cmdGiveBadge: 1,
      cmdGivePoints: 1, cmdChangeName: 1, cmdEmptyBots: 1, cmdEmptyPets: 1,
      cmdRoomItem: 1, cmdSay: 1, cmdShout: 1,
      cmdUpdateHotel: 1, cmdUpdateWordfilter: 1, cmdUpdateNavigator: 1,
      cmdUpdateCatalog: 1, cmdUpdateTexts: 1, cmdUpdateConfig: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
      accSupporttool: 1, accAnyroomrights: 1, accHideIp: 1,
      accAnyRoomOwner: 1, accUnlimitedBots: 1, accUnlimitedPets: 1, accHideOnline: 1,
      accCatalogadmin: 1, accFullaccess: 1,
    },
    // Rank 8 — Director
    {
      id: 8, rankName: 'Director', badge: 'DIR', level: 8, prefixColor: '#8B5CF6',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1, cmdUnmute: 1,
      cmdBan: 1, cmdKick: 1, cmdAlert: 1, cmdRoomalert: 1, cmdTeleport: 1,
      cmdSuperban: 1, cmdIpban: 1, cmdDisconnect: 1, cmdRoomkick: 1,
      cmdGiveCredits: 1, cmdGivePixels: 1, cmdGiveBadge: 1,
      cmdGivePoints: 1, cmdChangeName: 1, cmdEmptyBots: 1, cmdEmptyPets: 1,
      cmdRoomItem: 1, cmdSay: 1, cmdShout: 1,
      cmdUpdateHotel: 1, cmdUpdateWordfilter: 1, cmdUpdateNavigator: 1,
      cmdUpdateCatalog: 1, cmdUpdateTexts: 1, cmdUpdateConfig: 1,
      cmdUpdatePermissions: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
      accSupporttool: 1, accAnyroomrights: 1, accHideIp: 1,
      accAnyRoomOwner: 1, accUnlimitedBots: 1, accUnlimitedPets: 1, accHideOnline: 1,
      accCatalogadmin: 1, accFullaccess: 1, accNotBannable: 1,
    },
    // Rank 9 — Fundador (todo en 1)
    {
      id: 9, rankName: 'Fundador', badge: 'OWN', level: 9, prefixColor: '#7C3AED',
      accTrade: 1, accMoverotate: 1,
      cmdAlert: 1, cmdBan: 1, cmdKick: 1, cmdMute: 1, cmdUnmute: 1, cmdTeleport: 1,
      cmdSuperban: 1, cmdIpban: 1, cmdDisconnect: 1, cmdRoomalert: 1, cmdRoomkick: 1,
      cmdGiveCredits: 1, cmdGivePixels: 1, cmdGivePoints: 1, cmdGiveBadge: 1,
      cmdChangeName: 1,
      cmdUpdateHotel: 1, cmdUpdateWordfilter: 1, cmdUpdateNavigator: 1,
      cmdUpdatePermissions: 1, cmdUpdateCatalog: 1, cmdUpdateTexts: 1, cmdUpdateConfig: 1,
      cmdEmptyBots: 1, cmdEmptyPets: 1,
      cmdEnable: 1, cmdRoomItem: 1, cmdSay: 1, cmdShout: 1,
      accAnyRoomOwner: 1, accAnyroomrights: 1, accFullaccess: 1, accSupporttool: 1,
      accCatalogadmin: 1, accUnlimitedBots: 1, accUnlimitedPets: 1,
      accHideOnline: 1, accHideIp: 1, accNotBannable: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
    },
  ];

  for (const rank of ranks) {
    await prisma.permission.upsert({
      where:  { id: rank.id },
      update: rank,
      create: rank,
    });
  }
  console.log('  ✓ Permissions created (9 ranks: Normal → Fundador)');

  // ── Admin user ───────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { rank: 9 },
    create: {
      username: 'admin',
      email:    'admin@kodexahotel.com',
      password: adminPassword,
      rank:     9,
      credits:  99999,
      pixels:   99999,
      motto:    'Kodexa Hotel — Fundador',
      look:     'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804',
    },
  });
  console.log('  ✓ Admin user created  (admin / admin123 · rank 9 Fundador)');

  // ── Room models ──────────────────────────────────────
  const roomModels = [
    {
      id: 'model_a', name: 'model_a', doorX: 7, doorY: 0, doorDir: 2,
      heightmap:
        'xxxxxxxxxxxx\n' +
        'x0000000000x\n' +
        'x0000000000x\n' +
        'x0000000000x\n' +
        'x0000000000x\n' +
        'x0000000000x\n' +
        'x0000000000x\n' +
        'x0000000000x\n' +
        'x0000000000x\n' +
        'xxxxxxxxxxxx',
    },
    {
      id: 'model_b', name: 'model_b', doorX: 0, doorY: 1, doorDir: 4,
      heightmap:
        'xxxxxxxxxxxxx\n' +
        'x00000000000x\n' +
        '000000000000x\n' +
        'x00000000000x\n' +
        'x00000000000x\n' +
        'x00000000000x\n' +
        'x00000000000x\n' +
        'xxxxxxxxxxxxx',
    },
    {
      id: 'model_c', name: 'model_c', doorX: 0, doorY: 2, doorDir: 4,
      heightmap:
        'xxxxxxxxxxxxxxx\n' +
        'x0000000000000x\n' +
        '00000000000000x\n' +
        'x0000000000000x\n' +
        'x0000000000000x\n' +
        'x0000000000000x\n' +
        'x0000000000000x\n' +
        'x0000000000000x\n' +
        'x0000000000000x\n' +
        'xxxxxxxxxxxxxxx',
    },
    {
      id: 'model_d', name: 'model_d', doorX: 3, doorY: 0, doorDir: 2,
      heightmap:
        'xxxxxxxx\n' +
        'x000000x\n' +
        'x000000x\n' +
        'x000000x\n' +
        '0000000x\n' +
        'x000000x\n' +
        'x000000x\n' +
        'xxxxxxxx',
    },
    {
      id: 'model_e', name: 'model_e', doorX: 0, doorY: 4, doorDir: 4,
      heightmap:
        'xxxxxxxxxxxxxxxxxxx\n' +
        'x000000000000000000\n' +
        'x000000000000000000\n' +
        'x000000000000000000\n' +
        '0000000000000000000\n' +
        'x000000000000000000\n' +
        'x000000000000000000\n' +
        'x000000000000000000\n' +
        'xxxxxxxxxxxxxxxxxxx',
    },
  ];

  for (const model of roomModels) {
    await prisma.roomModel.upsert({
      where:  { id: model.id },
      update: {},
      create: model,
    });
  }
  console.log('  ✓ Room models created (model_a → model_e)');

  // ── Emulator settings ────────────────────────────────
  const settings = [
    { key: 'hotel.name',          value: 'Kodexa Hotel' },
    { key: 'hotel.motto',         value: 'Next Generation Virtual Hotel' },
    { key: 'hotel.start.room',    value: '1' },
    { key: 'hotel.currency.type', value: '0' },
    { key: 'max.rooms.per.user',  value: '25' },
    { key: 'max.users.per.room',  value: '50' },
    { key: 'credits.starting',    value: '5000' },
    { key: 'pixels.starting',     value: '10000' },
    { key: 'points.starting',     value: '0' },
    { key: 'chat.flood.limit',    value: '5' },
  ];

  for (const setting of settings) {
    await prisma.emulatorSetting.upsert({
      where:  { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('  ✓ Emulator settings created (10 keys)');

  // ── Website settings ─────────────────────────────────
  const websiteSettings = [
    { key: 'hotel_name',              value: 'Kodexa Hotel' },
    { key: 'hotel_description',       value: 'El hotel virtual de nueva generación' },
    { key: 'hotel_motto',             value: 'Next Generation Virtual Hotel' },
    { key: 'max_users',               value: '500' },
    { key: 'start_credits',           value: '5000' },
    { key: 'start_pixels',            value: '10000' },
    { key: 'marketplace_commission',  value: '5' },
    { key: 'registration_open',       value: 'true' },
    { key: 'default_look',            value: 'hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92' },
    { key: 'maintenance_mode',        value: 'false' },
    { key: 'discord_url',             value: '' },
    { key: 'twitter_url',             value: '' },
  ];
  for (const s of websiteSettings) {
    await prisma.websiteSetting.upsert({
      where: { key: s.key }, update: {}, create: s,
    });
  }
  console.log('  ✓ Website settings seeded (12 keys)');

  // ── Wordfilter ───────────────────────────────────────
  const words = [
    { word: 'spam',    replacement: '****', type: 'block' },
    { word: 'hack',    replacement: 'h**k', type: 'replace' },
    { word: 'scam',    replacement: '****', type: 'block' },
    { word: 'hacker',  replacement: '****', type: 'block' },
  ];
  for (const w of words) {
    await prisma.wordfilter.upsert({
      where: { word: w.word }, update: {}, create: w,
    });
  }
  console.log('  ✓ Wordfilter seeded (4 words)');

  console.log('\n✅ Seed completed!');
  console.log('   Login: admin / admin123  (rank 9 — Fundador)');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
