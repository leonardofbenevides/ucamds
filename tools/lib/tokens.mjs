// A matemática de token DTCG, em um lugar só.
//
// Vivia dentro de build-tokens.mjs. Saiu de lá em 08/10/2026 porque os sites
// (sites/spec/) precisam da mesma resolução, do mesmo achatamento e da mesma
// expansão de composto — e duas implementações do mesmo cálculo é a classe de
// bug que tools/lib/wcag.mjs já existe para evitar.

/** Anda por `path` dentro de `root`; undefined se o caminho não existe. */
export function lookup(root, path) {
  let cur = root;
  for (const seg of path) cur = cur?.[seg];
  return cur;
}

/** Fecha sobre um primitivo: devolve a função que troca `{grupo.degrau}` pelo valor. */
export function criarResolvedor(primitive) {
  return function resolve(value) {
    if (typeof value !== 'string' || !value.startsWith('{')) return value;
    const node = lookup(primitive, value.replace(/[{}]/g, '').split('.'));
    if (!node || !('$value' in node)) throw new Error(`referência quebrada: ${value}`);
    return node.$value;
  };
}

/** Achata uma árvore DTCG em [{ path, name, ref, value, composite, description, group }]. */
export function flatten(node, resolve, trail = [], out = []) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$') || key.startsWith('_')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      const raw = val.$value;
      out.push({
        path: [...trail, key],
        name: [...trail, key].join('-'),
        ref: typeof raw === 'string' && raw.startsWith('{') ? raw : null,
        value: typeof raw === 'object' ? raw : resolve(raw),
        composite: typeof raw === 'object',
        description: val.$description ?? '',
        group: trail[0] ?? key,
      });
    } else if (val && typeof val === 'object') {
      flatten(val, resolve, [...trail, key], out);
    }
  }
  return out;
}

/** Token composto (tipografia) vira várias custom properties. */
export function expandComposite(t, resolve) {
  return Object.entries(t.value).map(([prop, v]) => ({
    name: `${t.name}-${prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`,
    value: typeof v === 'string' && v.startsWith('{') ? resolve(v) : v,
  }));
}

/** A camada de cima substitui, por nome, o que a de baixo declarou. */
export function aplicarCamada(baseFlat, camadaFlat) {
  const nomes = new Set(camadaFlat.map((t) => t.name));
  return [...baseFlat.filter((t) => !nomes.has(t.name)), ...camadaFlat];
}

export function cssVar(P, t, resolve) {
  if (t.composite) return expandComposite(t, resolve).map((e) => `  --${P}-${e.name}: ${e.value};`).join('\n');
  return `  --${P}-${t.name}: ${t.value};`;
}

export function scssLine(P, t, resolve) {
  if (t.composite) return expandComposite(t, resolve).map((e) => `$${P}-${e.name}: ${e.value};`).join('\n');
  return `$${P}-${t.name}: ${t.value};`;
}
