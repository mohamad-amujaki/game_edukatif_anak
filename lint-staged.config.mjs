/** §9.1 — satu kali `pnpm check` jika ada berkas ter-stage yang relevan. */
export default {
  '**/*': (filenames) => {
    const relevant = filenames.some(
      (f) =>
        /\.(ts|tsx|js|mjs|cjs|json|css|yml|yaml|mjs)$/i.test(f) &&
        !f.includes('pnpm-lock.yaml'),
    );
    return relevant ? 'pnpm check' : [];
  },
};
