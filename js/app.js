const SUPABASE_URL = 'https://cmbpbyehmzjzmuqhchzv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtYnBieWVobXpqem11cWhjaHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDQwMjcsImV4cCI6MjEwODYyMDAyN30.j5XAjUUlqsKEax3zO33Hji192aGPcUANp4RwHfG9GXI';


if (
  SUPABASE_URL === 'TU_SUPABASE_URL_AQUI' ||
  SUPABASE_ANON_KEY === 'TU_SUPABASE_ANON_KEY_AQUI'
) {
  throw new Error('Configura SUPABASE_URL y SUPABASE_ANON_KEY antes de iniciar la aplicación.');
}

if (typeof window.supabase?.createClient !== 'function') {
  throw new Error('No se pudo cargar la biblioteca de Supabase.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById('login-form');
const btnLogin = document.getElementById('btn-login');
const messageEl = document.getElementById('message');

const loginContainer = document.querySelector('.login-container');

const dashboardSection = document.getElementById('dashboard-section');
const btnLogout = document.getElementById('btn-logout');
const formServicio = document.getElementById('form-servicio');
const servicioMessage = document.getElementById('servicio-message');
const tablaBody = document.getElementById('tabla-servicios-body');

// Modal asignar transportador
const modalAsignar = document.getElementById('modal-asignar');
const modalBackdrop = document.getElementById('modal-backdrop');
const btnCancelAsignar = document.getElementById('btn-cancel-asignar');
const btnConfirmarAsignar = document.getElementById('btn-confirmar-asignar');
const inputPrecioAsignado = document.getElementById('precio-asignado');
const selectTransportador = document.getElementById('select-transportador');
const modalAsignarMessage = document.getElementById('modal-asignar-message');

// Modal editar precio
const modalEditarPrecio = document.getElementById('modal-editar-precio');
const modalBackdropEditarPrecio = document.getElementById('modal-backdrop-editar-precio');
const btnCancelEditarPrecio = document.getElementById('btn-cancel-editar-precio');
const btnConfirmarEditarPrecio = document.getElementById('btn-confirmar-editar-precio');
const inputPrecioEditar = document.getElementById('precio-editar');
const modalEditarPrecioMessage = document.getElementById('modal-editar-precio-message');

// Modal difundir
const modalDifundir = document.getElementById('modal-difundir');
const modalBackdropDifundir = document.getElementById('modal-backdrop-difundir');
const btnCancelDifundir = document.getElementById('btn-cancel-difundir');
const listaDisponibles = document.getElementById('lista-disponibles');
const modalDifundirMessage = document.getElementById('modal-difundir-message');

let servicioIdParaEditarPrecio = null;

let servicioIdParaAsignar = null;
let servicioIdParaDifundir = null;

// Persistencia de sesión: verificar si ya hay una sesión activa al cargar la página
(async () => {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error('Error verificando sesión:', error);
    return;
  }
  if (session) {
    loginContainer.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    await cargarTransportadores();
    cargarServicios();
  }
})();

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Por favor completa todos los campos.');
    return;
  }

  btnLogin.disabled = true;
  btnLogin.textContent = 'Ingresando...';

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message || 'Error al iniciar sesión.');
      return;
    }

    if (!data.user) {
      alert('No se pudo confirmar el inicio de sesión.');
      return;
    }

    loginContainer.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    messageEl.textContent = `¡Bienvenido, ${data.user.email || email}!`;
    messageEl.className = 'message success';

    await cargarTransportadores();
    cargarServicios();
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Ingresar';
  }
}

