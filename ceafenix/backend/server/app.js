// Solo carga .env en desarrollo local — en Railway las variables vienen del sistema
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
}
const express  = require("express");
const cors     = require("cors");
const { Pool } = require("pg");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const path     = require("path");
const fs       = require("fs");

const app    = express();
const PORT   = process.env.PORT || 3000;
const SECRET = process.env.SECRET || "CEA_SECRET_2026";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── CONEXIÓN POSTGRESQL ──────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// Helper: reemplaza db.run / db.get / db.all de SQLite
const db = {
  query: (text, params) => pool.query(text, params),

  run: async (text, params = []) => {
    try { await pool.query(text, params); }
    catch (e) { /* ignorar errores no críticos como ALTER TABLE si ya existe */ }
  },

  get: (text, params, cb) => {
    pool.query(text, params)
      .then(r => cb(null, r.rows[0] || null))
      .catch(e => cb(e, null));
  },

  all: (text, params, cb) => {
    // Soporta db.all(sql, cb) y db.all(sql, params, cb)
    if (typeof params === "function") { cb = params; params = []; }
    pool.query(text, params)
      .then(r => cb(null, r.rows))
      .catch(e => cb(e, []));
  },

  prepare: (text) => ({
    // Simula stmt.run() acumulando y ejecutando cada llamada
    _text: text,
    run: async function(...vals) {
      await pool.query(this._text, vals).catch(e => console.error("stmt.run:", e.message));
    },
    finalize: () => {},
  }),
};

