import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { testDbConnection } from './database/pool.js';

async function start() {
  try {
    logger.info('🚀 Iniciando Voz do Bairro API Server...');

    // Testar conectividade com o banco
    const isDbConnected = await testDbConnection();
    if (!isDbConnected) {
      logger.warn(
        '⚠️ O servidor subirá, mas recursos de banco dependem da inicialização do PostgreSQL/PostGIS via Docker.'
      );
    }

    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(
      `✨ Servidor HTTP rodando em: http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}`
    );
    logger.info(`📚 Documentação Swagger interativa em: http://localhost:${env.PORT}/docs`);
    logger.info(`💓 Healthcheck em: http://localhost:${env.PORT}/health`);

    // Graceful Shutdown
    const closeGracefully = async (signal: string) => {
      logger.info(`Recebido sinal ${signal}. Encerrando servidor graciosamente...`);
      await app.close();
      process.exit(0);
    };

    process.on('SIGINT', () => closeGracefully('SIGINT'));
    process.on('SIGTERM', () => closeGracefully('SIGTERM'));
  } catch (error) {
    logger.fatal({ error }, 'Erro fatal ao iniciar a aplicação');
    process.exit(1);
  }
}

start();