async function cargarTransportadores() {
  const { data, error } = await supabaseClient
    .from('transportadores')
    .select('id, nombre, telefono, tipo_vehiculo, disponible')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error cargando transportadores:', error);
    return;
  }

  // Llenar select del modal (solo disponibles)
  selectTransportador.innerHTML = '';
  const opcionVacia = document.createElement('option');
  opcionVacia.value = '';
  opcionVacia.textContent = 'Seleccionar transportador';
  selectTransportador.appendChild(opcionVacia);

  // Render tabla de gestión (todos)
  const tablaTBody = document.getElementById('tabla-transportadores-body');
  tablaTBody.textContent = '';

  if (!data || data.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No hay transportadores disponibles';
    option.disabled = true;
    selectTransportador.appendChild(option);

    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 5;
    celda.textContent = 'No hay transportadores registrados.';
    celda.style.textAlign = 'center';
    celda.style.padding = '20px';
    fila.appendChild(celda);
    tablaTBody.appendChild(fila);
    return;
  }

  data.forEach(transportador => {
    // Opción del modal (solo disponibles)
    if (transportador.disponible) {
      const option = document.createElement('option');
      option.value = transportador.id;
      option.textContent = `${transportador.nombre} (${transportador.tipo_vehiculo})`;
      selectTransportador.appendChild(option);
    }

    // Fila de la tabla de gestión
    const fila = document.createElement('tr');

    const cNombre = document.createElement('td');
    cNombre.textContent = transportador.nombre;
    fila.appendChild(cNombre);

    const cTel = document.createElement('td');
    cTel.textContent = transportador.telefono;
    fila.appendChild(cTel);

    const cVeh = document.createElement('td');
    cVeh.textContent = transportador.tipo_vehiculo;
    fila.appendChild(cVeh);

    const cDisp = document.createElement('td');
    cDisp.textContent = transportador.disponible ? 'Sí' : 'No';
    fila.appendChild(cDisp);

    const cAcc = document.createElement('td');
    const btnDisp = document.createElement('button');
    btnDisp.type = 'button';
    btnDisp.textContent = transportador.disponible ? 'No disponible' : 'Disponible';
    btnDisp.className = transportador.disponible ? 'btn-action btn-dispo-off' : 'btn-action btn-dispo-on';
    btnDisp.addEventListener('click', () => toggleDisponibilidad(transportador.id, transportador.disponible));
    cAcc.appendChild(btnDisp);
    fila.appendChild(cAcc);

    tablaTBody.appendChild(fila);
  });
}

function mostrarMensajeTransportador(texto, tipo = 'error') {
  const el = document.getElementById('transportador-message');
  el.textContent = texto;
  el.className = `message ${tipo}`;
}

async function handleGuardarTransportador(event) {
  event.preventDefault();

  const nombre = document.getElementById('tp-nombre').value.trim();
  const telefono = document.getElementById('tp-telefono').value.trim();
  const tipoVehiculo = document.getElementById('tp-vehiculo').value;

  if (!nombre || !telefono || !tipoVehiculo) {
    mostrarMensajeTransportador('Completa todos los campos.', 'error');
    return;
  }

  if (!/^[0-9]{7,15}$/.test(telefono)) {
    mostrarMensajeTransportador('Teléfono inválido (solo números, 7 a 15 dígitos).', 'error');
    return;
  }

  const btn = document.getElementById('btn-save-transportador');
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  mostrarMensajeTransportador('');

  try {
    const { error } = await supabaseClient
      .from('transportadores')
      .insert([{ nombre, telefono, tipo_vehiculo: tipoVehiculo, disponible: true }]);

    if (error) throw error;

    mostrarMensajeTransportador('Transportador registrado correctamente.', 'success');
    document.getElementById('form-transportador').reset();
    await cargarTransportadores();
  } catch (err) {
    mostrarMensajeTransportador(err instanceof Error ? err.message : 'Error al registrar el transportador.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrar Transportador';
  }
}

async function toggleDisponibilidad(id, estadoActual) {
  const { error } = await supabaseClient
    .from('transportadores')
    .update({ disponible: !estadoActual })
    .eq('id', id);

  if (error) {
    alert(error.message || 'Error al cambiar la disponibilidad.');
    return;
  }

  await cargarTransportadores();
}

function actualizarEstadisticas(data) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const GANANCIA_POR_SERVICIO = 300;

  let serviciosHoy = 0;
  let pendientes = 0;
  let serviciosTotales = 0;

  if (data && data.length > 0) {
    data.forEach(servicio => {
      const fechaServicio = new Date(servicio.fecha_creacion);
      if (fechaServicio >= hoy) {
        serviciosHoy++;
      }

      if (servicio.estado === 'pendiente') {
        pendientes++;
      }

      serviciosTotales++;
    });
  }

  const ingresos = serviciosTotales * GANANCIA_POR_SERVICIO;

  document.getElementById('stat-servicios-hoy').textContent = serviciosHoy;
  document.getElementById('stat-pendientes').textContent = pendientes;
  document.getElementById('stat-ingresos').textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(ingresos);
}

