const SUPABASE_URL = 'https://cmbpbyehmzjzmuqhchzv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtYnBieWVobXpqem11cWhjaHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDQwMjcsImV4cCI6MjEwODYyMDAyN30.j5XAjUUlqsKEax3zO33Hji192aGPcUANp4RwHfG9GXI';

if (!window.supabase?.createClient) {
  throw new Error('No se pudo cargar la biblioteca de Supabase.');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const params = new URLSearchParams(window.location.search);
const servicioId = params.get('id');

const datosServicio = document.getElementById('datos-servicio');
const btnAceptar = document.getElementById('btn-aceptar');
const btnCamino = document.getElementById('btn-camino');
const btnEntregado = document.getElementById('btn-entregado');
const mensajeEstado = document.getElementById('mensaje-estado');

const valCliente = document.getElementById('val-cliente');
const valOrigen = document.getElementById('val-origen');
const valDestino = document.getElementById('val-destino');
const valPrecio = document.getElementById('val-precio');

const grupoSelect = document.getElementById('grupo-select-transportador');
const selectTransportador = document.getElementById('select-transportador');

function mostrarEstado(texto, tipo = 'success') {
  mensajeEstado.textContent = texto;
  mensajeEstado.className = `message ${tipo}`;
  mensajeEstado.classList.remove('hidden');
}

async function cargarTransportadoresDisponibles() {
  const { data, error } = await supabase
    .from('transportadores')
    .select('id, nombre, tipo_vehiculo')
    .eq('disponible', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error cargando transportadores:', error);
    return;
  }

  selectTransportador.innerHTML = '<option value="">Selecciona tu nombre</option>';

  if (!data || data.length === 0) {
    const opcion = document.createElement('option');
    opcion.value = '';
    opcion.textContent = 'No hay transportadores disponibles';
    opcion.disabled = true;
    selectTransportador.appendChild(opcion);
    return;
  }

  data.forEach(transportador => {
    const opcion = document.createElement('option');
    opcion.value = transportador.id;
    opcion.textContent = `${transportador.nombre} (${transportador.tipo_vehiculo})`;
    selectTransportador.appendChild(opcion);
  });
}

async function cargarServicio() {
  if (!servicioId) {
    mostrarEstado('No se especificó un servicio.', 'error');
    return;
  }

  const { data, error } = await supabase
    .from('servicios')
    .select('*, clientes(nombre)')
    .eq('id', servicioId)
    .single();

  if (error || !data) {
    mostrarEstado('No se pudo cargar el servicio.', 'error');
    return;
  }

  valCliente.textContent = data.clientes && data.clientes.nombre ? data.clientes.nombre : 'Sin cliente';
  valOrigen.textContent = data.origen;
  valDestino.textContent = data.destino;
  valPrecio.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(data.precio);

  datosServicio.classList.remove('hidden');

  btnAceptar.classList.add('hidden');
  btnCamino.classList.add('hidden');
  btnEntregado.classList.add('hidden');
  grupoSelect.style.display = 'none';

  if (data.estado === 'pendiente') {
    await cargarTransportadoresDisponibles();
    grupoSelect.style.display = 'block';
    btnAceptar.classList.remove('hidden');
  } else if (data.estado === 'aceptado') {
    btnCamino.classList.remove('hidden');
  } else if (data.estado === 'en_camino') {
    btnEntregado.classList.remove('hidden');
  } else {
    mostrarEstado(`El servicio ya está en estado: ${data.estado}`, 'error');
  }
}

async function aceptarServicio() {
  const transportadorId = selectTransportador.value;

  if (!transportadorId) {
    alert('Por favor selecciona tu nombre de la lista.');
    return;
  }

  // Verificar que el servicio sigue siendo pendiente
  const { data, error } = await supabase
    .from('servicios')
    .select('estado')
    .eq('id', servicioId)
    .single();

  if (error || !data) {
    alert('Error al verificar el servicio.');
    return;
  }

  if (data.estado !== 'pendiente') {
    alert('Lo siento, este pedido ya fue tomado.');
    btnAceptar.classList.add('hidden');
    grupoSelect.style.display = 'none';
    return;
  }

  const { error: updateError } = await supabase
    .from('servicios')
    .update({ transportador_id: transportadorId, estado: 'aceptado' })
    .eq('id', servicioId);

  if (updateError) {
    alert('Error al aceptar el servicio.');
    return;
  }

  mostrarEstado('Servicio aceptado correctamente.');
  await cargarServicio();
}

async function actualizarEstado(nuevoEstado) {
  const { error } = await supabase
    .from('servicios')
    .update({ estado: nuevoEstado })
    .eq('id', servicioId);

  if (error) {
    mostrarEstado('Error al actualizar el estado.', 'error');
    return;
  }

  mostrarEstado(`Estado actualizado: ${nuevoEstado}`);
  await cargarServicio();
}

btnAceptar.addEventListener('click', aceptarServicio);
btnCamino.addEventListener('click', () => actualizarEstado('en_camino'));
btnEntregado.addEventListener('click', () => actualizarEstado('terminado'));

cargarServicio();
