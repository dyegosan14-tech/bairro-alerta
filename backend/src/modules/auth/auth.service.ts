import bcrypt from 'bcryptjs';
import { query } from '../../database/pool.js';
import { User, UserRole, JWTPayload } from '../../types/index.js';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { AuditService } from '../audit/audit.service.js';

export class AuthService {
  static async register(
    input: RegisterInput,
    ipAddress?: string
  ): Promise<{ user: Omit<User, 'password_hash'> }> {
    // 1. Verificar se e-mail já existe
    const existing = await query<User>('SELECT id FROM users WHERE email = $1', [input.email]);
    if (existing.rows.length > 0) {
      const error: any = new Error('Este e-mail já está cadastrado.');
      error.statusCode = 409;
      throw error;
    }

    // 2. Hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // 3. Inserir usuário com papel padrão CITIZEN
    const res = await query<User>(
      `
      INSERT INTO users (name, email, password_hash, role, neighborhood, city)
      VALUES ($1, $2, $3, 'CITIZEN', $4, $5)
      RETURNING id, name, email, role, avatar_url, neighborhood, city, is_active, created_at, updated_at
    `,
      [input.name, input.email, passwordHash, input.neighborhood || null, input.city || 'São Paulo']
    );

    const newUser = res.rows[0];

    // 4. Log de auditoria
    await AuditService.record({
      actor_id: newUser.id,
      actor_email: newUser.email,
      actor_role: newUser.role,
      action: 'USER_REGISTER',
      entity_type: 'USER',
      entity_id: newUser.id,
      new_values: { email: newUser.email, role: newUser.role, name: newUser.name },
      ip_address: ipAddress,
    });

    return { user: newUser };
  }

  static async validateUser(input: LoginInput): Promise<User> {
    const res = await query<User>('SELECT * FROM users WHERE email = $1', [input.email]);
    const user = res.rows[0];

    if (!user || !user.is_active) {
      const error: any = new Error('Credenciais inválidas ou usuário inativo.');
      error.statusCode = 401;
      throw error;
    }

    const isValid = await bcrypt.compare(input.password, user.password_hash || '');
    if (!isValid) {
      const error: any = new Error('Credenciais inválidas.');
      error.statusCode = 401;
      throw error;
    }

    return user;
  }
}