async function cargarServicios() {
  const { data, error } = await supabaseClient
    .from('servicios')
    .select('*, clientes(nombre, telefono), transportadores(id, nombre, telefono, tipo_vehiculo)')
    .order('fecha_creacion', { ascending: false });

  if (error) {
    console.error('Error cargando servicios:', error);
    servicioMessage.textContent = 'Error al cargar los servicios.';
    servicioMessage.className = 'message error';
    return;
  }

  tablaBody.textContent = '';

  if (!data || data.length === 0) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 6;
    celda.textContent = 'No hay servicios registrados.';
    celda.style.textAlign = 'center';
    celda.style.padding = '20px';
    fila.appendChild(celda);
    tablaBody.appendChild(fila);
    actualizarEstadisticas([]);
    servicioMessage.textContent = '';
    return;
  }

  data.forEach(servicio => {
    const fila = document.createElement('tr');

    const celdaCliente = document.createElement('td');
    celdaCliente.textContent = servicio.clientes && servicio.clientes.nombre ? servicio.clientes.nombre : 'Sin cliente';
    fila.appendChild(celdaCliente);

    const celdaTipo = document.createElement('td');
    celdaTipo.textContent = servicio.tipo;
    fila.appendChild(celdaTipo);

    const celdaRuta = document.createElement('td');
    celdaRuta.textContent = `${servicio.origen} → ${servicio.destino}`;
    fila.appendChild(celdaRuta);

    const celdaPrecio = document.createElement('td');
    celdaPrecio.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(servicio.precio);
    fila.appendChild(celdaPrecio);

    const celdaEstado = document.createElement('td');
    celdaEstado.textContent = servicio.estado;
    fila.appendChild(celdaEstado);

    const celdaAcciones = document.createElement('td');

    // Botón Editar Precio (solo si estado es 'pendiente')
    if (servicio.estado === 'pendiente') {
      const btnEditar = document.createElement('button');
      btnEditar.type = 'button';
      btnEditar.textContent = 'Editar';
      btnEditar.className = 'btn-action btn-edit';
      btnEditar.addEventListener('click', () => {
        servicioIdParaEditarPrecio = servicio.id;
        inputPrecioEditar.value = servicio.precio;
        modalEditarPrecioMessage.textContent = '';
        modalEditarPrecio.classList.remove('hidden');
      });
      celdaAcciones.appendChild(btnEditar);
    }

    // Botón Ver Disponibles (solo si estado es 'pendiente')
    if (servicio.estado === 'pendiente') {
      const btnVerDisponibles = document.createElement('button');
      btnVerDisponibles.type = 'button';
      btnVerDisponibles.textContent = 'Ver Disponibles';
      btnVerDisponibles.className = 'btn-action btn-ver-disponibles';
      btnVerDisponibles.addEventListener('click', async () => {
        servicioIdParaDifundir = servicio.id;
        await cargarTransportadoresDisponiblesDifundir();
        modalDifundir.classList.remove('hidden');
      });
      celdaAcciones.appendChild(btnVerDisponibles);
    }

    // Botón Avanzar Estado (según transiciones válidas)
    if (servicio.estado === 'aceptado') {
      const btnEstado = document.createElement('button');
      btnEstado.type = 'button';
      btnEstado.textContent = 'Marcar en Camino';
      btnEstado.className = 'btn-action btn-estado';
      btnEstado.addEventListener('click', async () => {
        await cambiarEstado(servicio.id, 'en_camino');
      });
      celdaAcciones.appendChild(btnEstado);
    } else if (servicio.estado === 'en_camino') {
      const btnEstado = document.createElement('button');
      btnEstado.type = 'button';
      btnEstado.textContent = 'Marcar Terminado';
      btnEstado.className = 'btn-action btn-estado';
      btnEstado.addEventListener('click', async () => {
        await cambiarEstado(servicio.id, 'terminado');
      });
      celdaAcciones.appendChild(btnEstado);
    }
    // pendiente: no se puede avanzar directamente (primero debe asignarse)
    // terminado/cancelado: no se muestra botón de avanzar

    // Botón Cancelar Servicio (solo pendiente o aceptado)
    if (servicio.estado === 'pendiente' || servicio.estado === 'aceptado') {
      const btnCancelar = document.createElement('button');
      btnCancelar.type = 'button';
      btnCancelar.textContent = 'Cancelar Servicio';
      btnCancelar.className = 'btn-action btn-cancel-servicio';
      btnCancelar.addEventListener('click', async () => {
        const confirmado = confirm(`¿Está seguro de cancelar el servicio #${servicio.id}?`);
        if (!confirmado) return;
        await cancelarServicio(servicio.id);
      });
      celdaAcciones.appendChild(btnCancelar);
    }

    // Botón Avisar al cliente (solo si hay transportador asignado y estado es aceptado/en_camino)
    const tieneTransportador = servicio.transportadores && servicio.transportadores.id;
    if (tieneTransportador && (servicio.estado === 'aceptado' || servicio.estado === 'en_camino')) {
      const btnWhatsappCliente = document.createElement('button');
      btnWhatsappCliente.type = 'button';
      btnWhatsappCliente.textContent = 'Avisar al cliente';
      btnWhatsappCliente.className = 'btn-action btn-whatsapp';
      btnWhatsappCliente.addEventListener('click', () => {
        generarEnlaceWhatsAppCliente(servicio);
      });
      celdaAcciones.appendChild(btnWhatsappCliente);
    }

    fila.appendChild(celdaAcciones);
    tablaBody.appendChild(fila);
  });

  actualizarEstadisticas(data);
  servicioMessage.textContent = '';
}