// ─── INIT DATABASE ────────────────────────────────────────────
async function initDB() {
  // Agregar columna snapshot si no existe (migración segura)
  await db.run(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS snapshot TEXT`);

  await db.run(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    full_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    detail TEXT,
    snapshot TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio INTEGER DEFAULT 0,
    descripcion TEXT,
    imagen TEXT,
    whatsapp TEXT,
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS preguntas (
    id SERIAL PRIMARY KEY,
    enunciado TEXT NOT NULL,
    opciones TEXT NOT NULL,
    respuesta_correcta INTEGER NOT NULL DEFAULT 0,
    explicacion TEXT DEFAULT '',
    categoria TEXT DEFAULT 'General',
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS cursos_mocoa (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'licencia',
    emoji TEXT DEFAULT '🎓',
    badge TEXT DEFAULT '',
    descripcion TEXT DEFAULT '',
    horas TEXT DEFAULT '',
    meta2 TEXT DEFAULT '',
    meta3 TEXT DEFAULT 'Certificado',
    precio TEXT DEFAULT 'Consultar',
    wa_texto TEXT DEFAULT 'Inscribirme',
    color TEXT DEFAULT 'ch-lic',
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    categoria TEXT DEFAULT 'General',
    resumen TEXT NOT NULL,
    contenido TEXT DEFAULT '',
    imagen TEXT DEFAULT '',
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS tips (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    icono TEXT DEFAULT 'fa-solid fa-lightbulb',
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  // ── Datos iniciales ──────────────────────────────────────────
  await seedCursosMocoa();
  await seedBlogPosts();
  await seedTips();
  await seedProductos();
  await seedSettings();
  await seedUsers();

  console.log("✅ Base de datos PostgreSQL lista");
}

async function seedCursosMocoa() {
  const { rows } = await pool.query("SELECT COUNT(*) as c FROM cursos_mocoa");
  if (parseInt(rows[0].c) > 0) return;
  const base = [
    { titulo:"A2 — Moto +125cc",          categoria:"licencia",      emoji:"🏍️", badge:"Licencia A2",           descripcion:"Formación completa para conducir motocicletas de alta cilindrada.", horas:"20 horas", meta2:"Teoría + práctica",        meta3:"Certificado",    precio:"$1.200.000", wa_texto:"Inscribirme",      color:"ch-moto", orden:0 },
    { titulo:"B1 — Vehículo Particular",   categoria:"licencia",      emoji:"🚗", badge:"Licencia B1",           descripcion:"Curso para conducir automóvil mecánico y automático.",              horas:"20 horas", meta2:"Mecánico y automático",   meta3:"Certificado",    precio:"$1.200.000", wa_texto:"Inscribirme",      color:"ch-lic",  orden:1 },
    { titulo:"C1 — Servicio Público",      categoria:"licencia",      emoji:"🚕", badge:"Licencia C1",           descripcion:"Habilitación para transporte de pasajeros y carga.",                horas:"24 horas", meta2:"Transporte público",      meta3:"Certificado",    precio:"$1.200.000", wa_texto:"Inscribirme",      color:"ch-pub",  orden:2 },
    { titulo:"Curso de Refuerzo",          categoria:"licencia",      emoji:"🔄", badge:"Todos los niveles",     descripcion:"Para conductores con licencia activa que quieren perfeccionar.",      horas:"10 horas", meta2:"Personalizado",           meta3:"Certificado",    precio:"Consultar",  wa_texto:"Consultar precio", color:"ch-def",  orden:3 },
    { titulo:"Manejo Defensivo",           categoria:"especializado", emoji:"🛡️", badge:"Especializado",         descripcion:"Técnicas avanzadas para anticipar riesgos y reducir accidentes.",     horas:"8 horas",  meta2:"Presencial",              meta3:"Certificado",    precio:"Consultar",  wa_texto:"Inscribirme",      color:"ch-def",  orden:4 },
    { titulo:"Conducción Carga Pesada",    categoria:"especializado", emoji:"🚛", badge:"Licencia C2",           descripcion:"Formación para conductores de camiones y tractomulas.",              horas:"16 horas", meta2:"Presencial",              meta3:"Certificado",    precio:"Consultar",  wa_texto:"Inscribirme",      color:"ch-cargo",orden:5 },
    { titulo:"Primeros Auxilios Viales",   categoria:"especializado", emoji:"🚑", badge:"Obligatorio CEA",       descripcion:"Aprende a actuar ante accidentes de tránsito.",                      horas:"6 horas",  meta2:"Teórico-práctico",        meta3:"Certificado",    precio:"Consultar",  wa_texto:"Inscribirme",      color:"ch-aux",  orden:6 },
    { titulo:"Conducción Eco-eficiente",   categoria:"especializado", emoji:"⛽", badge:"Ahorro de combustible", descripcion:"Técnicas de conducción eficiente para reducir el consumo.",           horas:"4 horas",  meta2:"Teórico",                 meta3:"Certificado",    precio:"Consultar",  wa_texto:"Inscribirme",      color:"ch-moto", orden:7 },
    { titulo:"Diplomado en Seguridad Vial",categoria:"diplomado",     emoji:"🏫", badge:"Diplomado",             descripcion:"Programa completo sobre normas de tránsito y gestión del riesgo.",   horas:"40 horas", meta2:"Presencial/Virtual",      meta3:"Diploma oficial",precio:"Consultar",  wa_texto:"Inscribirme",      color:"ch-dip",  orden:8 },
    { titulo:"Normas de Tránsito — Virtual",categoria:"virtual",      emoji:"📋", badge:"Virtual",               descripcion:"Aprende el Código Nacional de Tránsito desde casa.",                horas:"12 horas", meta2:"100% online",             meta3:"Certificado digital",precio:"Consultar",wa_texto:"Inscribirme",    color:"ch-virt", orden:10 },
  ];
  for (const c of base) {
    await pool.query(
      `INSERT INTO cursos_mocoa(titulo,categoria,emoji,badge,descripcion,horas,meta2,meta3,precio,wa_texto,color,activo,orden) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1,$12)`,
      [c.titulo,c.categoria,c.emoji,c.badge,c.descripcion,c.horas,c.meta2,c.meta3,c.precio,c.wa_texto,c.color,c.orden]
    );
  }
  console.log("✅ Cursos Mocoa insertados");
}

async function seedBlogPosts() {
  const { rows } = await pool.query("SELECT COUNT(*) as c FROM blog_posts");
  if (parseInt(rows[0].c) > 0) return;
  const base = [
    { titulo:"Nuevas señales de tránsito que debes conocer",  categoria:"Normatividad",  resumen:"Aprende las nuevas actualizaciones del manual de tránsito colombiano.", imagen:"/imgs/blog1.jpg" },
    { titulo:"5 consejos para conducir seguro bajo la lluvia", categoria:"Consejos",      resumen:"Técnicas para evitar accidentes en condiciones climáticas difíciles.",    imagen:"/imgs/blog2.jpg" },
    { titulo:"Requisitos actualizados para sacar licencia",    categoria:"Licencias",     resumen:"Todo lo que necesitas para tramitar tu licencia en Colombia.",             imagen:"/imgs/blog3.jpg" },
    { titulo:"Cómo evitar accidentes en motocicleta",          categoria:"Motociclistas", resumen:"Recomendaciones de seguridad vial para conductores de motos.",             imagen:"/imgs/blog4.jpg" },
  ];
  for (const [i, p] of base.entries()) {
    await pool.query(
      `INSERT INTO blog_posts(titulo,categoria,resumen,imagen,activo,orden) VALUES($1,$2,$3,$4,1,$5)`,
      [p.titulo, p.categoria, p.resumen, p.imagen, i]
    );
  }
  console.log("✅ Blog posts insertados");
}

async function seedTips() {
  const { rows } = await pool.query("SELECT COUNT(*) as c FROM tips");
  if (parseInt(rows[0].c) > 0) return;
  const base = [
    { titulo:"Manejo defensivo",  descripcion:"Mantén siempre distancia segura y atención constante.", icono:"fa-solid fa-car" },
    { titulo:"Usa protección",    descripcion:"El casco y cinturón pueden salvar vidas.",               icono:"fa-solid fa-helmet-safety" },
    { titulo:"Respeta señales",   descripcion:"Las señales existen para proteger conductores y peatones.", icono:"fa-solid fa-road" },
  ];
  for (const [i, t] of base.entries()) {
    await pool.query(
      `INSERT INTO tips(titulo,descripcion,icono,activo,orden) VALUES($1,$2,$3,1,$4)`,
      [t.titulo, t.descripcion, t.icono, i]
    );
  }
}

async function seedProductos() {
  const { rows } = await pool.query("SELECT COUNT(*) as c FROM productos");
  if (parseInt(rows[0].c) > 0) return;
  const base = [
    { nombre:"Casco certificado",      precio:250000, imagen:"/imgs/cascos.png",        whatsapp:"573001234567", descripcion:"Casco certificado para motos." },
    { nombre:"Guantes de protección",  precio:80000,  imagen:"/imgs/guantes.png",       whatsapp:"573001234567", descripcion:"Guantes ergonómicos con protección." },
    { nombre:"Chaleco reflectivo",     precio:50000,  imagen:"/imgs/chaleco.png",       whatsapp:"573001234567", descripcion:"Chaleco de alta visibilidad." },
    { nombre:"Rodilleras ProX",        precio:120000, imagen:"/imgs/rodilleras.png",    whatsapp:"573001234567", descripcion:"Rodilleras con protección nivel 2." },
    { nombre:"Chaqueta para él y ella",precio:120000, imagen:"/imgs/chaqueta.png",      whatsapp:"573001234567", descripcion:"Chaqueta con protecciones incorporadas." },
    { nombre:"Kit de carretera",       precio:120000, imagen:"/imgs/kit-carretera.png", whatsapp:"573001234567", descripcion:"Kit completo para viajes." },
    { nombre:"Carpa en poliéster",     precio:120000, imagen:"/imgs/carpa.png",         whatsapp:"573001234567", descripcion:"Carpa impermeable, fácil de armar." },
    { nombre:"Extintor multipropósito",precio:120000, imagen:"/imgs/extintor.png",      whatsapp:"573001234567", descripcion:"Extintor de polvo ABC." },
  ];
  for (const [i, p] of base.entries()) {
    await pool.query(
      `INSERT INTO productos(nombre,precio,descripcion,imagen,whatsapp,activo,orden) VALUES($1,$2,$3,$4,$5,1,$6)`,
      [p.nombre, p.precio, p.descripcion, p.imagen, p.whatsapp, i]
    );
  }
  console.log("✅ Productos insertados");
}

async function seedSettings() {
  const defaults = [
    ["precio_moto","1200000"],["precio_c1","1200000"],["precio_b1","1200000"],
    ["precio_basico","0"],["precio_completo","0"],["precio_refuerzo","0"],
    ["precio_casco","250000"],["precio_guantes","80000"],
    ["precio_chaleco","50000"],["precio_rodilleras","120000"],
    ["precio_chaqueta","120000"],["precio_kit_carretera","120000"],
    ["precio_carpa","120000"],["precio_extintor","120000"],
    ["telefono_principal","3001234567"],["telefono_secundario","3007654321"],
    ["whatsapp","573001234567"],["nombre_escuela","CEA FÉNIX"],
    ["ciudad","Florencia - Caquetá"],["email","contacto@ceafenix.com"],
    ["horario","Lunes a Sábado 8am - 6pm"],["direccion","Calle 10 #8-25, Florencia"],
    ["sede1_nombre","CEA FÉNIX — Sede 1"],["sede1_direccion","Calle 10 #8-25, Florencia"],
    ["sede1_telefono","3001234567"],["sede1_whatsapp","573001234567"],
    ["sede1_horario","Lun–Sáb 8AM–6PM"],["sede1_descripcion","Sede principal de CEA FÉNIX en Florencia, Caquetá."],
    ["sede2_nombre","CEA FÉNIX — Sede 2"],["sede2_direccion","Carrera 5 #12-10, Florencia"],
    ["sede2_telefono","3007654321"],["sede2_whatsapp","573007654321"],
    ["sede2_horario","Lun–Sáb 8AM–6PM"],["sede2_descripcion","Segunda sede en el centro de Florencia."],
    ["sede3_nombre","CEA FÉNIX — Sede 3"],["sede3_direccion","Av. Principal #20-30, Florencia"],
    ["sede3_telefono","3204567890"],["sede3_whatsapp","573204567890"],
    ["sede3_horario","Lun–Sáb 8AM–6PM"],["sede3_descripcion","Sede norte de Florencia, amplio parqueadero."],
    ["mocoa_nombre","La Nacional Mocoa"],["mocoa_direccion","Calle Principal, Centro, Mocoa"],
    ["mocoa_telefono","3001234568"],["mocoa_whatsapp","573001234568"],
    ["mocoa_horario","Lun–Sáb 7AM–6PM"],["mocoa_descripcion","Centro de conducción en Mocoa, Putumayo."],
    ["titulo_moto","A2 Moto +125cc"],["titulo_c1","C1 Servicio Público"],["titulo_b1","B1 Vehículo Particular"],
    ["titulo_basico","Curso Básico"],["titulo_completo","Curso Completo"],["titulo_refuerzo","Curso de Refuerzo"],
    ["desc_moto","Licencia para motocicletas de alta cilindrada."],
    ["desc_c1","Transporte de pasajeros y servicio público."],
    ["desc_b1","Vehículo particular automático y mecánico."],
    ["desc_basico","Curso de introducción al manejo."],
    ["desc_completo","Formación intensiva completa."],
    ["desc_refuerzo","Manejo defensivo y perfeccionamiento."],
    ["home_hero_media_type","image"],["home_hero_src",""],["home_hero_alt",""],
    ["home_hero_title",""],["home_hero_subtitle",""],["home_hero_btn_text",""],["home_hero_btn_link",""],
    ["home_banner_media_type","image"],["home_banner_src",""],["home_banner_alt",""],
    ["home_banner_title",""],["home_banner_desc",""],
    ["home_gallery1_media_type","image"],["home_gallery1_src",""],["home_gallery1_alt",""],
    ["home_gallery2_media_type","image"],["home_gallery2_src",""],["home_gallery2_alt",""],
    ["home_slogan",""],["home_footer_notice",""],
    ["hero_src",""],["hero_titulo",""],["hero_subtitulo",""],
    ["servicios_video_url","https://www.youtube.com/embed/2243U1B6rXQ?autoplay=1&mute=1&loop=1&playlist=2243U1B6rXQ&controls=0&rel=0&showinfo=0&iv_load_policy=3"],
    ["mocoa_curso_1_emoji","🏍️"],["mocoa_curso_1_titulo","A2 — Moto +125cc"],["mocoa_curso_1_precio","1.200.000"],
    ["mocoa_curso_1_desc","Licencia para motocicletas de alta cilindrada."],["mocoa_curso_1_badge","Categoría A2"],
    ["mocoa_curso_2_emoji","🚗"],["mocoa_curso_2_titulo","B1 — Vehículo Particular"],["mocoa_curso_2_precio","1.200.000"],
    ["mocoa_curso_2_desc","Automóvil mecánico y automático."],["mocoa_curso_2_badge","Categoría B1"],
    ["mocoa_curso_3_emoji","🚕"],["mocoa_curso_3_titulo","C1 — Servicio Público"],["mocoa_curso_3_precio","1.200.000"],
    ["mocoa_curso_3_desc","Transporte de pasajeros y carga."],["mocoa_curso_3_badge","Categoría C1"],
    ["mocoa_curso_4_emoji","🛡️"],["mocoa_curso_4_titulo","Curso de Refuerzo"],["mocoa_curso_4_precio","1.200.000"],
    ["mocoa_curso_4_desc","Para conductores activos que quieren mejorar su técnica."],["mocoa_curso_4_badge","Todos los niveles"],
    ["blog_video_1_url","https://www.youtube.com/embed/2243U1B6rXQ"],
    ["blog_video_1_titulo","Técnicas básicas de conducción"],["blog_video_1_desc","Aprende fundamentos esenciales."],
    ["blog_video_2_url","https://www.youtube.com/embed/x5E8hP4S4zQ"],
    ["blog_video_2_titulo","Señales de tránsito explicadas"],["blog_video_2_desc","Aprende a identificar señales reglamentarias."],
    ["testimonio_1_texto","\"Nunca había manejado y hoy ya tengo mi licencia. Los instructores son muy pacientes.\""],
    ["testimonio_1_nombre","Laura Martínez"],["testimonio_1_curso","Curso Automóvil"],
    ["testimonio_2_texto","\"Excelente atención y horarios flexibles. Pasé el examen a la primera.\""],
    ["testimonio_2_nombre","Carlos Gómez"],["testimonio_2_curso","Refrendación de licencia"],
    ["testimonio_3_texto","\"Vehículos en perfecto estado y clases muy claras. Totalmente recomendados.\""],
    ["testimonio_3_nombre","Andrés Rojas"],["testimonio_3_curso","Curso Moto"],
    ["restriccion_activa","0"],["restriccion_hora_inicio","0"],["restriccion_hora_fin","24"],
    ["preguntas_hora_inicio","8"],["preguntas_hora_fin","18"],
    ["promo_activo","0"],["promo_titulo","¡Promoción del mes! 🎉"],
    ["promo_descripcion","Inscríbete este mes y obtén un descuento especial."],
    ["promo_badge","🔥 OFERTA ESPECIAL"],["promo_badge_bg","#ef4444"],["promo_badge_color","#ffffff"],
    ["promo_badge_size","13"],["promo_badge_bold","1"],["promo_badge_align","left"],
    ["promo_media_tipo","imagen"],["promo_media_src",""],
    ["promo_wa_link","https://wa.me/573001234567"],["promo_wa_texto","¡Me interesa!"],
    ["mocoa_promo_activo","0"],["mocoa_promo_titulo","¡Promoción del mes! 🎉"],
    ["mocoa_promo_descripcion","Inscríbete este mes y obtén un descuento especial."],
    ["mocoa_promo_badge","🔥 OFERTA ESPECIAL"],["mocoa_promo_badge_bg","#ef4444"],
    ["mocoa_promo_badge_color","#ffffff"],["mocoa_promo_badge_size","13"],
    ["mocoa_promo_badge_bold","1"],["mocoa_promo_badge_align","left"],
    ["mocoa_promo_media_tipo","imagen"],["mocoa_promo_media_src",""],
    ["mocoa_promo_wa_link","https://wa.me/573001234568"],["mocoa_promo_wa_texto","¡Me interesa!"],
  ];
  for (const [key, value] of defaults) {
    await pool.query(
      `INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING`,
      [key, value]
    );
  }
}

async function seedUsers() {
  const ha = await bcrypt.hash("admin123", 10);
  const hg = await bcrypt.hash("gerente123", 10);
  await pool.query(
    `INSERT INTO users(username,password,role,full_name) VALUES($1,$2,$3,$4) ON CONFLICT(username) DO NOTHING`,
    ["admin", ha, "superadmin", "Administrador"]
  );
  await pool.query(
    `INSERT INTO users(username,password,role,full_name) VALUES($1,$2,$3,$4) ON CONFLICT(username) DO NOTHING`,
    ["gerente", hg, "manager", "Gerente General"]
  );
}

// ─── HELPERS ──────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Token requerido" });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(403).json({ message: "Token inválido o expirado" }); }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "superadmin")
    return res.status(403).json({ message: "Acceso solo para administradores" });
  next();
}

function log(user, action, detail, snapshot = null) {
  pool.query(
    `INSERT INTO audit_log(user_id,username,action,detail,snapshot) VALUES($1,$2,$3,$4,$5)`,
    [user.id, user.username, action, detail, snapshot ? JSON.stringify(snapshot) : null]
  ).catch(e => console.error("log error:", e.message));
}

// ─── RESTRICCIÓN HORARIA ──────────────────────────────────────
async function getRestrictionCfg(keys) {
  const { rows } = await pool.query(
    `SELECT key, value FROM settings WHERE key = ANY($1)`, [keys]
  );
  const cfg = {};
  rows.forEach(r => cfg[r.key] = r.value);
  return cfg;
}

function checkTimeRestriction(req, res, next) {
  if (req.user?.role === "superadmin" && req.headers["x-force-update"] === "1") return next();
  getRestrictionCfg(["restriccion_activa","restriccion_hora_inicio","restriccion_hora_fin"])
    .then(cfg => {
      if (cfg["restriccion_activa"] !== "1") return next();
      const horaInicio = parseInt(cfg["restriccion_hora_inicio"] ?? "0");
      const horaFin    = parseInt(cfg["restriccion_hora_fin"]    ?? "24");
      const now  = new Date();
      const hCOL = (now.getUTCHours() - 5 + 24) % 24;
      const mCOL = now.getUTCMinutes();
      const hActual = hCOL + mCOL / 60;
      if (hActual < horaInicio || hActual >= horaFin) {
        return res.status(403).json({
          message: `⏰ Cambios bloqueados fuera del horario (${String(horaInicio).padStart(2,"0")}:00–${String(horaFin).padStart(2,"0")}:00). Colombia: ${String(hCOL).padStart(2,"0")}:${String(mCOL).padStart(2,"0")}.`,
          restricted: true, allowForce: req.user?.role === "superadmin",
        });
      }
      next();
    }).catch(() => next());
}

function checkPreguntasTimeRestriction(req, res, next) {
  if (req.user?.role === "superadmin" && req.headers["x-force-update"] === "1") return next();
  getRestrictionCfg(["preguntas_restriccion_activa","preguntas_hora_inicio","preguntas_hora_fin"])
    .then(cfg => {
      if (cfg["preguntas_restriccion_activa"] !== "1") return next();
      const horaInicio = parseInt(cfg["preguntas_hora_inicio"] || "8");
      const horaFin    = parseInt(cfg["preguntas_hora_fin"]    || "18");
      const now  = new Date();
      const hCOL = (now.getUTCHours() - 5 + 24) % 24;
      const mCOL = now.getUTCMinutes();
      if ((hCOL + mCOL/60) < horaInicio || (hCOL + mCOL/60) >= horaFin) {
        return res.status(403).json({
          message: `⏰ Edición de preguntas solo entre ${horaInicio}:00 y ${horaFin}:00.`,
          restricted: true, allowForce: req.user?.role === "superadmin",
        });
      }
      next();
    }).catch(() => next());
}

const MEDIA_KEYS = [
  "home_hero_media_type","home_hero_src","home_hero_alt","home_hero_title","home_hero_subtitle","home_hero_btn_text","home_hero_btn_link",
  "home_banner_media_type","home_banner_src","home_banner_alt","home_banner_title","home_banner_desc",
  "home_gallery1_media_type","home_gallery1_src","home_gallery1_alt",
  "home_gallery2_media_type","home_gallery2_src","home_gallery2_alt",
  "home_slogan","home_footer_notice","hero_src","hero_titulo","hero_subtitulo","servicios_video_url",
  "mocoa_curso_1_emoji","mocoa_curso_1_titulo","mocoa_curso_1_precio","mocoa_curso_1_desc","mocoa_curso_1_badge",
  "mocoa_curso_2_emoji","mocoa_curso_2_titulo","mocoa_curso_2_precio","mocoa_curso_2_desc","mocoa_curso_2_badge",
  "mocoa_curso_3_emoji","mocoa_curso_3_titulo","mocoa_curso_3_precio","mocoa_curso_3_desc","mocoa_curso_3_badge",
  "mocoa_curso_4_emoji","mocoa_curso_4_titulo","mocoa_curso_4_precio","mocoa_curso_4_desc","mocoa_curso_4_badge",
  "testimonio_1_texto","testimonio_1_nombre","testimonio_1_curso",
  "testimonio_2_texto","testimonio_2_nombre","testimonio_2_curso",
  "testimonio_3_texto","testimonio_3_nombre","testimonio_3_curso",
  "blog_video_1_url","blog_video_1_titulo","blog_video_1_desc",
  "blog_video_2_url","blog_video_2_titulo","blog_video_2_desc",
  "promo_activo","promo_titulo","promo_descripcion","promo_badge","promo_badge_bg","promo_badge_color",
  "promo_badge_size","promo_badge_bold","promo_badge_align","promo_media_tipo","promo_media_src","promo_wa_link","promo_wa_texto",
  "mocoa_promo_activo","mocoa_promo_titulo","mocoa_promo_descripcion","mocoa_promo_badge",
  "mocoa_promo_badge_bg","mocoa_promo_badge_color","mocoa_promo_badge_size","mocoa_promo_badge_bold","mocoa_promo_badge_align",
  "mocoa_promo_media_tipo","mocoa_promo_media_src","mocoa_promo_wa_link","mocoa_promo_wa_texto",
];

function checkTimeRestrictionSelective(req, res, next) {
  const { updates } = req.body;
  if (!updates) return next();
  const allMedia = Object.keys(updates).every(k => MEDIA_KEYS.includes(k));
  if (allMedia) return next();
  return checkTimeRestriction(req, res, next);
}

function injectAndSaveHTML(filePath, priceMap, prices) {
  let html = fs.readFileSync(filePath, "utf8");
  Object.entries(priceMap).forEach(([htmlId, dbKey]) => {
    const val = prices[dbKey];
    if (!val) return;
    const formatted = "$" + Number(val).toLocaleString("es-CO");
    html = html.replace(
      new RegExp(`(id="${htmlId}")[^>]*>([^<]*)(</)`, "g"),
      `$1>${formatted}$3`
    );
  });
  fs.writeFileSync(filePath, html, "utf8");
  return html;
}

async function getAllPrices() {
  const { rows } = await pool.query("SELECT key, value FROM settings WHERE key LIKE 'precio_%'");
  const prices = {};
  rows.forEach(r => prices[r.key] = r.value);
  return prices;
}

async function getAllSettings() {
  const { rows } = await pool.query("SELECT key, value FROM settings");
  const s = {};
  rows.forEach(r => s[r.key] = r.value);
  return s;
}

// ─── RUTAS ESTÁTICAS ──────────────────────────────────────────
app.get("/dashboard",      (req, res) => res.redirect("/dashboard/login.html"));
app.get("/dashboard/",     (req, res) => res.redirect("/dashboard/login.html"));
app.get("/dashboard.html", (req, res) => res.redirect("/dashboard/login.html"));
app.get("/login.html",     (req, res) => res.redirect("/dashboard/login.html"));

const PUBLIC          = path.join(__dirname, "../../ceafenix/public");
const PUBLIC_LANACIONAL = path.join(__dirname, "../../cealanacional/public");
const UPLOADS_DIR     = path.join(PUBLIC, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Servir imgs para el dashboard (logo, etc)
const BACKEND_PUBLIC = path.join(__dirname, "../public");
if (fs.existsSync(BACKEND_PUBLIC)) {
  app.use(express.static(BACKEND_PUBLIC));
}

function serveSSR(htmlFile, priceMap, req, res) {
  getAllPrices().then(prices => {
    let html = fs.readFileSync(htmlFile, "utf8");
    Object.entries(priceMap).forEach(([htmlId, dbKey]) => {
      const val = prices[dbKey];
      if (!val) return;
      const formatted = "$" + Number(val).toLocaleString("es-CO");
      html = html.replace(
        new RegExp(`(id="${htmlId}")[^>]*>([^<]*)(</)`, "g"),
        `$1>${formatted}$3`
      );
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
}

app.get("/lanacional",  (req, res) => res.sendFile(path.join(PUBLIC_LANACIONAL, "index.html")));
app.get("/lanacional/", (req, res) => res.sendFile(path.join(PUBLIC_LANACIONAL, "index.html")));

app.get("/", (req, res) => serveSSR(
  path.join(PUBLIC, "index.html"),
  { "precio-moto":"precio_moto", "precio-carro-c1":"precio_c1", "precio-carro-b1":"precio_b1" },
  req, res
));
app.get("/pages/store.html", (req, res) => serveSSR(
  path.join(PUBLIC, "pages/store.html"),
  {
    "precio-casco":"precio_casco","precio-guantes":"precio_guantes",
    "precio-chaleco":"precio_chaleco","precio-rodilleras":"precio_rodilleras",
    "precio-chaqueta":"precio_chaqueta","precio-kit-carretera":"precio_kit_carretera",
    "precio-carpa":"precio_carpa","precio-extintor":"precio_extintor",
  },
  req, res
));

app.use("/", express.static(PUBLIC));
app.use("/lanacional", express.static(PUBLIC_LANACIONAL));
app.use("/dashboard", express.static(path.join(__dirname, "../dashboard")));

// ─── UPLOAD DE IMAGEN ─────────────────────────────────────────
app.post("/api/upload-image", auth, (req, res) => {
  const { base64, filename } = req.body;
  if (!base64 || !filename)
    return res.status(400).json({ message: "Faltan datos" });
  const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ message: "Formato de imagen inválido" });
  const ext      = match[1].split("/")[1].replace("jpeg","jpg").replace("svg+xml","svg");
  const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeName);
  try {
    fs.writeFileSync(filePath, Buffer.from(match[2], "base64"));
    res.json({ url: `/uploads/${safeName}`, message: "Imagen subida correctamente" });
  } catch(e) {
    res.status(500).json({ message: "Error al guardar la imagen" });
  }
});

// ─── PUBLIC API ───────────────────────────────────────────────
app.get("/api/public/settings", (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key IN ('whatsapp','telefono_principal','nombre_escuela','ciudad')", (err, rows) => {
    const s = {}; (rows||[]).forEach(r => s[r.key]=r.value); res.json(s);
  });
});
app.get("/api/public/testimonios", (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key LIKE 'testimonio_%'", (err, rows) => {
    const s = {}; (rows||[]).forEach(r => s[r.key]=r.value); res.json(s);
  });
});
app.get("/api/public/promo", (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key LIKE 'promo_%'", (err, rows) => {
    const s = {}; (rows||[]).forEach(r => s[r.key]=r.value); res.json(s);
  });
});
app.get("/api/public/promo-mocoa", (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key LIKE 'mocoa_promo_%'", (err, rows) => {
    const s = {}; (rows||[]).forEach(r => s[r.key]=r.value); res.json(s);
  });
});
app.get("/api/public/prices", (req, res) => {
  getAllPrices().then(p => res.json(p)).catch(() => res.json({}));
});
app.get("/api/public/productos", (req, res) => {
  db.all("SELECT * FROM productos WHERE activo=1 ORDER BY orden ASC, id ASC", (err, rows) => res.json(rows||[]));
});
app.get("/api/public/preguntas", (req, res) => {
  db.all("SELECT * FROM preguntas WHERE activo=1 ORDER BY orden ASC, id ASC", (err, rows) => {
    const parsed = (rows||[]).map(r => ({ ...r, opciones: JSON.parse(r.opciones||"[]") }));
    res.json(parsed);
  });
});
app.get("/api/public/site-media", (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key IN ('hero_src','hero_titulo','hero_subtitulo','servicios_video_url')", (err, rows) => {
    const s = {}; (rows||[]).forEach(r => s[r.key]=r.value); res.json(s);
  });
});
app.get("/api/public/mocoa-cursos", (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key LIKE 'mocoa_curso_%'", (err, rows) => {
    const s = {}; (rows||[]).forEach(r => s[r.key]=r.value); res.json(s);
  });
});
app.get("/api/public/blog-videos", (req, res) => {
  db.all("SELECT key, value FROM settings WHERE key LIKE 'blog_video_%'", (err, rows) => {
    const s = {}; (rows||[]).forEach(r => s[r.key]=r.value); res.json(s);
  });
});
app.get("/api/public/cursos-mocoa", (req, res) => {
  db.all("SELECT * FROM cursos_mocoa WHERE activo=1 ORDER BY orden ASC, id ASC", (err, rows) => res.json(rows||[]));
});
app.get("/api/public/blog", (req, res) => {
  db.all("SELECT * FROM blog_posts WHERE activo=1 ORDER BY orden ASC, id DESC", (err, rows) => res.json(rows||[]));
});
app.get("/api/public/tips", (req, res) => {
  db.all("SELECT * FROM tips WHERE activo=1 ORDER BY orden ASC, id ASC", (err, rows) => res.json(rows||[]));
});

// ─── AUTH ──────────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username=$1", [username], async (err, user) => {
    if (!user) return res.status(401).json({ message: "Usuario no encontrado" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Contraseña incorrecta" });
    const token = jwt.sign(
      { id:user.id, role:user.role, username:user.username, full_name:user.full_name },
      SECRET, { expiresIn:"8h" }
    );
    log(user, "LOGIN", "Inicio de sesión");
    res.json({ token, role:user.role, username:user.username, full_name:user.full_name });
  });
});
app.post("/api/logout", auth, (req, res) => {
  log(req.user, "LOGOUT", "Cierre de sesión");
  res.json({ message: "Sesión cerrada" });
});

// ─── SETTINGS ──────────────────────────────────────────────────
app.get("/api/settings", auth, (req, res) => {
  getAllSettings().then(s => res.json(s)).catch(() => res.json({}));
});

const MANAGER_ALLOWED = [
  "precio_moto","precio_c1","precio_b1","precio_basico","precio_completo","precio_refuerzo",
  "precio_casco","precio_guantes","precio_chaleco","precio_rodilleras",
  "precio_chaqueta","precio_kit_carretera","precio_carpa","precio_extintor",
  "telefono_principal","telefono_secundario","whatsapp","nombre_escuela",
  "titulo_moto","titulo_c1","titulo_b1","titulo_basico","titulo_completo","titulo_refuerzo",
  "desc_moto","desc_c1","desc_b1","desc_basico","desc_completo","desc_refuerzo",
  "sede1_nombre","sede1_direccion","sede1_telefono","sede1_whatsapp","sede1_horario","sede1_descripcion",
  "sede2_nombre","sede2_direccion","sede2_telefono","sede2_whatsapp","sede2_horario","sede2_descripcion",
  "sede3_nombre","sede3_direccion","sede3_telefono","sede3_whatsapp","sede3_horario","sede3_descripcion",
  "mocoa_nombre","mocoa_direccion","mocoa_telefono","mocoa_whatsapp","mocoa_horario","mocoa_descripcion",
  ...MEDIA_KEYS,
];

app.put("/api/settings", auth, checkTimeRestrictionSelective, async (req, res) => {
  const { updates } = req.body;
  const keys = Object.keys(updates);
  if (req.user.role === "manager") {
    const forbidden = keys.filter(k => !MANAGER_ALLOWED.includes(k));
    if (forbidden.length > 0)
      return res.status(403).json({ message: `Sin permiso para editar: ${forbidden.join(", ")}` });
  }
  const prevSettings = await getAllSettings();
  const snapshot = {};
  keys.forEach(k => { snapshot[k] = prevSettings[k]; });

  for (const key of keys) {
    await pool.query(
      `INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2, updated_at=NOW()`,
      [key, updates[key]]
    );
  }

  const hasPrices = keys.some(k => k.startsWith("precio_") || k.startsWith("titulo_") || k.startsWith("desc_"));
  if (hasPrices) {
    const prices = await getAllPrices();
    const merged = { ...prices, ...updates };
    try {
      injectAndSaveHTML(path.join(PUBLIC, "index.html"),
        { "precio-moto":"precio_moto","precio-carro-c1":"precio_c1","precio-carro-b1":"precio_b1" }, merged);
      injectAndSaveHTML(path.join(PUBLIC, "pages/store.html"), {
        "precio-casco":"precio_casco","precio-guantes":"precio_guantes",
        "precio-chaleco":"precio_chaleco","precio-rodilleras":"precio_rodilleras",
        "precio-chaqueta":"precio_chaqueta","precio-kit-carretera":"precio_kit_carretera",
        "precio-carpa":"precio_carpa","precio-extintor":"precio_extintor",
      }, merged);
    } catch(e) { console.error("HTML writeback:", e.message); }
  }
  log(req.user, "UPDATE_SETTINGS", `Actualizó: ${keys.join(", ")}`, snapshot);
  res.json({ message: "Configuración actualizada correctamente" });
});

// ─── DESHACER ACCIÓN ──────────────────────────────────────────
app.post("/api/audit/:id/undo", auth, adminOnly, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM audit_log WHERE id=$1", [req.params.id]);
  const entry = rows[0];
  if (!entry?.snapshot) return res.status(400).json({ message: "No se puede deshacer esta acción" });
  let snapshot;
  try { snapshot = JSON.parse(entry.snapshot); }
  catch { return res.status(400).json({ message: "Snapshot inválido" }); }
  const keys = Object.keys(snapshot);
  for (const key of keys) {
    await pool.query(`UPDATE settings SET value=$1, updated_at=NOW() WHERE key=$2`, [snapshot[key], key]);
  }
  log(req.user, "UNDO_SETTINGS", `Deshizo cambio ID:${req.params.id}`);
  res.json({ message: `Cambios revertidos: ${keys.join(", ")}` });
});

// ─── PRODUCTOS CRUD ───────────────────────────────────────────
app.get("/api/productos", auth, (req, res) => {
  db.all("SELECT * FROM productos ORDER BY orden ASC, id ASC", (err, rows) => res.json(rows||[]));
});
app.post("/api/productos", auth, checkTimeRestriction, async (req, res) => {
  const { nombre, precio, descripcion, imagen, whatsapp, activo, orden } = req.body;
  if (!nombre) return res.status(400).json({ message: "El nombre es requerido" });
  const { rows } = await pool.query(
    `INSERT INTO productos(nombre,precio,descripcion,imagen,whatsapp,activo,orden) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [nombre, precio||0, descripcion||"", imagen||"", whatsapp||"", activo!==false?1:0, orden||0]
  );
  log(req.user, "CREATE_PRODUCTO", `Creó producto: ${nombre}`);
  res.json({ message: "Producto creado", id: rows[0].id });
});
app.put("/api/productos/:id", auth, checkTimeRestriction, async (req, res) => {
  const { nombre, precio, descripcion, imagen, whatsapp, activo, orden } = req.body;
  await pool.query(
    `UPDATE productos SET nombre=$1,precio=$2,descripcion=$3,imagen=$4,whatsapp=$5,activo=$6,orden=$7,updated_at=NOW() WHERE id=$8`,
    [nombre, precio||0, descripcion||"", imagen||"", whatsapp||"", activo!==false?1:0, orden||0, req.params.id]
  );
  log(req.user, "UPDATE_PRODUCTO", `Editó producto ID: ${req.params.id}`);
  res.json({ message: "Producto actualizado" });
});
app.delete("/api/productos/:id", auth, async (req, res) => {
  await pool.query(`DELETE FROM productos WHERE id=$1`, [req.params.id]);
  log(req.user, "DELETE_PRODUCTO", `Eliminó producto ID: ${req.params.id}`);
  res.json({ message: "Producto eliminado" });
});

