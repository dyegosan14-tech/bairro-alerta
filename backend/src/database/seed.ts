import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { pool, query } from './pool.js';
import { logger } from '../config/logger.js';
import { runMigrations } from './migrate.js';

export async function runSeed() {
  logger.info('🌱 Populando o banco de dados com dados iniciais e ocorrências geoespaciais...');

  try {
    await runMigrations();

    // 1. Limpar tabelas mantendo estrutura
    await query(`
      TRUNCATE TABLE audit_logs, incident_comments, incident_votes, incident_images, incidents, categories, users CASCADE;
    `);

    // 2. Criar Usuários
    const salt = await bcrypt.genSalt(10);
    const passAdmin = await bcrypt.hash('Admin@123', salt);
    const passMod = await bcrypt.hash('Mod@123', salt);
    const passCitizen = await bcrypt.hash('Cidadao@123', salt);

    const userAdminRes = await query(`
      INSERT INTO users (name, email, password_hash, role, neighborhood, city)
      VALUES ('Administrador Geral', 'admin@vozdebairro.com.br', $1, 'ADMIN', 'Centro', 'São Paulo')
      RETURNING id;
    `, [passAdmin]);
    const adminId = userAdminRes.rows[0].id;

    const userModRes = await query(`
      INSERT INTO users (name, email, password_hash, role, neighborhood, city)
      VALUES ('Lucas Moderador', 'moderador@vozdebairro.com.br', $1, 'MODERATOR', 'Pinheiros', 'São Paulo')
      RETURNING id;
    `, [passMod]);
    const modId = userModRes.rows[0].id;

    const userCitizenRes = await query(`
      INSERT INTO users (name, email, password_hash, role, neighborhood, city)
      VALUES ('Carlos Cidadão', 'cidadao@vozdebairro.com.br', $1, 'CITIZEN', 'Vila Mariana', 'São Paulo')
      RETURNING id;
    `, [passCitizen]);
    const citizenId = userCitizenRes.rows[0].id;

    const userCitizen2Res = await query(`
      INSERT INTO users (name, email, password_hash, role, neighborhood, city)
      VALUES ('Maria Silva', 'maria.silva@exemplo.com.br', $1, 'CITIZEN', 'Bela Vista', 'São Paulo')
      RETURNING id;
    `, [passCitizen]);
    const citizen2Id = userCitizen2Res.rows[0].id;

    // 3. Criar Categorias Urbanas
    const categories = [
      { name: 'Iluminação Pública', slug: 'iluminacao-publica', icon: 'Lightbulb', color: '#EAB308', desc: 'Postes apagados, lâmpadas queimadas ou fiação exposta' },
      { name: 'Buracos e Pavimentação', slug: 'buracos-pavimentacao', icon: 'AlertTriangle', color: '#EF4444', desc: 'Crateras na pista, asfalto cedendo ou calçadas danificadas' },
      { name: 'Lixo e Entulho', slug: 'lixo-entulho', icon: 'Trash2', color: '#10B981', desc: 'Descarte clandestino de lixo, móveis velhos e entulhos de obras' },
      { name: 'Focos de Dengue', slug: 'focos-dengue', icon: 'Bug', color: '#8B5CF6', desc: 'Água parada, terrenos abandonados e possíveis criadouros do Aedes' },
      { name: 'Sinalização e Trânsito', slug: 'sinalizacao-transito', icon: 'ShieldAlert', color: '#F97316', desc: 'Semáforos apagados, placas encobertas ou faixas apagadas' },
      { name: 'Árvores e Praças', slug: 'arvores-pracas', icon: 'Trees', color: '#14B8A6', desc: 'Galhos em risco de queda, árvores sobre fios ou mato alto em praças' },
      { name: 'Água e Saneamento', slug: 'agua-saneamento', icon: 'Droplets', color: '#06B6D4', desc: 'Vazamentos de água potável ou esgoto a céu aberto' },
    ];

    const categoryMap = new Map<string, string>();

    for (const cat of categories) {
      const res = await query(`
        INSERT INTO categories (name, slug, description, icon, color_hex)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `, [cat.name, cat.slug, cat.desc, cat.icon, cat.color]);
      categoryMap.set(cat.slug, res.rows[0].id);
    }

    // 4. Criar Ocorrências Geoespaciais com PostGIS Point(lng, lat)
    const incidents = [
      {
        userId: citizenId,
        categorySlug: 'iluminacao-publica',
        title: 'Poste com lâmpada piscando e apagada há 5 noites',
        desc: 'A rua fica completamente escura à noite, trazendo insegurança para os pedestres que voltam do metrô.',
        lat: -23.5852,
        lng: -46.6388,
        address: 'Rua Domingos de Morais, 1240',
        neighborhood: 'Vila Mariana',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        upvotes: 14,
        img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
        notes: 'Equipe da concessionária de iluminação já acionada sob o protocolo ILUM-2026-881.',
      },
      {
        userId: citizen2Id,
        categorySlug: 'buracos-pavimentacao',
        title: 'Cratera profunda na faixa de ônibus após chuvas',
        desc: 'Buraco com mais de 1 metro de diâmetro na faixa da direita. Vários carros já tiveram pneus furados.',
        lat: -23.5615,
        lng: -46.6912,
        address: 'Av. Brigadeiro Faria Lima, 2100',
        neighborhood: 'Pinheiros',
        status: 'APPROVED',
        priority: 'URGENT',
        upvotes: 38,
        img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        notes: 'Ocorrência validada. Encaminhada à Secretaria Municipal de Infraestrutura Urbana.',
      },
      {
        userId: citizenId,
        categorySlug: 'lixo-entulho',
        title: 'Acúmulo de entulho e sofás velhos na calçada',
        desc: 'Moradores não conseguem transitar pela calçada e pedestres precisam desviar pela rua movimentada.',
        lat: -23.5587,
        lng: -46.6499,
        address: 'Rua Treze de Maio, 550',
        neighborhood: 'Bela Vista',
        status: 'RESOLVED',
        priority: 'MEDIUM',
        upvotes: 9,
        img: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
        notes: 'Equipe de limpeza urbana concluiu o recolhimento com caminhão cata-bagulho.',
      },
      {
        userId: citizen2Id,
        categorySlug: 'focos-dengue',
        title: 'Terreno abandonado com piscina suja e recipientes abertos',
        desc: 'Local com grande acúmulo de água parada, forte cheiro e muitos mosquitos na vizinhança.',
        lat: -23.6025,
        lng: -46.6622,
        address: 'Alameda dos Maracatins, 890',
        neighborhood: 'Moema',
        status: 'PENDING',
        priority: 'HIGH',
        upvotes: 22,
        img: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
        notes: null,
      },
      {
        userId: citizenId,
        categorySlug: 'sinalizacao-transito',
        title: 'Semáforo de pedestres quebrado em frente à escola',
        desc: 'O botão de travessia está solto e o sinal não fica vermelho para os veículos, pondo crianças em perigo.',
        lat: -23.5833,
        lng: -46.6800,
        address: 'Rua Tabapuã, 410',
        neighborhood: 'Itaim Bibi',
        status: 'RESOLVED',
        priority: 'URGENT',
        upvotes: 45,
        img: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80',
        notes: 'Manutenção semafórica concluída pela CET.',
      },
      {
        userId: citizen2Id,
        categorySlug: 'arvores-pracas',
        title: 'Galho de grande porte apoiado sobre fiação de média tensão',
        desc: 'Após a tempestade de ontem, o galho cedeu e está tensionando os cabos elétricos.',
        lat: -23.5350,
        lng: -46.6720,
        address: 'Rua Monte Alegre, 980',
        neighborhood: 'Perdizes',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        upvotes: 19,
        img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
        notes: 'Poda emergencial agendada para hoje.',
      },
    ];

    for (const inc of incidents) {
      const catId = categoryMap.get(inc.categorySlug);
      if (!catId) continue;

      const incRes = await query(`
        INSERT INTO incidents (
          user_id, category_id, title, description,
          location, address_text, neighborhood, city, state,
          status, priority, upvotes_count, moderator_notes,
          moderated_by, moderated_at, resolved_at
        ) VALUES (
          $1, $2, $3, $4,
          ST_SetSRID(ST_MakePoint($5, $6), 4326),
          $7, $8, 'São Paulo', 'SP',
          $9, $10, $11, $12,
          $13,
          CASE WHEN $9 != 'PENDING' THEN CURRENT_TIMESTAMP ELSE NULL END,
          CASE WHEN $9 = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE NULL END
        ) RETURNING id;
      `, [
        inc.userId, catId, inc.title, inc.desc,
        inc.lng, inc.lat, // PostGIS ST_MakePoint recebe (longitude, latitude)
        inc.address, inc.neighborhood,
        inc.status, inc.priority, inc.upvotes, inc.notes,
        inc.status !== 'PENDING' ? modId : null
      ]);

      const incidentId = incRes.rows[0].id;

      // Adicionar imagem
      await query(`
        INSERT INTO incident_images (incident_id, file_url, original_name, mime_type, file_size_bytes)
        VALUES ($1, $2, 'reporte_foto.jpg', 'image/jpeg', 1048576);
      `, [incidentId, inc.img]);

      // Adicionar comentário exemplo
      if (inc.status === 'IN_PROGRESS' || inc.status === 'RESOLVED') {
        await query(`
          INSERT INTO incident_comments (incident_id, user_id, content, is_official_response)
          VALUES ($1, $2, 'Equipe técnica foi mobilizada e está no local atendendo a solicitação.', true);
        `, [incidentId, modId]);
      }

      // Adicionar log de auditoria
      await query(`
        INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, old_values, new_values, ip_address)
        VALUES (
          $1, 'moderador@vozdebairro.com.br', 'MODERATOR',
          'INCIDENT_STATUS_CHANGE', 'INCIDENT', $2,
          '{"status": "PENDING"}', json_build_object('status', $3::text, 'priority', $4::text),
          '192.168.1.50'
        );
      `, [modId, incidentId, inc.status, inc.priority]);
    }

    logger.info('🎉 Base de dados populada com sucesso!');
    logger.info('👤 Credenciais padrão criadas:');
    logger.info('   👉 ADMIN:     admin@vozdebairro.com.br     | Senha: Admin@123');
    logger.info('   👉 MODERADOR: moderador@vozdebairro.com.br | Senha: Mod@123');
    logger.info('   👉 CIDADÃO:   cidadao@vozdebairro.com.br   | Senha: Cidadao@123');

  } catch (error) {
    logger.error({ error }, '❌ Erro ao popular banco de dados');
    throw error;
  }
}

// Se executado via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
