import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Full permission object with explicit defaults — ensures upsert resets all fields correctly
type PermInput = {
  id: number;
  rankName: string;
  badge?: string;
  level: number;
  roomEffect?: number;
  prefix?: string;
  prefixColor?: string;
  // Commands
  cmdAlert?: number; cmdBan?: number; cmdKick?: number; cmdMute?: number;
  cmdUnmute?: number; cmdTeleport?: number; cmdSuperban?: number; cmdIpban?: number;
  cmdDisconnect?: number; cmdRoomalert?: number; cmdRoomkick?: number;
  cmdGiveCredits?: number; cmdGivePixels?: number; cmdGivePoints?: number;
  cmdGiveBadge?: number; cmdChangeName?: number; cmdUpdateHotel?: number;
  cmdUpdateWordfilter?: number; cmdUpdateNavigator?: number;
  cmdUpdatePermissions?: number; cmdUpdateCatalog?: number; cmdUpdateTexts?: number;
  cmdUpdateConfig?: number; cmdEmptyBots?: number; cmdEmptyPets?: number;
  cmdEnable?: number; cmdRoomItem?: number; cmdSay?: number; cmdShout?: number;
  // Accesses
  accAnyRoomOwner?: number; accAnyroomrights?: number; accFullaccess?: number;
  accSupporttool?: number; accCatalogadmin?: number; accMoverotate?: number;
  accTrade?: number; accUnlimitedBots?: number; accUnlimitedPets?: number;
  accHideOnline?: number; accHideIp?: number; accNotBannable?: number;
  accAmbassador?: number; accGuide?: number; accHelperTool?: number;
};

function buildPerm(p: PermInput) {
  return {
    id:           p.id,
    rankName:     p.rankName,
    badge:        p.badge        ?? '',
    level:        p.level,
    roomEffect:   p.roomEffect   ?? 0,
    prefix:       p.prefix       ?? '',
    prefixColor:  p.prefixColor  ?? '',
    // Commands — explicit 0 ensures upsert resets removed perms
    cmdAlert:             p.cmdAlert             ?? 0,
    cmdBan:               p.cmdBan               ?? 0,
    cmdKick:              p.cmdKick              ?? 0,
    cmdMute:              p.cmdMute              ?? 0,
    cmdUnmute:            p.cmdUnmute            ?? 0,
    cmdTeleport:          p.cmdTeleport          ?? 0,
    cmdSuperban:          p.cmdSuperban          ?? 0,
    cmdIpban:             p.cmdIpban             ?? 0,
    cmdDisconnect:        p.cmdDisconnect        ?? 0,
    cmdRoomalert:         p.cmdRoomalert         ?? 0,
    cmdRoomkick:          p.cmdRoomkick          ?? 0,
    cmdGiveCredits:       p.cmdGiveCredits       ?? 0,
    cmdGivePixels:        p.cmdGivePixels        ?? 0,
    cmdGivePoints:        p.cmdGivePoints        ?? 0,
    cmdGiveBadge:         p.cmdGiveBadge         ?? 0,
    cmdChangeName:        p.cmdChangeName        ?? 0,
    cmdUpdateHotel:       p.cmdUpdateHotel       ?? 0,
    cmdUpdateWordfilter:  p.cmdUpdateWordfilter  ?? 0,
    cmdUpdateNavigator:   p.cmdUpdateNavigator   ?? 0,
    cmdUpdatePermissions: p.cmdUpdatePermissions ?? 0,
    cmdUpdateCatalog:     p.cmdUpdateCatalog     ?? 0,
    cmdUpdateTexts:       p.cmdUpdateTexts       ?? 0,
    cmdUpdateConfig:      p.cmdUpdateConfig      ?? 0,
    cmdEmptyBots:         p.cmdEmptyBots         ?? 0,
    cmdEmptyPets:         p.cmdEmptyPets         ?? 0,
    cmdEnable:            p.cmdEnable            ?? 0,
    cmdRoomItem:          p.cmdRoomItem          ?? 0,
    cmdSay:               p.cmdSay               ?? 0,
    cmdShout:             p.cmdShout             ?? 0,
    // Accesses
    accAnyRoomOwner:  p.accAnyRoomOwner  ?? 0,
    accAnyroomrights: p.accAnyroomrights ?? 0,
    accFullaccess:    p.accFullaccess    ?? 0,
    accSupporttool:   p.accSupporttool   ?? 0,
    accCatalogadmin:  p.accCatalogadmin  ?? 0,
    accMoverotate:    p.accMoverotate    ?? 0,
    accTrade:         p.accTrade         ?? 0,
    accUnlimitedBots: p.accUnlimitedBots ?? 0,
    accUnlimitedPets: p.accUnlimitedPets ?? 0,
    accHideOnline:    p.accHideOnline    ?? 0,
    accHideIp:        p.accHideIp        ?? 0,
    accNotBannable:   p.accNotBannable   ?? 0,
    accAmbassador:    p.accAmbassador    ?? 0,
    accGuide:         p.accGuide         ?? 0,
    accHelperTool:    p.accHelperTool    ?? 0,
  };
}