// ─── CURSOS MOCOA CRUD ────────────────────────────────────────
app.get("/api/cursos-mocoa", auth, (req, res) => {
  db.all("SELECT * FROM cursos_mocoa ORDER BY orden ASC, id ASC", (err, rows) => res.json(rows||[]));
});
app.post("/api/cursos-mocoa", auth, async (req, res) => {
  const { titulo, categoria, emoji, badge, descripcion, horas, meta2, meta3, precio, wa_texto, color, activo, orden } = req.body;
  if (!titulo) return res.status(400).json({ message: "El título es requerido" });
  const { rows } = await pool.query(
    `INSERT INTO cursos_mocoa(titulo,categoria,emoji,badge,descripcion,horas,meta2,meta3,precio,wa_texto,color,activo,orden) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [titulo, categoria||"licencia", emoji||"🎓", badge||"", descripcion||"", horas||"", meta2||"", meta3||"Certificado", precio||"Consultar", wa_texto||"Inscribirme", color||"ch-lic", activo!==false?1:0, orden||0]
  );
  log(req.user, "CREATE_CURSO_MOCOA", `Creó curso: ${titulo}`);
  res.json({ message: "Curso creado", id: rows[0].id });
});
app.put("/api/cursos-mocoa/:id", auth, async (req, res) => {
  const { titulo, categoria, emoji, badge, descripcion, horas, meta2, meta3, precio, wa_texto, color, activo, orden } = req.body;
  if (!titulo) return res.status(400).json({ message: "El título es requerido" });
  await pool.query(
    `UPDATE cursos_mocoa SET titulo=$1,categoria=$2,emoji=$3,badge=$4,descripcion=$5,horas=$6,meta2=$7,meta3=$8,precio=$9,wa_texto=$10,color=$11,activo=$12,orden=$13,updated_at=NOW() WHERE id=$14`,
    [titulo, categoria||"licencia", emoji||"🎓", badge||"", descripcion||"", horas||"", meta2||"", meta3||"Certificado", precio||"Consultar", wa_texto||"Inscribirme", color||"ch-lic", activo!==false?1:0, orden||0, req.params.id]
  );
  log(req.user, "UPDATE_CURSO_MOCOA", `Editó curso ID: ${req.params.id}`);
  res.json({ message: "Curso actualizado" });
});
app.delete("/api/cursos-mocoa/:id", auth, async (req, res) => {
  await pool.query(`DELETE FROM cursos_mocoa WHERE id=$1`, [req.params.id]);
  log(req.user, "DELETE_CURSO_MOCOA", `Eliminó curso ID: ${req.params.id}`);
  res.json({ message: "Curso eliminado" });
});

// ─── BLOG CRUD ────────────────────────────────────────────────
app.get("/api/blog", auth, (req, res) => {
  db.all("SELECT * FROM blog_posts ORDER BY orden ASC, id DESC", (err, rows) => res.json(rows||[]));
});
app.post("/api/blog", auth, async (req, res) => {
  const { titulo, categoria, resumen, contenido, imagen, activo, orden } = req.body;
  if (!titulo || !resumen) return res.status(400).json({ message: "Título y resumen son requeridos" });
  const { rows } = await pool.query(
    `INSERT INTO blog_posts(titulo,categoria,resumen,contenido,imagen,activo,orden) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [titulo, categoria||"General", resumen, contenido||"", imagen||"", activo!==false?1:0, orden||0]
  );
  log(req.user, "CREATE_POST", `Creó post: ${titulo}`);
  res.json({ message: "Post creado", id: rows[0].id });
});
app.put("/api/blog/:id", auth, async (req, res) => {
  const { titulo, categoria, resumen, contenido, imagen, activo, orden } = req.body;
  if (!titulo || !resumen) return res.status(400).json({ message: "Título y resumen son requeridos" });
  await pool.query(
    `UPDATE blog_posts SET titulo=$1,categoria=$2,resumen=$3,contenido=$4,imagen=$5,activo=$6,orden=$7,updated_at=NOW() WHERE id=$8`,
    [titulo, categoria||"General", resumen, contenido||"", imagen||"", activo!==false?1:0, orden||0, req.params.id]
  );
  log(req.user, "UPDATE_POST", `Editó post ID: ${req.params.id}`);
  res.json({ message: "Post actualizado" });
});
app.delete("/api/blog/:id", auth, async (req, res) => {
  await pool.query(`DELETE FROM blog_posts WHERE id=$1`, [req.params.id]);
  log(req.user, "DELETE_POST", `Eliminó post ID: ${req.params.id}`);
  res.json({ message: "Post eliminado" });
});

