// Carga dinámica de cursos Mocoa desde el dashboard
fetch('https://cea-backend-production.up.railway.app/api/public/mocoa-cursos')
  .then(r => r.json())
  .then(c => {
    [1,2,3,4].forEach(n => {
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.textContent = val;
      };
      set('mc'+n+'-emoji',  c['mocoa_curso_'+n+'_emoji']);
      set('mc'+n+'-titulo', c['mocoa_curso_'+n+'_titulo']);
      set('mc'+n+'-precio', c['mocoa_curso_'+n+'_precio']
        ? 'Precio: ' + c['mocoa_curso_'+n+'_precio'] : null);
      set('mc'+n+'-desc',   c['mocoa_curso_'+n+'_desc']);
      set('mc'+n+'-badge',  c['mocoa_curso_'+n+'_badge']);
    });
  })
  .catch(() => {});
