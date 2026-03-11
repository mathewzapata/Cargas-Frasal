import { supabase } from "../supabase.js";

// Verifica que haya sesión activa
const { data: { session } } = await supabase.auth.getSession();
if (!session) window.location.href = "login.html";

// Guarda el usuario actual
const usuarioActual = session?.user;

// Muestra el nombre del usuario en el topbar
const { data: perfil } = await supabase
  .from("perfiles")
  .select("*")
  .eq("id", usuarioActual.id)
  .single();

if (perfil) {
  document.getElementById("usuario-info").textContent =
    `${perfil.nombre} · ${perfil.naviera}`;
}

const barcos = [
  {
    id: 1,
    nombre: "Barcaza Chiloé I",
    icono: "🛥️",
    estado: "navegando",
    origen: "Puerto Montt",
    destino: "Castro, Chiloé",
    eta: "16:45",
    capacidadTotal: 150,
    capacidadUsada: 120,
    cargas: [
      { cliente: "AquaChile S.A.", tipo: "Salmón fresco", peso: 80, guia: "4821" },
      { cliente: "Los Fiordos Ltda.", tipo: "Salmón Coho", peso: 40, guia: "4822" },
    ],
  },
  {
    id: 2,
    nombre: "MN Austral Sur",
    icono: "🚢",
    estado: "navegando",
    origen: "Puerto Montt",
    destino: "Pto. Chacabuco",
    eta: "23:30",
    capacidadTotal: 500,
    capacidadUsada: 490,
    cargas: [
      { cliente: "Biomar Chile", tipo: "Alimento peces", peso: 240, guia: "3301" },
      { cliente: "Multiexport Foods", tipo: "Salmón congelado", peso: 150, guia: "3302" },
      { cliente: "Cermaq Chile", tipo: "Salmón fresco", peso: 100, guia: "3303" },
    ],
  },
  {
    id: 3,
    nombre: "Barcaza Los Fiordos",
    icono: "🛥️",
    estado: "alerta",
    origen: "Calbuco",
    destino: "Puerto Montt",
    eta: "Detenida",
    capacidadTotal: 90,
    capacidadUsada: 85,
    cargas: [
      { cliente: "Camanchaca S.A.", tipo: "Smolts vivos", peso: 85, guia: "2201" },
    ],
  },
  {
    id: 4,
    nombre: "MN Calbuco Express",
    icono: "🚢",
    estado: "cargando",
    origen: "Puerto Montt",
    destino: "Ancud",
    eta: "Zarpe 18:00",
    capacidadTotal: 300,
    capacidadUsada: 210,
    cargas: [
      { cliente: "Mowi Chile S.A.", tipo: "Salmón congelado HG", peso: 210, guia: "5501" },
    ],
  },
];


// ===== NAVEGACIÓN =====
// Esto hace que al hacer click en el menú cambie la vista

const itemsMenu = document.querySelectorAll(".sidebar ul li");

itemsMenu.forEach((item, indice) => {
  item.addEventListener("click", () => {

    // Quita la clase "activo" de todos los items
    itemsMenu.forEach((i) => i.classList.remove("activo"));

    // Agrega "activo" solo al que hiciste click
    item.classList.add("activo");

    // Muestra la sección correspondiente
    if (indice === 0) mostrarFlota();
    if (indice === 1) mostrarManifiestos();
    if (indice === 2) mostrarNuevoZarpe();
    if (indice === 3) mostrarCliente();
    if (indice === 4)mostrarUsuarios();
  });
});


// ===== VISTAS =====