async function asignarTransportador(servicioId, transportadorId, nuevoPrecio) {
  const { error } = await supabaseClient
    .from('servicios')
    .update({
      transportador_id: transportadorId,
      estado: 'aceptado',
      precio: nuevoPrecio
    })
    .eq('id', servicioId);

  if (error) {
    throw error;
  }

  modalAsignar.classList.add('hidden');
  modalBackdrop.classList.add('hidden');
  servicioIdParaAsignar = null;
  selectTransportador.value = '';
  inputPrecioAsignado.value = '';

  await cargarServicios();
}

async function cargarTransportadoresDisponiblesDifundir() {
  const { data, error } = await supabaseClient
    .from('transportadores')
    .select('id, nombre, telefono, tipo_vehiculo, disponible')
    .eq('disponible', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error cargando transportadores disponibles:', error);
    modalDifundirMessage.textContent = 'Error al cargar transportadores.';
    modalDifundirMessage.className = 'message error';
    return;
  }

  listaDisponibles.innerHTML = '';

  if (!data || data.length === 0) {
    const mensaje = document.createElement('p');
    mensaje.textContent = 'No hay transportadores disponibles.';
    mensaje.style.textAlign = 'center';
    mensaje.style.padding = '20px';
    listaDisponibles.appendChild(mensaje);
    return;
  }

  data.forEach(transportador => {
    const fila = document.createElement('div');
    fila.style.display = 'flex';
    fila.style.justifyContent = 'space-between';
    fila.style.alignItems = 'center';
    fila.style.padding = '12px';
    fila.style.borderBottom = '1px solid #e2e8f0';

    const info = document.createElement('span');
    info.textContent = `${transportador.nombre} (${transportador.tipo_vehiculo})`;
    fila.appendChild(info);

    const btnEnviar = document.createElement('button');
    btnEnviar.type = 'button';
    btnEnviar.textContent = `Enviar a ${transportador.nombre}`;
    btnEnviar.className = 'btn-confirm';
    btnEnviar.addEventListener('click', async () => {
      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando...';
      try {
        await enviarWhatsAppDifundir(btnEnviar, servicioIdParaDifundir, transportador.id, transportador.nombre, transportador.telefono);
      } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = `Enviar a ${transportador.nombre}`;
      }
    });
    fila.appendChild(btnEnviar);

    listaDisponibles.appendChild(fila);
  });

  modalDifundirMessage.textContent = '';
}