async function main() {
  console.log('🌱 Seeding Kodexa Hotel database...');

  // ── Permissions / ranks (10 niveles oficiales Kodexa.Hotel) ──────────
  //
  // Modelo de rangos sincronizado con:
  //   packages/shared/src/types/ranks.ts
  //   apps/web/src/lib/guards.ts
  //
  //  1 USER          — jugadores normales
  //  2 VIP           — membresía premium
  //  3 HELPER        — ayudantes de comunidad
  //  4 MODERATOR     — moderación básica
  //  5 GAME_MASTER   — moderación avanzada
  //  6 MANAGER       — gestión de hotel
  //  7 ADMIN         — administración completa (/admin accesible)
  //  8 HOTEL_MANAGER — dirección del hotel
  //  9 DEVELOPER     — acceso a /desarrollo
  // 10 FOUNDER       — acceso total + /hotel-beta

  const ranks: PermInput[] = [
    // ── 1: USER ──────────────────────────────────────────────────────────
    {
      id: 1, rankName: 'Normal', badge: '', level: 1,
      accTrade: 1, accMoverotate: 1,
    },

    // ── 2: VIP ───────────────────────────────────────────────────────────
    {
      id: 2, rankName: 'VIP', badge: 'VIP', level: 2, prefixColor: '#F59E0B',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1,
    },

    // ── 3: HELPER ────────────────────────────────────────────────────────
    {
      id: 3, rankName: 'Ayudante', badge: 'HLP', level: 3, prefixColor: '#3B82F6',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
    },

    // ── 4: MODERATOR ─────────────────────────────────────────────────────
    {
      id: 4, rankName: 'Moderador', badge: 'MOD', level: 4, prefixColor: '#10B981',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1, cmdUnmute: 1,
      cmdBan: 1, cmdKick: 1, cmdAlert: 1, cmdRoomalert: 1, cmdTeleport: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
      accSupporttool: 1, accAnyroomrights: 1, accHideIp: 1,
    },

    // ── 5: GAME_MASTER ───────────────────────────────────────────────────
    {
      id: 5, rankName: 'Game Master', badge: 'GM', level: 5, prefixColor: '#F97316',
      accTrade: 1, accMoverotate: 1,
      cmdEnable: 1, cmdMute: 1, cmdUnmute: 1,
      cmdBan: 1, cmdKick: 1, cmdAlert: 1, cmdRoomalert: 1, cmdTeleport: 1,
      cmdSuperban: 1, cmdIpban: 1, cmdDisconnect: 1, cmdRoomkick: 1,
      cmdGiveCredits: 1, cmdGivePixels: 1, cmdGiveBadge: 1,
      accAmbassador: 1, accGuide: 1, accHelperTool: 1,
      accSupporttool: 1, accAnyroomrights: 1, accHideIp: 1,
    },

    // ── 6: MANAGER ───────────────────────────────────────────────────────
    {
      id: 6, rankName: 'Manager', badge: 'MGR', level: 6, prefixColor: '#EC4899',
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

    // ── 7: ADMIN — acceso CMS /admin ──────────────────────────────────────
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

    // ── 8: HOTEL_MANAGER ─────────────────────────────────────────────────
    {
      id: 8, rankName: 'Hotel Manager', badge: 'HM', level: 8, prefixColor: '#8B5CF6',
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

    // ── 9: DEVELOPER — acceso a /desarrollo ───────────────────────────────
    {
      id: 9, rankName: 'Desarrollador', badge: 'DEV', level: 9, prefixColor: '#6366F1',
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

    // ── 10: FOUNDER — máximo acceso + /hotel-beta ─────────────────────────
    {
      id: 10, rankName: 'Fundador', badge: 'OWN', level: 10, prefixColor: '#7C3AED',
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
    const data = buildPerm(rank);
    await prisma.permission.upsert({
      where:  { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log('  ✓ Permissions seeded (10 rangos: Normal → Fundador)');

  // ── Admin user (fallback seed — rank 10) ─────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where:  { username: 'admin' },
    update: { rank: 10 },
    create: {
      username: 'admin',
      email:    'admin@kodexahotel.com',
      password: adminPassword,
      rank:     10,
      credits:  99999,
      pixels:   99999,
      motto:    'Kodexa Hotel — Fundador',
      look:     'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.fa-1201.ca-1804',
    },
  });
  console.log('  ✓ Admin user: admin / admin123 (rank 10 — Fundador)');

  // ── Founder user — garantizar rank 10 ────────────────────────────────
  const founderUpdate = await prisma.user.updateMany({
    where: { email: 'diegomorales11082000@gmail.com' },
    data:  { rank: 10 },
  });
  if (founderUpdate.count > 0) {
    console.log('  ✓ Founder user diegomorales: rank forzado → 10');
  } else {
    console.log('  ℹ Founder user diegomorales: no encontrado (normal si DB vacía)');
  }

  // ── Room models ──────────────────────────────────────────────────────
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
  console.log('  ✓ Room models seeded (model_a → model_e)');

  // ── Emulator settings ────────────────────────────────────────────────
  const emulatorSettings = [
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

  for (const s of emulatorSettings) {
    await prisma.emulatorSetting.upsert({
      where:  { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('  ✓ Emulator settings seeded (10 keys)');

  // ── Website settings ─────────────────────────────────────────────────
  const websiteSettings = [
    { key: 'hotel_name',             value: 'Kodexa Hotel' },
    { key: 'hotel_description',      value: 'El hotel virtual de nueva generación' },
    { key: 'hotel_motto',            value: 'Next Generation Virtual Hotel' },
    { key: 'max_users',              value: '500' },
    { key: 'start_credits',          value: '5000' },
    { key: 'start_pixels',           value: '10000' },
    { key: 'marketplace_commission', value: '5' },
    { key: 'registration_open',      value: 'true' },
    { key: 'default_look',           value: 'hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92' },
    { key: 'maintenance_mode',       value: 'false' },
    { key: 'discord_url',            value: '' },
    { key: 'twitter_url',            value: '' },
  ];
  for (const s of websiteSettings) {
    await prisma.websiteSetting.upsert({
      where:  { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('  ✓ Website settings seeded (12 keys)');

  // ── Wordfilter ───────────────────────────────────────────────────────
  const words = [
    { word: 'spam',   replacement: '****', type: 'block' },
    { word: 'hack',   replacement: 'h**k', type: 'replace' },
    { word: 'scam',   replacement: '****', type: 'block' },
    { word: 'hacker', replacement: '****', type: 'block' },
  ];
  for (const w of words) {
    await prisma.wordfilter.upsert({
      where:  { word: w.word },
      update: {},
      create: w,
    });
  }
  console.log('  ✓ Wordfilter seeded (4 words)');

  console.log('\n✅ Seed completado!');
  console.log('   Rangos:  1-10 (Normal → Fundador)');
  console.log('   Admin:   admin / admin123  (rank 10)');
  console.log('   Founder: diegomorales11082000@gmail.com (rank 10)');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