async function mostrarFlota() {
  const contenido = document.querySelector(".contenido");
  contenido.innerHTML = `<p style="color:#64748b;padding:20px">Cargando embarcaciones...</p>`;

  const { data: barcosDB, error } = await supabase
    .from("barcos")
    .select("*, cargas(*)");

  if (error) {
    contenido.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    return;
  }

  // Actualiza también el array global para que funcionen manifiestos y vista cliente
  barcos.length = 0;
  barcosDB.forEach((b) => {
    barcos.push({
      id: b.id,
      nombre: b.nombre,
      icono: b.icono,
      estado: b.estado,
      origen: b.origen,
      destino: b.destino,
      eta: b.eta,
      capacidadTotal: b.capacidad_total,
      capacidadUsada: b.capacidad_usada,
      cargas: b.cargas.map((c) => ({
        cliente: c.cliente,
        tipo: c.tipo,
        peso: c.peso,
        guia: c.guia,
      })),
    });
  });

  let tarjetas = "";

  barcos.forEach((barco) => {
    const porcentaje = Math.round((barco.capacidadUsada / barco.capacidadTotal) * 100);
    const libre = barco.capacidadTotal - barco.capacidadUsada;

    let listaCargass = "";
    barco.cargas.forEach((carga) => {
      listaCargass += `
        <div class="carga-item">
          <span class="carga-nombre">${carga.tipo}</span>
          <span class="carga-cliente">${carga.cliente} · Guía #${carga.guia}</span>
          <span class="carga-peso">${carga.peso}t</span>
        </div>
      `;
    });

    tarjetas += `
      <div class="barco-card barco-${barco.estado}">
        <div class="barco-header">
          <span class="barco-icono">${barco.icono}</span>
          <div class="barco-info">
            <div class="barco-nombre">${barco.nombre}</div>
            <div class="barco-ruta">${barco.origen} → ${barco.destino} · ETA ${barco.eta}</div>
          </div>
<div style="display:flex;gap:8px;align-items:center">
  <span class="estado-badge estado-${barco.estado}">${barco.estado}</span>
  <select class="select-estado" onchange="cambiarEstado(${barco.id}, this.value)">
    <option value="navegando" ${barco.estado === 'navegando' ? 'selected' : ''}>Navegando</option>
    <option value="cargando" ${barco.estado === 'cargando' ? 'selected' : ''}>Cargando</option>
    <option value="atracado" ${barco.estado === 'atracado' ? 'selected' : ''}>Atracado</option>
    <option value="alerta" ${barco.estado === 'alerta' ? 'selected' : ''}>Alerta</option>
  </select>
</div>        </div>
        <div class="barco-capacidad">
          <div class="cap-texto">
            <span>Carga: ${barco.capacidadUsada}t / ${barco.capacidadTotal}t</span>
            <span>${libre}t libres</span>
          </div>
          <div class="cap-barra-wrap">
            <div class="cap-barra cap-${barco.estado}" style="width: ${porcentaje}%"></div>
          </div>
        </div>
        <div class="carga-lista">
          <div class="carga-titulo">Manifiestos a bordo</div>
          ${listaCargass}
        </div>
      </div>
    `;
  });

  contenido.innerHTML = `
    <h1>Flota</h1>
    <p>Estado actual de todas las embarcaciones</p>
    <div class="grilla-barcos">${tarjetas}</div>
  `;
}

function mostrarManifiestos() {
  const contenido = document.querySelector(".contenido");

  // Construimos la lista de todos los manifiestos
  // recorriendo cada barco y sus cargas
  let filas = "";

  barcos.forEach((barco) => {
    barco.cargas.forEach((carga) => {
      filas += `
        <tr class="fila-${barco.estado}">
          <td class="td-guia">#${carga.guia}</td>
          <td>
            <div class="td-cliente">${carga.cliente}</div>
          </td>
          <td>${barco.nombre}</td>
          <td><span class="tipo-badge">${carga.tipo}</span></td>
          <td class="td-peso">${carga.peso}t</td>
          <td>${barco.origen} → ${barco.destino}</td>
          <td><span class="estado-badge estado-${barco.estado}">${barco.estado}</span></td>
          <td>
            <button class="btn-ver" onclick="verDetalle('${carga.guia}')">Ver</button>
          </td>
        </tr>
      `;
    });
  });

  contenido.innerHTML = `
    <div class="seccion-header">
      <div>
        <h1>Manifiestos</h1>
        <p>Registro de toda la carga en tránsito</p>
      </div>
      <button class="btn-exportar">📥 Exportar PDF</button>
    </div>

    <div class="tabla-wrap">
      <table class="tabla">
        <thead>
          <tr>
            <th>Guía</th>
            <th>Cliente</th>
            <th>Embarcación</th>
            <th>Tipo de carga</th>
            <th>Peso</th>
            <th>Ruta</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </div>
  `;
}