// ─── TIPS CRUD ────────────────────────────────────────────────
app.get("/api/tips", auth, (req, res) => {
  db.all("SELECT * FROM tips ORDER BY orden ASC, id ASC", (err, rows) => res.json(rows||[]));
});
app.post("/api/tips", auth, async (req, res) => {
  const { titulo, descripcion, icono, activo, orden } = req.body;
  if (!titulo || !descripcion) return res.status(400).json({ message: "Título y descripción son requeridos" });
  const { rows } = await pool.query(
    `INSERT INTO tips(titulo,descripcion,icono,activo,orden) VALUES($1,$2,$3,$4,$5) RETURNING id`,
    [titulo, descripcion, icono||"fa-solid fa-lightbulb", activo!==false?1:0, orden||0]
  );
  log(req.user, "CREATE_TIP", `Creó tip: ${titulo}`);
  res.json({ message: "Tip creado", id: rows[0].id });
});
app.put("/api/tips/:id", auth, async (req, res) => {
  const { titulo, descripcion, icono, activo, orden } = req.body;
  if (!titulo || !descripcion) return res.status(400).json({ message: "Título y descripción son requeridos" });
  await pool.query(
    `UPDATE tips SET titulo=$1,descripcion=$2,icono=$3,activo=$4,orden=$5,updated_at=NOW() WHERE id=$6`,
    [titulo, descripcion, icono||"fa-solid fa-lightbulb", activo!==false?1:0, orden||0, req.params.id]
  );
  log(req.user, "UPDATE_TIP", `Editó tip ID: ${req.params.id}`);
  res.json({ message: "Tip actualizado" });
});
app.delete("/api/tips/:id", auth, async (req, res) => {
  await pool.query(`DELETE FROM tips WHERE id=$1`, [req.params.id]);
  log(req.user, "DELETE_TIP", `Eliminó tip ID: ${req.params.id}`);
  res.json({ message: "Tip eliminado" });
});

