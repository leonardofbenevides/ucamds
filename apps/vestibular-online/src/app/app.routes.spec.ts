import { routes } from './app.routes';

it('o link do legado (/vestibularonline/:oid) continua valendo', () => {
  const r = routes.find((x) => x.path === 'vestibularonline/:oid');
  expect(r?.redirectTo).toBe('candidato/:oid');
});