function verDetalle(guia) {
  // Busca la carga y el barco correspondiente
  let cargaEncontrada = null;
  let barcoEncontrado = null;

  barcos.forEach((barco) => {
    barco.cargas.forEach((carga) => {
      if (carga.guia === guia) {
        cargaEncontrada = carga;
        barcoEncontrado = barco;
      }
    });
  });

  if (!cargaEncontrada) return;

  const contenido = document.querySelector(".contenido");

  contenido.innerHTML = `
    <div class="seccion-header">
      <div>
        <h1>Guía #${cargaEncontrada.guia}</h1>
        <p>${cargaEncontrada.cliente}</p>
      </div>
      <button class="btn-exportar" onclick="mostrarManifiestos()">← Volver</button>
    </div>

    <div class="detalle-grid">

      <div class="detalle-card">
        <div class="detalle-titulo">Datos de la carga</div>
        <div class="detalle-fila">
          <span>Cliente</span>
          <strong>${cargaEncontrada.cliente}</strong>
        </div>
        <div class="detalle-fila">
          <span>Tipo de carga</span>
          <strong>${cargaEncontrada.tipo}</strong>
        </div>
        <div class="detalle-fila">
          <span>Peso embarcado</span>
          <strong>${cargaEncontrada.peso} toneladas</strong>
        </div>
        <div class="detalle-fila">
          <span>Número de guía</span>
          <strong>#${cargaEncontrada.guia}</strong>
        </div>
      </div>

      <div class="detalle-card">
        <div class="detalle-titulo">Datos de la embarcación</div>
        <div class="detalle-fila">
          <span>Embarcación</span>
          <strong>${barcoEncontrado.nombre}</strong>
        </div>
        <div class="detalle-fila">
          <span>Origen</span>
          <strong>${barcoEncontrado.origen}</strong>
        </div>
        <div class="detalle-fila">
          <span>Destino</span>
          <strong>${barcoEncontrado.destino}</strong>
        </div>
        <div class="detalle-fila">
          <span>ETA</span>
          <strong>${barcoEncontrado.eta}</strong>
        </div>
        <div class="detalle-fila">
          <span>Estado</span>
          <span class="estado-badge estado-${barcoEncontrado.estado}">${barcoEncontrado.estado}</span>
        </div>
      </div>

      <div class="detalle-card detalle-timeline">
        <div class="detalle-titulo">Seguimiento</div>
        <div class="timeline">
          <div class="tl-item tl-hecho">
            <div class="tl-dot"></div>
            <div class="tl-info">
              <div class="tl-titulo">Carga recibida en muelle</div>
              <div class="tl-hora">09:30 hrs</div>
            </div>
          </div>
          <div class="tl-item tl-hecho">
            <div class="tl-dot"></div>
            <div class="tl-info">
              <div class="tl-titulo">Embarcada en ${barcoEncontrado.nombre}</div>
              <div class="tl-hora">11:15 hrs</div>
            </div>
          </div>
          <div class="tl-item tl-actual">
            <div class="tl-dot"></div>
            <div class="tl-info">
              <div class="tl-titulo">En navegación</div>
              <div class="tl-hora">Ahora · ETA ${barcoEncontrado.eta}</div>
            </div>
          </div>
          <div class="tl-item tl-pendiente">
            <div class="tl-dot"></div>
            <div class="tl-info">
              <div class="tl-titulo">Entrega en destino</div>
              <div class="tl-hora">Pendiente</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

function mostrarNuevoZarpe() {
  const contenido = document.querySelector(".contenido");

  contenido.innerHTML = `
    <div class="seccion-header">
      <div>
        <h1>Nuevo Zarpe</h1>
        <p>Registra una embarcación y su carga antes de zarpar</p>
      </div>
    </div>

    <div class="formulario-grid">

      <div class="form-card">
        <div class="form-card-titulo">🚢 Datos de la embarcación</div>

        <div class="form-grupo">
          <label class="form-label">Nombre de la embarcación</label>
          <input type="text" id="inp-nombre" class="form-input" placeholder="Ej: Barcaza Tenglo III">
        </div>

        <div class="form-fila">
          <div class="form-grupo">
            <label class="form-label">Puerto origen</label>
            <select id="inp-origen" class="form-select">
              <option value="">Seleccionar...</option>
              <option>Puerto Montt</option>
              <option>Calbuco</option>
              <option>Angelmó</option>
              <option>Puerto Chacabuco</option>
            </select>
          </div>
          <div class="form-grupo">
            <label class="form-label">Puerto destino</label>
            <select id="inp-destino" class="form-select">
              <option value="">Seleccionar...</option>
              <option>Castro, Chiloé</option>
              <option>Ancud</option>
              <option>Quellón</option>
              <option>Puerto Chacabuco</option>
              <option>Puerto Montt</option>
            </select>
          </div>
        </div>

        <div class="form-fila">
          <div class="form-grupo">
            <label class="form-label">Capacidad total (toneladas)</label>
            <input type="number" id="inp-capacidad" class="form-input" placeholder="Ej: 200">
          </div>
          <div class="form-grupo">
            <label class="form-label">ETA estimado</label>
            <input type="time" id="inp-eta" class="form-input">
          </div>
        </div>
      </div>

      <div class="form-card">
        <div class="form-card-titulo">📦 Datos de la carga</div>

        <div class="form-grupo">
          <label class="form-label">Cliente / Empresa</label>
          <input type="text" id="inp-cliente" class="form-input" placeholder="Ej: AquaChile S.A.">
        </div>

        <div class="form-fila">
          <div class="form-grupo">
            <label class="form-label">Tipo de carga</label>
            <select id="inp-tipo" class="form-select">
              <option value="">Seleccionar...</option>
              <option>Salmón fresco</option>
              <option>Salmón congelado</option>
              <option>Smolts vivos</option>
              <option>Alimento para peces</option>
              <option>Carga general</option>
              <option>Insumos acuícolas</option>
            </select>
          </div>
          <div class="form-grupo">
            <label class="form-label">Peso (toneladas)</label>
            <input type="number" id="inp-peso" class="form-input" placeholder="Ej: 80">
          </div>
        </div>

        <div class="form-grupo">
          <label class="form-label">Número de guía</label>
          <input type="text" id="inp-guia" class="form-input" placeholder="Ej: 5502">
        </div>

        <div class="form-grupo">
          <label class="form-label">Observaciones</label>
          <input type="text" id="inp-obs" class="form-input" placeholder="Notas adicionales...">
        </div>
      </div>

    </div>

    <div id="mensaje-error" class="mensaje-error" style="display:none"></div>

    <div class="form-botones">
      <button class="btn-exportar" onclick="mostrarFlota()">Cancelar</button>
      <button class="btn-registrar" onclick="registrarZarpe()">✅ Registrar zarpe</button>
    </div>
  `;
}

async function registrarZarpe() {
  const nombre    = document.getElementById("inp-nombre").value.trim();
  const origen    = document.getElementById("inp-origen").value;
  const destino   = document.getElementById("inp-destino").value;
  const capacidad = Number(document.getElementById("inp-capacidad").value);
  const eta       = document.getElementById("inp-eta").value;
  const cliente   = document.getElementById("inp-cliente").value.trim();
  const tipo      = document.getElementById("inp-tipo").value;
  const peso      = Number(document.getElementById("inp-peso").value);
  const guia      = document.getElementById("inp-guia").value.trim();

  if (!nombre || !origen || !destino || !capacidad || !eta || !cliente || !tipo || !peso || !guia) {
    const error = document.getElementById("mensaje-error");
    error.textContent = "⚠️ Por favor completa todos los campos obligatorios.";
    error.style.display = "block";
    return;
  }

  // Guarda el barco en Supabase
  const { data: barcoNuevo, error: errorBarco } = await supabase
    .from("barcos")
    .insert({
      nombre: nombre,
      icono: "🚢",
      estado: "cargando",
      origen: origen,
      destino: destino,
      eta: eta,
      capacidad_total: capacidad,
      capacidad_usada: peso,
    })
    .select()
    .single();

  if (errorBarco) {
    const errorDiv = document.getElementById("mensaje-error");
    errorDiv.textContent = "❌ Error al guardar: " + errorBarco.message;
    errorDiv.style.display = "block";
    return;
  }

  // Guarda la carga asociada al barco
  const { error: errorCarga } = await supabase
    .from("cargas")
    .insert({
      barco_id: barcoNuevo.id,
      cliente: cliente,
      tipo: tipo,
      peso: peso,
      guia: guia,
    });

  if (errorCarga) {
    const errorDiv = document.getElementById("mensaje-error");
    errorDiv.textContent = "❌ Error al guardar carga: " + errorCarga.message;
    errorDiv.style.display = "block";
    return;
  }

  alert(`✅ Zarpe registrado. ${nombre} aparece ahora en la flota.`);
  mostrarFlota();
  itemsMenu.forEach((i) => i.classList.remove("activo"));
  itemsMenu[0].classList.add("activo");
}

function mostrarCliente() {
  const contenido = document.querySelector(".contenido");

  // Lista de guías disponibles para buscar
  let opcionesGuias = "";
  barcos.forEach((barco) => {
    barco.cargas.forEach((carga) => {
      opcionesGuias += `<option value="${carga.guia}">#${carga.guia} — ${carga.cliente}</option>`;
    });
  });

  contenido.innerHTML = `
    <div class="seccion-header">
      <div>
        <h1>Vista Cliente</h1>
        <p>Así ve el cliente el estado de su carga</p>
      </div>
    </div>

    <div class="cliente-buscador">
      <div class="buscador-card">
        <div class="buscador-titulo">🔗 Buscar por número de guía</div>
        <p class="buscador-sub">El cliente recibe un link directo — aquí puedes previsualizar cualquier guía</p>
        <div class="buscador-fila">
          <select id="sel-guia" class="form-select">
            ${opcionesGuias}
          </select>
          <button class="btn-registrar" onclick="verSeguimientoCliente()">Ver seguimiento</button>
        </div>
      </div>
    </div>

    <div id="vista-seguimiento"></div>
  `;
}