// ─── PREGUNTAS CRUD ───────────────────────────────────────────
app.get("/api/preguntas", auth, (req, res) => {
  db.all("SELECT * FROM preguntas ORDER BY orden ASC, id ASC", (err, rows) => {
    res.json((rows||[]).map(r => ({ ...r, opciones: JSON.parse(r.opciones||"[]") })));
  });
});
app.post("/api/preguntas", auth, checkPreguntasTimeRestriction, async (req, res) => {
  const { enunciado, opciones, respuesta_correcta, explicacion, categoria, activo, orden } = req.body;
  if (!enunciado) return res.status(400).json({ message: "El enunciado es requerido" });
  if (!opciones || opciones.length < 2) return res.status(400).json({ message: "Se necesitan al menos 2 opciones" });
  const { rows } = await pool.query(
    `INSERT INTO preguntas(enunciado,opciones,respuesta_correcta,explicacion,categoria,activo,orden,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [enunciado, JSON.stringify(opciones), respuesta_correcta||0, explicacion||"", categoria||"General", activo!==false?1:0, orden||0, req.user.username]
  );
  log(req.user, "CREATE_PREGUNTA", `Creó pregunta: ${enunciado.substring(0,60)}`);
  res.json({ message: "Pregunta creada", id: rows[0].id });
});
app.put("/api/preguntas/:id", auth, checkPreguntasTimeRestriction, async (req, res) => {
  const { enunciado, opciones, respuesta_correcta, explicacion, categoria, activo, orden } = req.body;
  if (!enunciado) return res.status(400).json({ message: "El enunciado es requerido" });
  await pool.query(
    `UPDATE preguntas SET enunciado=$1,opciones=$2,respuesta_correcta=$3,explicacion=$4,categoria=$5,activo=$6,orden=$7,updated_at=NOW() WHERE id=$8`,
    [enunciado, JSON.stringify(opciones), respuesta_correcta||0, explicacion||"", categoria||"General", activo!==false?1:0, orden||0, req.params.id]
  );
  log(req.user, "UPDATE_PREGUNTA", `Editó pregunta ID: ${req.params.id}`);
  res.json({ message: "Pregunta actualizada" });
});
app.delete("/api/preguntas/:id", auth, checkPreguntasTimeRestriction, async (req, res) => {
  await pool.query(`DELETE FROM preguntas WHERE id=$1`, [req.params.id]);
  log(req.user, "DELETE_PREGUNTA", `Eliminó pregunta ID: ${req.params.id}`);
  res.json({ message: "Pregunta eliminada" });
});

// ─── RESTRICCIÓN HORARIA ──────────────────────────────────────
app.get("/api/restriccion", auth, adminOnly, async (req, res) => {
  const cfg = await getRestrictionCfg(["restriccion_activa","restriccion_hora_inicio","restriccion_hora_fin"]);
  res.json({
    activa:      cfg["restriccion_activa"] === "1",
    hora_inicio: parseInt(cfg["restriccion_hora_inicio"] ?? "0"),
    hora_fin:    parseInt(cfg["restriccion_hora_fin"]    ?? "24"),
  });
});
app.put("/api/restriccion", auth, adminOnly, async (req, res) => {
  const { activa, hora_inicio, hora_fin } = req.body;
  for (const [k,v] of [["restriccion_activa", activa?"1":"0"],["restriccion_hora_inicio",String(hora_inicio??0)],["restriccion_hora_fin",String(hora_fin??24)]]) {
    await pool.query(`UPDATE settings SET value=$1, updated_at=NOW() WHERE key=$2`, [v, k]);
  }
  log(req.user, "UPDATE_RESTRICCION", `Restricción: ${activa?"ON":"OFF"} ${hora_inicio}:00–${hora_fin}:00`);
  res.json({ message: "Restricción actualizada" });
});
app.get("/api/preguntas/restriccion", auth, async (req, res) => {
  const cfg = await getRestrictionCfg(["preguntas_restriccion_activa","preguntas_hora_inicio","preguntas_hora_fin"]);
  res.json({
    activa:      cfg["preguntas_restriccion_activa"] === "1",
    hora_inicio: parseInt(cfg["preguntas_hora_inicio"] || "8"),
    hora_fin:    parseInt(cfg["preguntas_hora_fin"]    || "18"),
  });
});
app.put("/api/preguntas/restriccion", auth, adminOnly, async (req, res) => {
  const { activa, hora_inicio, hora_fin } = req.body;
  for (const [k,v] of [["preguntas_restriccion_activa",activa?"1":"0"],["preguntas_hora_inicio",String(hora_inicio??8)],["preguntas_hora_fin",String(hora_fin??18)]]) {
    await pool.query(`UPDATE settings SET value=$1, updated_at=NOW() WHERE key=$2`, [v, k]);
  }
  log(req.user, "UPDATE_RESTRICCION_PREGUNTAS", `Restricción preguntas: ${activa?"ON":"OFF"}`);
  res.json({ message: "Restricción actualizada" });
});

// ─── USERS CRUD ───────────────────────────────────────────────
app.get("/api/users", auth, adminOnly, (req, res) => {
  db.all("SELECT id,username,role,full_name,created_at FROM users", (err, rows) => res.json(rows||[]));
});
app.post("/api/users", auth, adminOnly, async (req, res) => {
  const { username, password, role, full_name } = req.body;
  if (!username||!password||!role) return res.status(400).json({ message:"Faltan campos" });
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users(username,password,role,full_name) VALUES($1,$2,$3,$4) RETURNING id`,
    [username, hash, role, full_name||username]
  ).catch(() => ({ rows: [] }));
  if (!rows[0]) return res.status(400).json({ message:"El usuario ya existe" });
  log(req.user, "CREATE_USER", `Creó usuario: ${username} (${role})`);
  res.json({ message:"Usuario creado", id: rows[0].id });
});
app.put("/api/users/:id", auth, adminOnly, async (req, res) => {
  const { username, password, role, full_name } = req.body;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(`UPDATE users SET username=$1,password=$2,role=$3,full_name=$4 WHERE id=$5`, [username,hash,role,full_name,req.params.id]);
  } else {
    await pool.query(`UPDATE users SET username=$1,role=$2,full_name=$3 WHERE id=$4`, [username,role,full_name,req.params.id]);
  }
  log(req.user, "UPDATE_USER", `Editó usuario ID: ${req.params.id}`);
  res.json({ message:"Usuario actualizado" });
});
app.delete("/api/users/:id", auth, adminOnly, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message:"No puedes eliminarte a ti mismo" });
  await pool.query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
  log(req.user, "DELETE_USER", `Eliminó usuario ID: ${req.params.id}`);
  res.json({ message:"Usuario eliminado" });
});

