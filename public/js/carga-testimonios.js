
      // Carga dinámica de testimonios desde el dashboard
      fetch("https://cea-backend-production.up.railway.app/api/public/testimonios")
        .then((r) => r.json())
        .then((t) => {
          [[1], [2], [3]].forEach(([n]) => {
            const txt = document.getElementById("t" + n + "-texto");
            const nombre = document.getElementById("t" + n + "-nombre");
            const curso = document.getElementById("t" + n + "-curso");
            if (txt && t["testimonio_" + n + "_texto"])
              txt.textContent = t["testimonio_" + n + "_texto"];
            if (nombre && t["testimonio_" + n + "_nombre"])
              nombre.textContent = "— " + t["testimonio_" + n + "_nombre"];
            if (curso && t["testimonio_" + n + "_curso"])
              curso.textContent = t["testimonio_" + n + "_curso"];
          });
        })
        .catch(() => {}); // si falla, se quedan los textos del HTML