function verSeguimientoCliente() {
  const guia = document.getElementById("sel-guia").value;

  // Busca la carga
  let cargaEncontrada = null;
  let barcoEncontrado = null;

  barcos.forEach((barco) => {
    barco.cargas.forEach((carga) => {
      if (carga.guia === guia) {
        cargaEncontrada = carga;
        barcoEncontrado = barco;
      }
    });
  });

  if (!cargaEncontrada) return;

  // Define los pasos del timeline según el estado del barco
  const pasos = [
    {
      titulo: "Carga recibida en muelle",
      hora: "09:30 hrs",
      estado: "hecho"
    },
    {
      titulo: `Embarcada en ${barcoEncontrado.nombre}`,
      hora: "11:15 hrs",
      estado: "hecho"
    },
    {
      titulo: "En navegación hacia " + barcoEncontrado.destino,
      hora: barcoEncontrado.estado === "alerta" ? "⚠️ Embarcación detenida" : "Ahora · ETA " + barcoEncontrado.eta,
      estado: barcoEncontrado.estado === "cargando" ? "pendiente" : "actual"
    },
    {
      titulo: "Llegada a " + barcoEncontrado.destino,
      hora: "ETA " + barcoEncontrado.eta,
      estado: "pendiente"
    },
    {
      titulo: "Entrega confirmada",
      hora: "Pendiente · Firma digital del receptor",
      estado: "pendiente"
    },
  ];

  let timelineHTML = "";
  pasos.forEach((paso) => {
    const icono = paso.estado === "hecho" ? "✅" : paso.estado === "actual" ? "🔵" : "⚪";
    timelineHTML += `
      <div class="tl-item tl-${paso.estado}">
        <div class="tl-dot"></div>
        <div class="tl-info">
          <div class="tl-titulo">${icono} ${paso.titulo}</div>
          <div class="tl-hora">${paso.hora}</div>
        </div>
      </div>
    `;
  });

  // Color del estado
  const colorEstado = {
    navegando: "#15803d",
    cargando: "#b45309",
    alerta: "#b91c1c",
    atracado: "#0369a1"
  };

  document.getElementById("vista-seguimiento").innerHTML = `
    <div class="seguimiento-wrap">

      <div class="seguimiento-header" style="border-top: 4px solid ${colorEstado[barcoEncontrado.estado] || '#0369a1'}">
        <div class="seg-titulo">Seguimiento de carga</div>
        <div class="seg-guia">Guía #${cargaEncontrada.guia}</div>
        <div class="seg-cliente">${cargaEncontrada.cliente}</div>
        <span class="estado-badge estado-${barcoEncontrado.estado}" style="margin-top:8px;display:inline-block">
          ${barcoEncontrado.estado}
        </span>
      </div>

      <div class="seguimiento-body">

        <div class="seg-datos">
          <div class="detalle-titulo">Detalle de tu carga</div>
          <div class="detalle-fila">
            <span>Producto</span>
            <strong>${cargaEncontrada.tipo}</strong>
          </div>
          <div class="detalle-fila">
            <span>Peso</span>
            <strong>${cargaEncontrada.peso} toneladas</strong>
          </div>
          <div class="detalle-fila">
            <span>Embarcación</span>
            <strong>${barcoEncontrado.nombre}</strong>
          </div>
          <div class="detalle-fila">
            <span>Origen</span>
            <strong>${barcoEncontrado.origen}</strong>
          </div>
          <div class="detalle-fila">
            <span>Destino</span>
            <strong>${barcoEncontrado.destino}</strong>
          </div>
          <div class="detalle-fila">
            <span>ETA</span>
            <strong>${barcoEncontrado.eta}</strong>
          </div>
        </div>

        <div class="seg-timeline">
          <div class="detalle-titulo">Estado del envío</div>
          <div class="timeline">
            ${timelineHTML}
          </div>
        </div>

      </div>

      <div class="seg-footer">
        <div class="seg-footer-texto">
          📱 El cliente accede a esta vista desde su celular con un link único.<br>
          No necesita crear cuenta ni instalar nada.
        </div>
        <button class="btn-registrar" onclick="copiarLink('${cargaEncontrada.guia}')">
          🔗 Copiar link del cliente
        </button>
      </div>

    </div>
  `;
}