// ─── AUDIT & STATS ────────────────────────────────────────────
app.get("/api/audit", auth, adminOnly, (req, res) => {
  db.all("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200", (err, rows) => res.json(rows||[]));
});
app.get("/api/stats", auth, async (req, res) => {
  const [u, a, at, p, q, r] = await Promise.all([
    pool.query("SELECT COUNT(*) as count FROM users"),
    pool.query("SELECT COUNT(*) as count FROM audit_log"),
    pool.query("SELECT COUNT(*) as count FROM audit_log WHERE created_at >= NOW() - INTERVAL '1 day'"),
    pool.query("SELECT COUNT(*) as count FROM productos WHERE activo=1"),
    pool.query("SELECT COUNT(*) as count FROM preguntas WHERE activo=1"),
    pool.query("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5"),
  ]);
  res.json({
    total_users:     parseInt(u.rows[0].count),
    total_actions:   parseInt(a.rows[0].count),
    actions_today:   parseInt(at.rows[0].count),
    total_productos: parseInt(p.rows[0].count),
    total_preguntas: parseInt(q.rows[0].count),
    recent_activity: r.rows,
  });
});

// ─── ARRANQUE ─────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CEA FÉNIX en http://localhost:${PORT}`);
    console.log(`   CEA Fénix:   http://localhost:${PORT}/`);
    console.log(`   La Nacional: http://localhost:${PORT}/lanacional`);
    console.log(`   Dashboard:   http://localhost:${PORT}/dashboard/login.html`);
    console.log(`   admin/admin123 | gerente/gerente123\n`);
  });
}).catch(err => {
  console.error("❌ Error iniciando la base de datos:", err.message);
  process.exit(1);
});
