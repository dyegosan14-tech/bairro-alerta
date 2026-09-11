import { describe, it, expect, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { UploadsService } from '../src/modules/uploads/uploads.service.js';

// Assinaturas binárias mínimas e válidas de cada formato aceito.
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const WEBP_HEADER = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
]);
const NOT_AN_IMAGE = Buffer.from('<script>alert(1)</script>', 'utf8');

describe('UploadsService.detectImageType — validação por magic bytes', () => {
  it('reconhece JPEG pela assinatura binária', () => {
    expect(UploadsService.detectImageType(JPEG_HEADER)?.mime).toBe('image/jpeg');
  });

  it('reconhece PNG pela assinatura binária', () => {
    expect(UploadsService.detectImageType(PNG_HEADER)?.mime).toBe('image/png');
  });

  it('reconhece WebP pela assinatura binária (RIFF....WEBP)', () => {
    expect(UploadsService.detectImageType(WEBP_HEADER)?.mime).toBe('image/webp');
  });

  it('rejeita conteúdo que não é nenhum dos formatos aceitos', () => {
    expect(UploadsService.detectImageType(NOT_AN_IMAGE)).toBeNull();
  });

  it('não confia em uma extensão/Content-Type forjados: só o conteúdo real importa', () => {
    // Um arquivo de script disfarçado de imagem não deve passar mesmo se o cliente
    // declarar Content-Type: image/jpeg.
    expect(UploadsService.detectImageType(NOT_AN_IMAGE)).toBeNull();
  });
});

describe('UploadsService.saveImage', () => {
  let tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
    tempDirs = [];
  });

  async function makeTempDir() {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'voz-do-bairro-uploads-test-'));
    tempDirs.push(dir);
    return dir;
  }

  it('salva uma imagem válida com nome gerado aleatoriamente e retorna a URL pública', async () => {
    const dir = await makeTempDir();
    const saved = await UploadsService.saveImage(PNG_HEADER, 'image/png', dir);

    expect(saved.mimeType).toBe('image/png');
    expect(saved.sizeBytes).toBe(PNG_HEADER.length);
    expect(saved.url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);

    const filename = saved.url.replace('/uploads/', '');
    const written = await fs.readFile(path.join(dir, filename));
    expect(written.equals(PNG_HEADER)).toBe(true);
  });

  it('rejeita arquivo cujo conteúdo não é uma imagem suportada (statusCode 415)', async () => {
    const dir = await makeTempDir();
    await expect(UploadsService.saveImage(NOT_AN_IMAGE, 'image/jpeg', dir)).rejects.toMatchObject({
      statusCode: 415,
    });
  });

  it('rejeita quando o Content-Type declarado não bate com o conteúdo real (statusCode 415)', async () => {
    const dir = await makeTempDir();
    await expect(UploadsService.saveImage(PNG_HEADER, 'image/jpeg', dir)).rejects.toMatchObject({
      statusCode: 415,
    });
  });
});