function copiarLink(guia) {
  // En producción esto sería una URL real como:
  // https://carganav.cl/seguimiento?guia=4821
  const linkFalso = `https://carganav.cl/seguimiento?guia=${guia}`;
  navigator.clipboard.writeText(linkFalso);
  alert(`✅ Link copiado:\n${linkFalso}\n\nEn producción este link funcionaría de verdad.`);
}

// Muestra la flota al cargar la página
mostrarFlota();

async function cerrarSesion() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

async function cambiarEstado(barcoId, nuevoEstado) {
  const { error } = await supabase
    .from("barcos")
    .update({ estado: nuevoEstado })
    .eq("id", barcoId);

  if (error) {
    alert("Error al actualizar: " + error.message);
    return;
  }

  // Recarga la flota para mostrar el cambio
  mostrarFlota();
}

function mostrarUsuarios() {
  const contenido = document.querySelector(".contenido");

  contenido.innerHTML = `
    <div class="seccion-header">
      <div>
        <h1>Usuarios</h1>
        <p>Gestiona los accesos al sistema</p>
      </div>
    </div>

    <div class="formulario-grid">
      <div class="form-card">
        <div class="form-card-titulo">➕ Crear nuevo usuario</div>

        <div class="form-grupo">
          <label class="form-label">Nombre completo</label>
          <input type="text" id="usr-nombre" class="form-input" placeholder="Ej: Carlos Pérez">
        </div>

        <div class="form-grupo">
          <label class="form-label">Correo electrónico</label>
          <input type="email" id="usr-email" class="form-input" placeholder="correo@naviera.cl">
        </div>

        <div class="form-grupo">
          <label class="form-label">Contraseña temporal</label>
          <input type="text" id="usr-password" class="form-input" placeholder="Mínimo 6 caracteres">
        </div>

        <div class="form-fila">
          <div class="form-grupo">
            <label class="form-label">Rol</label>
            <select id="usr-rol" class="form-select">
              <option value="capitan">Capitán</option>
              <option value="operador">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div class="form-grupo">
            <label class="form-label">Naviera</label>
            <input type="text" id="usr-naviera" class="form-input" placeholder="Ej: Naviera Austral">
          </div>
        </div>

        <div id="usr-mensaje" class="mensaje-error" style="display:none"></div>

        <button class="btn-registrar" onclick="crearUsuario()">✅ Crear usuario</button>
      </div>

      <div class="form-card">
        <div class="form-card-titulo">👥 Usuarios registrados</div>
        <div id="lista-usuarios">
          <p style="color:#94a3b8;font-size:13px">Cargando...</p>
        </div>
      </div>
    </div>
  `;

  cargarUsuarios();
}

