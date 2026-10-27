import { AddressInfo } from 'node:net';
import { createServer, Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

let server: Server | undefined;
let baseUrl = '';

export async function startAppServer(): Promise<string> {
  if (process.env.APP_BASE_URL) {
    baseUrl = process.env.APP_BASE_URL;
    return baseUrl;
  }

  const html = await readFile(join(__dirname, '../../demo_app/loans.html'), 'utf8');

  server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');

    if (
      request.method === 'GET' &&
      (url.pathname === '/' || url.pathname === '/loans' || url.pathname === '/index.html')
    ) {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(html);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/admin/loans') {
      readFile(join(__dirname, '../../demo_app/admin_loans.html'), 'utf8')
        .then(adminHtml => {
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          response.end(adminHtml);
        })
        .catch(() => {
          response.writeHead(500, { 'content-type': 'text/plain' });
          response.end('Error loading admin page');
        });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ status: 'ok', service: 'FuBanking Loans Test Server' }));
      return;
    }

    response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'Not found' }));
  });

  await new Promise<void>(resolve => server?.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  return baseUrl;
}

export function appBaseUrl(): string {
  if (!baseUrl) throw new Error('El servidor de pruebas no está iniciado');
  return baseUrl;
}

export async function stopAppServer(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close(error => (error ? reject(error) : resolve()));
  });
  server = undefined;
  baseUrl = '';
}