async function enviarWhatsAppDifundir(btnEnviar, servicioId, transportadorId, nombreTransportador, telefono) {
  if (!telefono) {
    alert(`El transportador ${nombreTransportador} no tiene un teléfono registrado.`);
    return;
  }

  // Obtener datos del servicio para saber si tiene precio asignado
  const { data: servicioData, error: servicioError } = await supabaseClient
    .from('servicios')
    .select('precio')
    .eq('id', servicioId)
    .single();

  if (servicioError) {
    console.error('Error obteniendo datos del servicio:', servicioError);
    alert('Error al obtener los datos del servicio.');
    return;
  }

  const telefonoLimpio = telefono.replace(/\D/g, '');
  const enlace = `${window.location.origin}/transportador.html?id=${servicioId}`;

  let mensaje;
  if (servicioData && servicioData.precio) {
    const precioFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(servicioData.precio);
    mensaje = `Hola ${nombreTransportador}, hay un nuevo pedido. Si lo puedes atender, abre este enlace para aceptarlo: ${enlace}. Valor propuesto a cobrar/ganar: $ ${precioFormateado}.`;
  } else {
    mensaje = `Hola ${nombreTransportador}, hay un nuevo pedido. Si lo puedes atender, abre este enlace para aceptarlo: ${enlace}. Favor responder con el valor/cotización para atender el servicio.`;
  }

  const urlWhatsApp = `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;

  try {
    const { error } = await supabaseClient
      .from('servicios')
      .update({
        transportador_id: transportadorId,
        estado: 'aceptado',
      })
      .eq('id', servicioId);

    if (error) {
      throw error;
    }

    window.open(urlWhatsApp, '_blank');
    modalDifundir.classList.add('hidden');
    listaDisponibles.innerHTML = '';
    modalDifundirMessage.textContent = '';
    await cargarServicios();
  } catch (err) {
    console.error('Error al asignar transportador:', err);
    alert(`Error al asignar el servicio: ${err.message || 'Error desconocido'}`);
  }
}

function normalizarTelefonoCO(telefono) {
  const digitos = (telefono || '').replace(/\D/g, '');
  if (digitos.length === 10 && digitos.startsWith('3')) {
    return '57' + digitos;
  }
  if (digitos.length === 12 && digitos.startsWith('57')) {
    return digitos;
  }
  return null;
}

function generarEnlaceWhatsApp(servicio) {
  const transportador = servicio.transportadores || {};
  const telefonoNormalizado = normalizarTelefonoCO(transportador.telefono);
  const nombreTransportador = transportador.nombre || 'Transportador';
  const precioFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(servicio.precio);

  const mensaje = `Hola ${nombreTransportador}, hay un nuevo pedido. Si lo puedes atender. Valor propuesto a cobrar/ganar: $ ${precioFormateado}.`;

  const url = `https://wa.me/${telefonoNormalizado}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

function generarEnlaceWhatsAppCliente(servicio) {
  const cliente = servicio.clientes || {};
  const telefonoNormalizado = normalizarTelefonoCO(cliente.telefono);

  if (!telefonoNormalizado) {
    alert('El cliente no tiene un teléfono válido para enviar por WhatsApp.');
    return;
  }

  const transportador = servicio.transportadores || {};
  const precioFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(servicio.precio);

  const mensaje = `Hola ${cliente.nombre || 'Cliente'}, tu servicio fue asignado. Transportador: ${transportador.nombre || 'Sin asignar'} (${transportador.tipo_vehiculo || '-'} ). Recogida: ${servicio.origen}. Entrega: ${servicio.destino}. Precio acordado: ${precioFormateado}. Por favor confírmanos si estás de acuerdo.`;

  const url = `https://wa.me/${telefonoNormalizado}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

async function cancelarServicio(servicioId) {
  const { error } = await supabaseClient
    .from('servicios')
    .update({ estado: 'cancelado' })
    .eq('id', servicioId);

  if (error) {
    alert(error.message || 'Error al cancelar el servicio.');
    return;
  }

  await cargarServicios();
}

async function handleGuardarPrecioEdicion(event) {
  event.preventDefault();

  const servicioId = servicioIdParaEditarPrecio;
  const precio = parseInt(inputPrecioEditar.value, 10);

  if (!servicioId) {
    modalEditarPrecioMessage.textContent = 'Error: servicio no identificado.';
    modalEditarPrecioMessage.className = 'message error';
    return;
  }

  if (isNaN(precio) || precio <= 0) {
    modalEditarPrecioMessage.textContent = 'Ingresa un precio válido mayor a 0.';
    modalEditarPrecioMessage.className = 'message error';
    return;
  }

  btnConfirmarEditarPrecio.disabled = true;
  btnConfirmarEditarPrecio.textContent = 'Guardando...';
  modalEditarPrecioMessage.textContent = '';

  try {
    const { error } = await supabaseClient
      .from('servicios')
      .update({ precio })
      .eq('id', servicioId);

    if (error) throw error;

    modalEditarPrecio.classList.add('hidden');
    modalBackdropEditarPrecio.classList.add('hidden');
    modalEditarPrecioMessage.textContent = '';
    inputPrecioEditar.value = '';

    cargarServicios();
  } catch (err) {
    modalEditarPrecioMessage.textContent = err instanceof Error ? err.message : 'Error al actualizar el precio.';
    modalEditarPrecioMessage.className = 'message error';
  } finally {
    btnConfirmarEditarPrecio.disabled = false;
    btnConfirmarEditarPrecio.textContent = 'Guardar';
  }
}

async function cambiarEstado(servicioId, nuevoEstado) {
  let precioFinal = null;

  // Si el estado es aceptado o en_camino, solicitar precio al administrador
  if (nuevoEstado === 'aceptado' || nuevoEstado === 'en_camino') {
    const precioInput = prompt('Ingrese el precio final acordado con el transportador (COP):');
    if (precioInput === null) {
      // El usuario canceló el prompt
      return;
    }

    precioFinal = parseInt(precioInput, 10);
    if (isNaN(precioFinal) || precioFinal <= 0) {
      alert('Ingrese un precio válido mayor a 0.');
      return;
    }

    // Guardar el precio antes de cambiar el estado
    const { error: precioError } = await supabaseClient
      .from('servicios')
      .update({ precio: precioFinal })
      .eq('id', servicioId);

    if (precioError) {
      alert(`Error al guardar el precio: ${precioError.message || 'Error desconocido'}`);
      return;
    }
  }

  const { error } = await supabaseClient
    .from('servicios')
    .update({ estado: nuevoEstado })
    .eq('id', servicioId);

  if (error) {
    alert(error.message || 'Error al cambiar el estado.');
    return;
  }

  // Si el estado es en_camino, notificar al cliente por WhatsApp
  if (nuevoEstado === 'en_camino') {
    const { data: servicioData } = await supabaseClient
      .from('servicios')
      .select('*, clientes(nombre, telefono), transportadores(nombre)')
      .eq('id', servicioId)
      .single();

    if (servicioData && servicioData.clientes && servicioData.clientes.telefono) {
      generarEnlaceWhatsAppCliente(servicioData);
    }
  }

  await cargarServicios();
}

const LUGARES = [
  'Parque',
  'Carmelo',
  'Urb Crucero',
  'Mellizas',
  'Tecnológico',
  'Urb Montenegro',
  'Puente Poblano',
  'Hostería Confenalco',
  'Dinastías',
  'Planchón',
  'Calle Vieja Tanques',
  'Los Cedros',
  'Guayacanes',
  'Portada Guyco',
  'Barrio Colombia',
  'Buena Vista',
  'Platanera Doble Calzada',
  '13 de Junio Parque',
  'La 40',
  'Buenos Aires',
  'Terpel',
  'Cartama',
  'Ventanas',
];

const ORIGENES_EXTRA = ['Plazoleta', 'El Crucero'];

const TARIFAS_BASE = {
  Parque: 4000,
  Carmelo: 5000,
  'Urb Crucero': 5000,
  Mellizas: 6000,
  Tecnológico: 6000,
  'Urb Montenegro': 6000,
  'Puente Poblano': 8000,
  'Hostería Confenalco': 5000,
  Dinastías: 6000,
  Planchón: 6000,
  'Calle Vieja Tanques': 8000,
  'Los Cedros': 16000,
  Guayacanes: 4000,
  'Portada Guyco': 15000,
  'Barrio Colombia': 4000,
  'Buena Vista': 4000,
  'Platanera Doble Calzada': 10000,
  '13 de Junio Parque': 4000,
  'La 40': 4000,
  'Buenos Aires': 5000,
  Terpel: 8000,
  Cartama: 17000,
  Ventanas: 15000,
};

function llenarSelectsOrigenDestino() {
  const origenSelect = document.getElementById('servicio-origen');
  const destinoSelect = document.getElementById('servicio-destino');

  origenSelect.innerHTML = '<option value="">Seleccionar origen</option>';
  destinoSelect.innerHTML = '<option value="" disabled selected>Seleccione un destino</option>';

  const todosOrigenes = [...ORIGENES_EXTRA, ...LUGARES];

  todosOrigenes.forEach(lugar => {
    const opcionOrigen = document.createElement('option');
    opcionOrigen.value = lugar;
    opcionOrigen.textContent = lugar;
    origenSelect.appendChild(opcionOrigen);

    const opcionDestino = document.createElement('option');
    opcionDestino.value = lugar;
    opcionDestino.textContent = lugar;
    destinoSelect.appendChild(opcionDestino);
  });
}

llenarSelectsOrigenDestino();

const selectOrigen = document.getElementById('servicio-origen');

const inputPrecio = document.getElementById('servicio-precio');
const selectDestino = document.getElementById('servicio-destino');

function actualizarPrecioPorOrigenDestino() {
  const origen = selectOrigen.value;
  const destino = selectDestino.value;

  if (!origen || !destino) {
    return;
  }

  if (origen === 'Plazoleta' && TARIFAS_BASE[destino]) {
    inputPrecio.value = TARIFAS_BASE[destino];
  }
}

selectDestino.addEventListener('change', actualizarPrecioPorOrigenDestino);
selectOrigen.addEventListener('change', actualizarPrecioPorOrigenDestino);

async function handleGuardarServicio(event) {
  event.preventDefault();

  const nombre = document.getElementById('cliente-nombre').value.trim();
  const telefono = document.getElementById('cliente-telefono').value.trim();
  const tipo = document.getElementById('servicio-tipo').value;
  const origen = document.getElementById('servicio-origen').value.trim();
  const destino = document.getElementById('servicio-destino').value.trim();
  const descripcion = document.getElementById('servicio-descripcion').value.trim();
  const precio = parseInt(inputPrecio.value, 10);

  if (!nombre || !telefono || !origen || !destino || !precio) {
    servicioMessage.textContent = 'Por favor completa todos los campos obligatorios.';
    servicioMessage.className = 'message error';
    return;
  }

  if (origen === destino) {
    servicioMessage.textContent = 'El origen y el destino no pueden ser iguales.';
    servicioMessage.className = 'message error';
    return;
  }

  if (!/^[0-9]{7,15}$/.test(telefono)) {
    servicioMessage.textContent = 'El teléfono debe contener solo números (7 a 15 dígitos).';
    servicioMessage.className = 'message error';
    return;
  }

  if (isNaN(precio) || precio <= 0) {
    servicioMessage.textContent = 'El precio debe ser un número mayor a cero.';
    servicioMessage.className = 'message error';
    return;
  }

  const btnSave = document.getElementById('btn-save-servicio');
  btnSave.disabled = true;
  btnSave.textContent = 'Guardando...';
  servicioMessage.textContent = '';

  try {
    const { data: clienteData, error: clienteError } = await supabaseClient
      .from('clientes')
      .insert([{ nombre, telefono }])
      .select()
      .single();

    if (clienteError) throw clienteError;

    const clienteId = clienteData.id;

    const { error: servicioError } = await supabaseClient
      .from('servicios')
      .insert([{
        cliente_id: clienteId,
        tipo: tipo || 'pedido',
        origen,
        destino,
        descripcion: descripcion || null,
        precio
      }]);

    if (servicioError) throw servicioError;

    servicioMessage.textContent = 'Servicio registrado correctamente.';
    servicioMessage.className = 'message success';
    formServicio.reset();
    document.getElementById('servicio-origen').value = '';
    document.getElementById('servicio-destino').value = '';
    document.getElementById('servicio-tipo').value = 'pedido';

    cargarServicios();
  } catch (err) {
    servicioMessage.textContent = err instanceof Error ? err.message : 'Error al registrar el servicio.';
    servicioMessage.className = 'message error';
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Guardar Servicio';
  }
}

async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message || 'Error al cerrar sesión.');
    return;
  }

  dashboardSection.classList.add('hidden');
  loginContainer.classList.remove('hidden');
  messageEl.textContent = '';
  tablaBody.textContent = '';
}

// Eventos del modal asignar transportador
btnConfirmarAsignar.addEventListener('click', async () => {
  const transportadorId = selectTransportador.value;
  const nuevoPrecio = parseInt(inputPrecioAsignado.value, 10);

  if (!transportadorId) {
    modalAsignarMessage.textContent = 'Selecciona un transportador.';
    modalAsignarMessage.className = 'message error';
    return;
  }

  if (!servicioIdParaAsignar) {
    modalAsignarMessage.textContent = 'Error: servicio no identificado.';
    modalAsignarMessage.className = 'message error';
    return;
  }

  if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
    modalAsignarMessage.textContent = 'Ingresa un precio válido mayor a 0.';
    modalAsignarMessage.className = 'message error';
    return;
  }

  btnConfirmarAsignar.disabled = true;
  btnConfirmarAsignar.textContent = 'Asignando...';
  modalAsignarMessage.textContent = '';

  try {
    await asignarTransportador(servicioIdParaAsignar, transportadorId, nuevoPrecio);
  } catch (err) {
    modalAsignarMessage.textContent = err instanceof Error ? err.message : 'Error al asignar transportador.';
    modalAsignarMessage.className = 'message error';
  } finally {
    btnConfirmarAsignar.disabled = false;
    btnConfirmarAsignar.textContent = 'Confirmar';
  }
});

btnCancelAsignar.addEventListener('click', () => {
  modalAsignar.classList.add('hidden');
  modalBackdrop.classList.add('hidden');
  servicioIdParaAsignar = null;
  selectTransportador.value = '';
  inputPrecioAsignado.value = '';
  modalAsignarMessage.textContent = '';
});

modalBackdrop.addEventListener('click', () => {
  modalAsignar.classList.add('hidden');
  modalBackdrop.classList.add('hidden');
  servicioIdParaAsignar = null;
  selectTransportador.value = '';
  inputPrecioAsignado.value = '';
  modalAsignarMessage.textContent = '';
});

btnConfirmarEditarPrecio.addEventListener('click', handleGuardarPrecioEdicion);

btnCancelEditarPrecio.addEventListener('click', () => {
  modalEditarPrecio.classList.add('hidden');
  modalBackdropEditarPrecio.classList.add('hidden');
  servicioIdParaEditarPrecio = null;
  inputPrecioEditar.value = '';
  modalEditarPrecioMessage.textContent = '';
});

modalBackdropEditarPrecio.addEventListener('click', () => {
  modalEditarPrecio.classList.add('hidden');
  modalBackdropEditarPrecio.classList.add('hidden');
  servicioIdParaEditarPrecio = null;
  inputPrecioEditar.value = '';
  modalEditarPrecioMessage.textContent = '';
});

btnCancelDifundir.addEventListener('click', () => {
  modalDifundir.classList.add('hidden');
  modalDifundirMessage.textContent = '';
  listaDisponibles.innerHTML = '';
});

modalBackdropDifundir.addEventListener('click', () => {
  modalDifundir.classList.add('hidden');
  modalDifundirMessage.textContent = '';
  listaDisponibles.innerHTML = '';
});

loginForm.addEventListener('submit', handleLogin);
formServicio.addEventListener('submit', handleGuardarServicio);
btnLogout.addEventListener('click', handleLogout);

const formTransportador = document.getElementById('form-transportador');
if (formTransportador) {
  formTransportador.addEventListener('submit', handleGuardarTransportador);
}

// Pestañas
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => {
      c.classList.add('hidden');
      c.classList.remove('active');
    });
    btn.classList.add('active');
    const destino = document.getElementById(`tab-${tab}`);
    destino.classList.remove('hidden');
    destino.classList.add('active');
  });
});