async function cargarUsuarios() {
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return;

  let filas = "";
  data.forEach((u) => {
    filas += `
      <div class="detalle-fila">
        <div>
          <div style="font-weight:700;font-size:13px">${u.nombre}</div>
          <div style="font-size:11px;color:#94a3b8">${u.naviera} · ${u.rol}</div>
        </div>
        <span class="tipo-badge">${u.rol}</span>
      </div>
    `;
  });

  document.getElementById("lista-usuarios").innerHTML = filas || 
    `<p style="color:#94a3b8;font-size:13px">No hay usuarios aún.</p>`;
}

async function crearUsuario() {
  const nombre   = document.getElementById("usr-nombre").value.trim();
  const email    = document.getElementById("usr-email").value.trim();
  const password = document.getElementById("usr-password").value;
  const rol      = document.getElementById("usr-rol").value;
  const naviera  = document.getElementById("usr-naviera").value.trim();
  const msgDiv   = document.getElementById("usr-mensaje");

  if (!nombre || !email || !password || !naviera) {
    msgDiv.textContent = "⚠️ Completa todos los campos.";
    msgDiv.style.display = "block";
    return;
  }

  // Crea el usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, rol, naviera }
    }
  });

  if (error) {
    msgDiv.textContent = "❌ Error: " + error.message;
    msgDiv.style.display = "block";
    return;
  }

  // Crea el perfil en la tabla perfiles
  await supabase.from("perfiles").insert({
    id: data.user.id,
    nombre,
    rol,
    naviera,
  });

  msgDiv.style.background = "#dcfce7";
  msgDiv.style.borderColor = "#86efac";
  msgDiv.style.color = "#15803d";
  msgDiv.textContent = `✅ Usuario ${nombre} creado. Le llegará un email de confirmación.`;
  msgDiv.style.display = "block";

  // Limpia el formulario
  document.getElementById("usr-nombre").value = "";
  document.getElementById("usr-email").value = "";
  document.getElementById("usr-password").value = "";
  document.getElementById("usr-naviera").value = "";

  cargarUsuarios();
}

// Expone las funciones al HTML
window.mostrarFlota = mostrarFlota;
window.mostrarManifiestos = mostrarManifiestos;
window.mostrarNuevoZarpe = mostrarNuevoZarpe;
window.mostrarCliente = mostrarCliente;
window.registrarZarpe = registrarZarpe;
window.verDetalle = verDetalle;
window.verSeguimientoCliente = verSeguimientoCliente;
window.copiarLink = copiarLink;
window.mostrarUsuarios = mostrarUsuarios;
window.crearUsuario = crearUsuario;