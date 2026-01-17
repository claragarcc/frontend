import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getCurrentUser } from "../services/auth";
import { api } from "../services/api";

const FIN_TOKEN = "<FIN_EJERCICIO>";

function containsFinishToken(text) {
  return typeof text === "string" && text.includes(FIN_TOKEN);
}
function stripFinishToken(text) {
  if (typeof text !== "string") return "";
  return text.replaceAll(FIN_TOKEN, "").trim();
}

/* =========================================================================
   MODO DEMO LOCAL (COMENTADO)
   ------------------------------------------------------------
   Antes guardabas chats en localStorage para “simular” conversaciones.
   Ahora NO lo usamos porque quieres que incluso en modo demo (login demo)
   el tutor sea REAL (backend + Ollama).
   Si algún día quieres recuperar el demo local, aquí lo tienes.
============================================================================
const DEMO_KEY = "tv_demo_enabled";
const DEMO_CHATS_KEY = "tv_demo_chats_v1";
function readDemoChats() { ... }
function writeDemoChats(obj) { ... }
function demoCreateChat({ ejercicioId }) { ... }
function demoAppendMessages(chatId, ejercicioId, newMessages) { ... }
function rebuildDemoSidebar(ejercicios) { ... }
============================================================================ */

export default function Interacciones() {
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [ejercicioActualId, setEjercicioActualId] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [currentInteraccionId, setCurrentInteraccionId] = useState(null);

  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [isMobileView, setIsMobileView] = useState(false);
  const [mostrarPanel, setMostrarPanel] = useState(true);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem("sidebarWidth");
    return savedWidth ? parseInt(savedWidth, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sidebarInteractions, setSidebarInteractions] = useState([]);

  const [showPlusPanel, setShowPlusPanel] = useState(false);
  const [queryEj, setQueryEj] = useState("");

  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [modalImageAlt, setModalImageAlt] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // ✅ Detectar móvil
  useEffect(() => {
    const compute = () => setIsMobileView(window.innerWidth <= 640);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    if (!isMobileView) setMostrarPanel(true);
  }, [isMobileView]);

  // Scroll al final
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentChatMessages]);

  // ✅ 1) Usuario desde sesión (demo o cas)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await getCurrentUser();
        if (me?.authenticated && me?.user?.id) setUserId(me.user.id);
        else setUserId(null);
      } catch {
        setUserId(null);
      } finally {
        setAuthChecked(true);
      }
    };
    loadUser();
  }, []);

  const ejercicioActual = useMemo(() => {
    return ejerciciosDisponibles.find((e) => e._id === ejercicioActualId) || null;
  }, [ejerciciosDisponibles, ejercicioActualId]);

  const ejerciciosFiltrados = useMemo(() => {
    const q = queryEj.trim().toLowerCase();
    if (!q) return ejerciciosDisponibles;
    return ejerciciosDisponibles.filter((e) => {
      const titulo = (e.titulo || "").toLowerCase();
      const concepto = (e.concepto || "").toLowerCase();
      const nivel = String(e.nivel || "").toLowerCase();
      return titulo.includes(q) || concepto.includes(q) || nivel.includes(q);
    });
  }, [queryEj, ejerciciosDisponibles]);

  const openImageModal = useCallback((imageUrl, imageAlt) => {
    setModalImageUrl(imageUrl);
    setModalImageAlt(imageAlt);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageUrl("");
    setModalImageAlt("");
  }, []);

  // ===== Resize sidebar =====
  const startResizing = useCallback((e) => {
    if (isMobileView) return;
    setIsResizing(true);
    e.preventDefault();
  }, [isMobileView]);

  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resizeSidebar = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth > 220 && newWidth < 460) setSidebarWidth(newWidth);
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resizeSidebar);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resizeSidebar, stopResizing]);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", sidebarWidth.toString());
  }, [sidebarWidth]);

  // ✅ Sidebar real (Mongo)
  const fetchSidebarInteractions = useCallback(async (ejercicios) => {
    if (!userId) return;
    try {
      const res = await api.get(`/api/interacciones/user/${userId}`);
      const lista = Array.isArray(res.data) ? res.data : [];

      const withDetails = lista.map((it) => {
        const ej = ejercicios.find((e) => e._id === it.ejercicio_id);
        return {
          id: it._id,
          ejercicioId: it.ejercicio_id,
          titulo: ej ? ej.titulo : `Ejercicio desconocido (${it.ejercicio_id})`,
          concepto: ej ? ej.concepto : "Desconocido",
          nivel: ej ? ej.nivel : "—",
        };
      });

      setSidebarInteractions(withDetails);
    } catch (err) {
      console.error("Error cargando sidebar:", err);
      setSidebarInteractions([]);
    }
  }, [userId]);

  // ===== Inicialización =====
  useEffect(() => {
    const init = async () => {
      try {
        if (!authChecked) return;

        const resEj = await api.get("/api/ejercicios");
        const ejercicios = Array.isArray(resEj.data) ? resEj.data : [];
        setEjerciciosDisponibles(ejercicios);

        const queryParams = new URLSearchParams(location.search);
        const idFromUrl = queryParams.get("id");
        const interaccionIdFromUrl = queryParams.get("interaccionId");

        const interaccionIdLS = localStorage.getItem("currentInteraccionId");
        const ejercicioIdLS = localStorage.getItem("ejercicioActualId");

        let newExerciseId = null;
        let newInteraccionId = null;
        let loaded = [];

        // 1) si viene interaccionId por URL, cargarla
        if (interaccionIdFromUrl) {
          try {
            const r = await api.get(`/api/interacciones/${interaccionIdFromUrl}`);
            newInteraccionId = r.data?._id || null;
            newExerciseId = r.data?.ejercicio_id || null;
            loaded = Array.isArray(r.data?.conversacion) ? r.data.conversacion : [];
          } catch (e) {
            console.warn("Interacción URL inválida:", e);
          }
        }

        // 2) si no, usar la del localStorage
        if (!newInteraccionId && interaccionIdLS) {
          try {
            const r = await api.get(`/api/interacciones/${interaccionIdLS}`);
            newInteraccionId = r.data?._id || null;
            newExerciseId = r.data?.ejercicio_id || null;
            loaded = Array.isArray(r.data?.conversacion) ? r.data.conversacion : [];
          } catch (e) {
            console.warn("Interacción LS inválida:", e);
            localStorage.removeItem("currentInteraccionId");
          }
        }

        // 3) si no hay ejercicio todavía, usar id URL / LS / fallback
        if (!newExerciseId && idFromUrl && ejercicios.some((e) => e._id === idFromUrl)) newExerciseId = idFromUrl;
        if (!newExerciseId && ejercicioIdLS && ejercicios.some((e) => e._id === ejercicioIdLS)) newExerciseId = ejercicioIdLS;
        if (!newExerciseId && ejercicios.length) newExerciseId = ejercicios[0]._id;

        setEjercicioActualId(newExerciseId);
        setCurrentInteraccionId(newInteraccionId);
        setCurrentChatMessages(loaded);

        // sidebar
        await fetchSidebarInteractions(ejercicios);
      } catch (err) {
        console.error("Error inicializando Interacciones:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [authChecked, location.search, fetchSidebarInteractions]);

  // sincroniza URL con estado actual
  useEffect(() => {
    if (!ejercicioActualId) return;

    localStorage.setItem("ejercicioActualId", ejercicioActualId);

    const desired = currentInteraccionId
      ? `/interacciones?id=${ejercicioActualId}&interaccionId=${currentInteraccionId}`
      : `/interacciones?id=${ejercicioActualId}`;

    const current = location.pathname + location.search;
    if (current !== desired) navigate(desired, { replace: true });
  }, [ejercicioActualId, currentInteraccionId, navigate]); // intencionado: no depende de location.search

  // persist interaccionId
  useEffect(() => {
    if (currentInteraccionId) localStorage.setItem("currentInteraccionId", currentInteraccionId);
    else localStorage.removeItem("currentInteraccionId");
  }, [currentInteraccionId]);

  // móvil: si vienes con parámetros -> abre chat
  useEffect(() => {
    if (!isMobileView) return;
    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get("id");
    const interaccionIdFromUrl = queryParams.get("interaccionId");
    if (idFromUrl || interaccionIdFromUrl) setMostrarPanel(false);
    else setMostrarPanel(true);
  }, [isMobileView, location.search]);

  // ===== Acciones =====
  const seleccionarInteraccion = useCallback(async (it) => {
    setEjercicioActualId(it.ejercicioId);
    setCurrentInteraccionId(it.id);
    setLoading(true);
    setShowPlusPanel(false);

    try {
      const r = await api.get(`/api/interacciones/${it.id}`);
      const conv = Array.isArray(r.data?.conversacion) ? r.data.conversacion : [];
      setCurrentChatMessages(conv);

      navigate(`/interacciones?id=${it.ejercicioId}&interaccionId=${it.id}`, { replace: true });
      if (isMobileView) setMostrarPanel(false);
    } catch (e) {
      console.error("Error al cargar interacción:", e);
      alert("No se pudo cargar la conversación.");
      setCurrentInteraccionId(null);
      setCurrentChatMessages([]);
      navigate(`/interacciones?id=${it.ejercicioId}`, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, isMobileView]);

  const borrarInteraccion = useCallback(async (id) => {
    if (!window.confirm("¿Eliminar esta interacción? Se borrará permanentemente.")) return;
    try {
      await api.delete(`/api/interacciones/${id}`);
      // refresca sidebar
      await fetchSidebarInteractions(ejerciciosDisponibles);

      if (currentInteraccionId === id) {
        setCurrentInteraccionId(null);
        setCurrentChatMessages([]);
        navigate(`/interacciones?id=${ejercicioActualId}`, { replace: true });
      }
    } catch (e) {
      console.error("Error borrando interacción:", e);
      alert("No se pudo eliminar.");
    }
  }, [currentInteraccionId, ejercicioActualId, ejerciciosDisponibles, fetchSidebarInteractions, navigate]);

  const startNewChatWithExercise = useCallback((exerciseId) => {
    setEjercicioActualId(exerciseId);
    setCurrentInteraccionId(null);
    setCurrentChatMessages([]);
    setNuevoMensaje("");
    setShowPlusPanel(false);
    setQueryEj("");
    navigate(`/interacciones?id=${exerciseId}`, { replace: true });
    if (isMobileView) setMostrarPanel(false);
  }, [navigate, isMobileView]);

  const finalizarEjercicioYRedirigir = useCallback(async ({ interaccionId, exerciseId }) => {
    try {
      await api.post("/api/resultados/finalizar", {
        userId,
        exerciseId,
        interaccionId,
        resueltoALaPrimera: false,
      });
    } catch (e) {
      console.error("Error finalizando resultado:", e);
    } finally {
      navigate("/dashboard");
    }
  }, [navigate, userId]);

  const enviarMensaje = useCallback(async () => {
    const ej = ejerciciosDisponibles.find((e) => e._id === ejercicioActualId);
    if (!nuevoMensaje.trim() || !ej || isSendingMessage) return;

    if (!userId) {
      alert("No hay sesión iniciada. Vuelve a Login (demo o CAS).");
      return;
    }

    setIsSendingMessage(true);
    const userMessageContent = nuevoMensaje.trim();
    setNuevoMensaje("");

    try {
      // pinta el mensaje del usuario en UI inmediato
      setCurrentChatMessages((prev) => [...prev, { role: "user", content: userMessageContent }]);

      // si no hay interaccion, crearla
      if (!currentInteraccionId) {
        const r = await api.post("/api/ollama/chat/start-exercise", {
          userId,
          exerciseId: ej._id,
          userMessage: userMessageContent,
        });

        const newId = r.data?.interaccionId;
        const assistant = r.data?.assistantMessage || "";

        setCurrentInteraccionId(newId);
        setCurrentChatMessages((prev) => {
          // ya añadimos user arriba; añadimos assistant
          const cleanAssistant = stripFinishToken(assistant);
          return [...prev, { role: "assistant", content: cleanAssistant }];
        });

        // refresca sidebar
        await fetchSidebarInteractions(ejerciciosDisponibles);

        if (containsFinishToken(assistant)) {
          await finalizarEjercicioYRedirigir({ interaccionId: newId, exerciseId: ej._id });
        }

        return;
      }

      // si ya hay interaccion, continuar
      const r2 = await api.post("/api/ollama/chat/message", {
        interaccionId: currentInteraccionId,
        userMessage: userMessageContent,
      });

      const assistant2 = r2.data?.assistantMessage || "";

      setCurrentChatMessages((prev) => {
        const cleanAssistant = stripFinishToken(assistant2);
        return [...prev, { role: "assistant", content: cleanAssistant }];
      });

      await fetchSidebarInteractions(ejerciciosDisponibles);

      if (containsFinishToken(assistant2)) {
        await finalizarEjercicioYRedirigir({ interaccionId: currentInteraccionId, exerciseId: ej._id });
      }
    } catch (e) {
      console.error("Error enviando mensaje:", e);
      setCurrentChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: No se pudo conectar con el tutor." },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  }, [
    ejerciciosDisponibles,
    ejercicioActualId,
    nuevoMensaje,
    isSendingMessage,
    currentInteraccionId,
    userId,
    fetchSidebarInteractions,
    finalizarEjercicioYRedirigir,
  ]);

  // ===== Render =====
  if (!authChecked) {
    return <div className="interacciones-cargando"><p>Comprobando sesión…</p></div>;
  }

  if (!userId) {
    return (
      <div className="interacciones-cargando">
        <p>No hay sesión iniciada.</p>
        <p>Vuelve a Login y entra en modo demo (o CAS cuando esté disponible).</p>
      </div>
    );
  }

  if (loading) {
    return <div className="interacciones-cargando"><p>Cargando ejercicios e historial…</p></div>;
  }

  if (ejerciciosDisponibles.length === 0) {
    return (
      <div className="interacciones-cargando">
        <p>No hay ejercicios disponibles. Revisa el backend y la colección de ejercicios.</p>
      </div>
    );
  }

  if (!ejercicioActualId || !ejercicioActual) {
    return <div className="interacciones-cargando"><p>No se ha podido cargar el ejercicio actual.</p></div>;
  }

  const imgSrc = ejercicioActual.imagen ? `/static/${ejercicioActual.imagen}` : "/placeholder-ejercicio.png";
  const inputPlaceholder = isSendingMessage ? "Pensando…" : "Escribe tu mensaje…";

  return (
    <div className="interacciones-scope">
      {mostrarPanel && (
        <aside className="interacciones-sidebar" style={{ width: isMobileView ? "100%" : `${sidebarWidth}px` }}>
          <div className="interacciones-sidebar-header">
            <h2 className="interacciones-sidebar-title">Chats</h2>

            <div className="sidebar-actions">
              {isMobileView && (
                <button className="btn-icon" title="Volver al chat" onClick={() => setMostrarPanel(false)}>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}

              <button
                className="btn-icon"
                title={showPlusPanel ? "Cerrar Nuevo chat" : "Nuevo chat"}
                onClick={() => { setShowPlusPanel((v) => !v); setQueryEj(""); }}
              >
                ＋
              </button>
            </div>
          </div>

          {showPlusPanel && (
            <div className="plus-panel">
              <div className="plus-panel-header">
                <h3 className="plus-panel-title">Nuevo chat</h3>
                <button className="plus-panel-close" title="Cerrar" onClick={() => { setShowPlusPanel(false); setQueryEj(""); }}>
                  ✕
                </button>
              </div>

              <input
                className="plus-search"
                type="text"
                value={queryEj}
                onChange={(e) => setQueryEj(e.target.value)}
                placeholder="Buscar ejercicio…"
              />

              <div className="plus-list">
                {ejerciciosFiltrados.length > 0 ? (
                  ejerciciosFiltrados.map((e) => (
                    <div key={e._id} className="plus-item" onClick={() => startNewChatWithExercise(e._id)} role="button" tabIndex={0}>
                      <div className="plus-item-title">{e.titulo}</div>
                      <div className="plus-item-meta">
                        {e.concepto} · Nivel {e.nivel}
                        <span className="plus-item-pill">N{e.nivel}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="plus-empty">No hay ejercicios que coincidan.</div>
                )}
              </div>
            </div>
          )}

          <div className="sidebar-list">
            {sidebarInteractions.length > 0 ? (
              sidebarInteractions.map((i) => (
                <div
                  key={i.id}
                  className={`sidebar-item ${i.id === currentInteraccionId ? "sidebar-item-active" : ""}`}
                  onClick={() => seleccionarInteraccion(i)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sidebar-item-content">
                    <div className="sidebar-item-title">{i.titulo}</div>
                    <div className="sidebar-item-sub">{i.concepto} · Nivel {i.nivel}</div>
                  </div>

                  <button
                    className="sidebar-item-trash"
                    title="Eliminar interacción"
                    onClick={(e) => { e.stopPropagation(); borrarInteraccion(i.id); }}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="sidebar-empty">No hay interacciones guardadas. Pulsa “＋” para empezar.</div>
            )}
          </div>

          {!isMobileView && <div className="sidebar-resizer" onMouseDown={startResizing} />}
        </aside>
      )}

      <main className="chat-wrap">
        <div className="chat-top">
          {isMobileView && !mostrarPanel && (
            <button className="mobile-open-chats" onClick={() => setMostrarPanel(true)} title="Ver chats" type="button">
              Chats
            </button>
          )}

          <img
            src={imgSrc}
            alt={ejercicioActual.titulo || "Ejercicio"}
            className="chat-top-img"
            onClick={() => openImageModal(imgSrc, ejercicioActual.titulo || "Ejercicio")}
          />

          <div className="chat-top-text">
            <h3 className="chat-top-title">{ejercicioActual.titulo}</h3>
            <p className="chat-top-enunciado">{ejercicioActual.enunciado}</p>
          </div>
        </div>

        <div className="chat-body">
          <div ref={scrollRef} className="chat-messages">
            {currentChatMessages.length > 0 ? (
              currentChatMessages.map((m, i) => (
                <div key={i} className={`msg ${m.role === "user" ? "msg-user" : "msg-assistant"}`}>
                  {m.content}
                </div>
              ))
            ) : (
              <p className="chat-empty">No hay mensajes aún. Escribe el primero para empezar.</p>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); enviarMensaje(); }} className="chat-inputbar">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder={inputPlaceholder}
              className="chat-text"
              disabled={isSendingMessage || !ejercicioActualId}
            />

            <button
              type="submit"
              className="btn-secondary chat-send"
              disabled={isSendingMessage || !nuevoMensaje.trim() || !ejercicioActualId}
            >
              {isSendingMessage ? "Enviando…" : "Enviar"}
            </button>
          </form>
        </div>
      </main>

      {showImageModal && (
        <div className="img-modal-backdrop" onClick={closeImageModal}>
          <div className="img-modal" onClick={(e) => e.stopPropagation()}>
            <button className="img-modal-close" onClick={closeImageModal} title="Cerrar">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img src={modalImageUrl} alt={modalImageAlt} />
          </div>
        </div>
      )}
    </div>
  );
}
