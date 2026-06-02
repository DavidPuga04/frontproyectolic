import React, { useState, useEffect } from 'react';
import Login from './Login';
import axios from 'axios';

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);

  const [tramiteId, setTramiteId] = useState(null);

  const [archivos, setArchivos] = useState({
    cedula: null,
    sangre: null,
    psico: null
  });

  const [recomendacion, setRecomendacion] = useState(null);

  const [zonas, setZonas] = useState([]);
  const [zona, setZona] = useState("");
  const [cedula, setCedula] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/zonas/')
      .then(res => setZonas(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setPaso(0);
    setCedula("");
    setZona("");
    setTramiteId(null);
    setRecomendacion(null);
  };

  const iniciarTramite = async () => {
    if (!cedula) return alert("Debe ingresar la cédula");

    setLoading(true);

    try {
      await axios.post(
        'http://127.0.0.1:8000/api/tramites/validar_cedula/',
        { cedula_numero: cedula }
      );

      setPaso(1);

    } catch (error) {
      alert("Cédula inválida");
    } finally {
      setLoading(false);
    }
  };

  const subirArchivoAlBack = async (tipo) => {

    const archivo = archivos[tipo];
    if (!archivo) return alert("Debe seleccionar un archivo");

    setLoading(true);

    try {

      const formData = new FormData();

      if (tipo === 'cedula') formData.append('archivo_cedula', archivo);
      if (tipo === 'sangre') formData.append('archivo_sangre', archivo);
      if (tipo === 'psico') formData.append('archivo_psico', archivo);

      formData.append('cedula_numero', cedula);

      const url = tramiteId
        ? `http://127.0.0.1:8000/api/tramites/${tramiteId}/`
        : `http://127.0.0.1:8000/api/tramites/`;

      const method = tramiteId ? 'patch' : 'post';

      const res = await axios({ method, url, data: formData });

      if (!tramiteId) setTramiteId(res.data.id);

      setPaso(prev => prev + 1);

    } catch (e) {
      alert("Error al subir archivo");
    } finally {
      setLoading(false);
    }
  };

  const obtenerRecomendacionInteligente = async () => {

    if (!zona) return alert("Debe seleccionar una zona");

    setLoading(true);

    try {

      await axios.patch(
        `http://127.0.0.1:8000/api/tramites/${tramiteId}/`,
        { zona: parseInt(zona) }
      );

      const res = await axios.get(
        `http://127.0.0.1:8000/api/tramites/${tramiteId}/recomendar_sucursal/`
      );

      setRecomendacion(res.data);
      setPaso(5);

    } catch (e) {
      alert("Error en el CORE");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (

    <div style={{
      padding: 30,
      maxWidth: 750,
      margin: '0 auto',
      fontFamily: 'Segoe UI',
      background: '#f5f7fa'
    }}>

      {/* HEADER */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '2px solid #ddd',
        paddingBottom: 10
      }}>
        <h2>ANT - Gestión de Licencias</h2>
        <button onClick={handleLogout} style={{ color: 'red' }}>
          Cerrar Sesión
        </button>
      </header>

      {/* PROGRESO */}
      {paso > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          margin: 20
        }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              fontWeight: 'bold',
              color: paso >= i ? '#007bff' : '#ccc'
            }}>
              {i === 5 ? '🎫' : `Paso ${i}`}
            </div>
          ))}
        </div>
      )}

      <main style={{
        background: '#fff',
        padding: 20,
        borderRadius: 10
      }}>

        {/* INICIO */}
        {paso === 0 && (
          <div style={{ textAlign: 'center' }}>
            <h3>Inicio del trámite</h3>

            <input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Cédula"
              style={{ padding: 10, width: '80%' }}
            />

            <br /><br />

            <button onClick={iniciarTramite}>
              {loading ? "Validando..." : "Iniciar trámite"}
            </button>
          </div>
        )}

        {/* PASOS 1-3 */}
        {paso >= 1 && paso <= 3 && (
          <div style={{ textAlign: 'center' }}>

            <h3>Paso {paso}</h3>

            <input type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (paso === 1) setArchivos({ ...archivos, cedula: file });
                if (paso === 2) setArchivos({ ...archivos, sangre: file });
                if (paso === 3) setArchivos({ ...archivos, psico: file });
              }}
            />

            <br /><br />

            <button onClick={() =>
              subirArchivoAlBack(
                paso === 1 ? 'cedula' :
                paso === 2 ? 'sangre' : 'psico'
              )
            }>
              {loading ? "Subiendo..." : "Siguiente"}
            </button>

          </div>
        )}

        {/* PASO 4 */}
        {paso === 4 && (
          <div style={{ textAlign: 'center' }}>

            <h3>Paso 4: Selección de zona</h3>

            <select
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              style={{ width: '100%', padding: 10 }}
            >
              <option value="">Seleccione zona</option>
              {zonas.map(z => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>

            <br /><br />

            <button onClick={obtenerRecomendacionInteligente}>
              {loading ? "Procesando..." : "Continuar"}
            </button>

          </div>
        )}

        {/* PASO 5 */}
        {paso === 5 && recomendacion && (
          <div style={{
          padding: '20px',
          border: '2px solid #007bff',
          background: '#fff',
          borderRadius: '10px',
          textAlign: 'center'
        }}>

    <h2 style={{ color: '#007bff' }}>
      🎫 Ticket Inteligente
    </h2>

    <p>
      Te recomendamos asistir a la sucursal de:
    </p>

    <div style={{
      fontSize: '1.2em',
      margin: '20px 0',
      background: '#e7f3ff',
      padding: '15px',
      borderRadius: '8px'
    }}>

      📍 <strong>{recomendacion.sucursal}</strong>

      <br /><br />

      🕒 Espera:
      <strong>
        {" "}{recomendacion.tiempo_espera} min
      </strong>

      <br /><br />

      🚗 Distancia:
      <strong>
        {" "}{recomendacion.distancia_km} km
      </strong>

      <br /><br />

      ⏱ Tiempo total estimado:
      <strong>
        {" "}{recomendacion.tiempo_total} min
      </strong>

    </div>

    <p style={{
      color: 'green',
      fontWeight: 'bold',
      fontSize: '1.1em'
    }}>
      ✨ Ahorras aproximadamente {recomendacion.ahorro_estimado} min respecto a la opción menos conveniente
    </p>

    <button onClick={() => window.print()}>
      Imprimir
    </button>

  </div>
)}

      </main>
    </div>
  );
}

export default App;