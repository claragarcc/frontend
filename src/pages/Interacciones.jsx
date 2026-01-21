// /interacciones.jsx
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

/**
 * SSE por POST (fetch stream) — parser robusto:
 * - soporta eventos con varias líneas data:
 * - soporta [DONE], {chunk}, {interaccionId}, {error}
 */
async function enviarMensajeStream({ payload, signal, onInteraccionId, onChunk, onDone, onError }) {
  try {
    const resp = await fetch("/api/ollama/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-llm-mode": payload?.llmMode || "upv",
      },
      body: JSON.stringify(payload),
      signal,
    });


    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`HTTP ${resp.status} ${resp.statusText} ${txt}`);
    }
    if (!resp.body) throw new Error("Streaming no soportado (resp.body null).");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const handleData = (raw) => {
      const s = String(raw ?? "").trim();
      if (!s) return;

      if (s === "[DONE]") {
        onDone?.();
        return;
      }

      try {
        const msg = JSON.parse(s);

        if (msg?.error) {
          onError?.(new Error(msg.error));
          return;
        }
        if (msg?.interaccionId) {
          onInteraccionId?.(msg.interaccionId);
          return;
        }
        if (typeof msg?.chunk === "string" && msg.chunk.length > 0) {
          onChunk?.(msg.chunk);
        }
      } catch {
        // ignore
      }
    };

    const process = () => {
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const ev of events) {
        const lines = ev.split("\n").filter(Boolean);

        // un evento puede traer varias líneas data:
        for (const ln of lines) {
          if (!ln.startsWith("data:")) continue;
          handleData(ln.replace(/^data:\s*/, ""));
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      process();
    }

    process();
    onDone?.();
  } catch (e) {
    onError?.(e);
  }
}

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
  const sendingRef = useRef(false);

  const [sidebarInteractions, setSidebarInteractions] = useState([]);
  const [showPlusPanel, setShowPlusPanel] = useState(false);
  const [queryEj, setQueryEj] = useState("");

  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [modalImageAlt, setModalImageAlt] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // abort del stream actual si el usuario cambia de chat (o refresca)
  const activeAbortRef = useRef(null);

  // móvil
  useEffect(() => {
    const compute = () => setIsMobileView(window.innerWidth <= 640);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    if (!isMobileView) setMostrarPanel(true);
  }, [isMobileView]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentChatMessages]);

  useEffect(() => {
    sendingRef.current = isSendingMessage;
  }, [isSendingMessage]);

  // sesión
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

  // resize sidebar
  const startResizing = useCallback(
    (e) => {
      if (isMobileView) return;
      setIsResizing(true);
      e.preventDefault();
    },
    [isMobileView]
  );

  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resizeSidebar = useCallback(
    (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 220 && newWidth < 460) setSidebarWidth(newWidth);
    },
    [isResizing]
  );

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

  const fetchSidebarInteractions = useCallback(
    async (ejercicios) => {
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
    },
    [userId]
  );

  const loadInteraccion = useCallback(async (interaccionIdToLoad, ejercicios) => {
    const r = await api.get(`/api/interacciones/${interaccionIdToLoad}`);
    const newInteraccionId = r.data?._id || null;
    const newExerciseId = r.data?.ejercicio_id || null;
    const loaded = Array.isArray(r.data?.conversacion) ? r.data.conversacion : [];

    if (newExerciseId && ejercicios.some((e) => e._id === newExerciseId)) {
      setEjercicioActualId(newExerciseId);
    }
    setCurrentInteraccionId(newInteraccionId);
    setCurrentChatMessages(loaded);
  }, []);

  // init
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

        if (interaccionIdFromUrl) {
          await loadInteraccion(interaccionIdFromUrl, ejercicios);
          await fetchSidebarInteractions(ejercicios);
          if (isMobileView) setMostrarPanel(false);
          return;
        }

        if (interaccionIdLS) {
          try {
            await loadInteraccion(interaccionIdLS, ejercicios);
          } catch {
            localStorage.removeItem("currentInteraccionId");
          }
        } else {
          let newExerciseId = null;
          if (!newExerciseId && idFromUrl && ejercicios.some((e) => e._id === idFromUrl)) newExerciseId = idFromUrl;
          if (!newExerciseId && ejercicioIdLS && ejercicios.some((e) => e._id === ejercicioIdLS)) newExerciseId = ejercicioIdLS;
          if (!newExerciseId && ejercicios.length) newExerciseId = ejercicios[0]._id;

          setEjercicioActualId(newExerciseId);
          setCurrentInteraccionId(null);
          setCurrentChatMessages([]);
        }

        await fetchSidebarInteractions(ejercicios);
      } catch (err) {
        console.error("Error inicializando Interacciones:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [authChecked, fetchSidebarInteractions, loadInteraccion, location.search, isMobileView]);

  useEffect(() => {
    if (ejercicioActualId) localStorage.setItem("ejercicioActualId", ejercicioActualId);
  }, [ejercicioActualId]);

  useEffect(() => {
    if (currentInteraccionId) localStorage.setItem("currentInteraccionId", currentInteraccionId);
    else localStorage.removeItem("currentInteraccionId");
  }, [currentInteraccionId]);

  useEffect(() => {
    if (!isMobileView) return;
    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get("id");
    const interaccionIdFromUrl = queryParams.get("interaccionId");
    if (idFromUrl || interaccionIdFromUrl) setMostrarPanel(false);
    else setMostrarPanel(true);
  }, [isMobileView, location.search]);

  const seleccionarInteraccion = useCallback(
    async (it) => {
      // abort stream si existe
      if (activeAbortRef.current) {
        try { activeAbortRef.current.abort(); } catch {}
        activeAbortRef.current = null;
      }
      setIsSendingMessage(false);

      setLoading(true);
      setShowPlusPanel(false);
      try {
        await loadInteraccion(it.id, ejerciciosDisponibles);
        navigate(`/interacciones?id=${it.ejercicioId}&interaccionId=${it.id}`, { replace: true });
        if (isMobileView) setMostrarPanel(false);
      } catch (e) {
        console.error("Error al cargar interacción:", e);
        alert("No se pudo cargar la conversación.");
      } finally {
        setLoading(false);
      }
    },
    [navigate, ejerciciosDisponibles, loadInteraccion, isMobileView]
  );

  const borrarInteraccion = useCallback(
    async (id) => {
      if (!window.confirm("¿Eliminar esta interacción? Se borrará permanentemente.")) return;
      try {
        await api.delete(`/api/interacciones/${id}`);
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
    },
    [currentInteraccionId, ejercicioActualId, ejerciciosDisponibles, fetchSidebarInteractions, navigate]
  );

  const startNewChatWithExercise = useCallback(
    (exerciseId) => {
      // abort stream si existe
      if (activeAbortRef.current) {
        try { activeAbortRef.current.abort(); } catch {}
        activeAbortRef.current = null;
      }
      setIsSendingMessage(false);

      setEjercicioActualId(exerciseId);
      setCurrentInteraccionId(null);
      setCurrentChatMessages([]);
      setNuevoMensaje("");
      setShowPlusPanel(false);
      setQueryEj("");
      navigate(`/interacciones?id=${exerciseId}`, { replace: true });
      if (isMobileView) setMostrarPanel(false);
    },
    [navigate, isMobileView]
  );

  const finalizarEjercicioYRedirigir = useCallback(
    async ({ interaccionId, exerciseId }) => {
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
    },
    [navigate, userId]
  );

  const enviarMensaje = useCallback(async () => {
    const ej = ejerciciosDisponibles.find((e) => e._id === ejercicioActualId);
    const texto = nuevoMensaje.trim();
    if (!texto || !ej || sendingRef.current) return;

    if (!userId) {
      alert("No hay sesión iniciada. Vuelve a Login (demo o CAS).");
      return;
    }

    // abort stream anterior por seguridad (no debería haber)
    if (activeAbortRef.current) {
      try { activeAbortRef.current.abort(); } catch {}
      activeAbortRef.current = null;
    }

    setIsSendingMessage(true);
    setNuevoMensaje("");

    // pinta user + assistant vacío
    setCurrentChatMessages((prev) => [
      ...prev,
      { role: "user", content: texto },
      { role: "assistant", content: "" },
    ]);

    let acc = "";
    let newIdFromServer = null;
    let done = false;

    const ctrl = new AbortController();
    activeAbortRef.current = ctrl;

    // watchdog: si no llega nada real en mucho tiempo, aborta y desbloquea
    let lastDataAt = Date.now();
    const watchdog = setInterval(() => {
      if (done) return;
      const diff = Date.now() - lastDataAt;
      if (diff > 300000) { // 5 min sin datos
        try { ctrl.abort(); } catch {}
      }
    }, 5000);

    try {
      await enviarMensajeStream({
        payload: {
          userId,
          exerciseId: ej._id,
          interaccionId: currentInteraccionId || undefined,
          llmMode: "upv", // o "local"
          userMessage: texto,
        },
        signal: ctrl.signal,

        onInteraccionId: (id) => {
          newIdFromServer = id;
          setCurrentInteraccionId(id);
          // ✅ NO navigate aquí (rompe el primer stream)
        },

        onChunk: (piece) => {
          lastDataAt = Date.now();
          acc += piece;

          setCurrentChatMessages((prev) => {
            const copy = [...prev];
            const cleaned = stripFinishToken(acc);
            const last = copy.length - 1;

            if (copy[last]?.role === "assistant") {
              copy[last] = { ...copy[last], content: cleaned };
              return copy;
            }
            return [...copy, { role: "assistant", content: cleaned }];
          });
        },

        onDone: async () => {
          done = true;
          clearInterval(watchdog);

          await fetchSidebarInteractions(ejerciciosDisponibles);

          // ✅ ahora sí, actualizamos URL (cuando stream acabó)
          const iid = newIdFromServer || currentInteraccionId;
          if (iid) {
            const desired = `/interacciones?id=${ej._id}&interaccionId=${iid}`;
            const current = location.pathname + location.search;
            if (current !== desired) navigate(desired, { replace: true });
          }

          if (containsFinishToken(acc)) {
            const iid2 = newIdFromServer || currentInteraccionId;
            if (iid2) await finalizarEjercicioYRedirigir({ interaccionId: iid2, exerciseId: ej._id });
          }
        },

        onError: (err) => {
          done = true;
          clearInterval(watchdog);
          console.error("Stream error:", err);

          setCurrentChatMessages((prev) => {
            const copy = [...prev];
            const last = copy.length - 1;
            if (copy[last]?.role === "assistant" && (copy[last].content || "") === "") {
              copy[last] = { role: "assistant", content: "Error: No se pudo conectar con el tutor." };
              return copy;
            }
            return [...copy, { role: "assistant", content: "Error: No se pudo conectar con el tutor." }];
          });
        },
      });
    } finally {
      clearInterval(watchdog);
      activeAbortRef.current = null;
      setIsSendingMessage(false); // ✅ clave para poder mandar el segundo mensaje
    }
  }, [
    ejerciciosDisponibles,
    ejercicioActualId,
    nuevoMensaje,
    currentInteraccionId,
    userId,
    fetchSidebarInteractions,
    finalizarEjercicioYRedirigir,
    navigate,
    location.pathname,
    location.search,
  ]);

  // ===== Render =====
  if (!authChecked) {
    return (
      <div className="interacciones-cargando">
        <p>Comprobando sesión…</p>
      </div>
    );
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
    return (
      <div className="interacciones-cargando">
        <p>Cargando ejercicios e historial…</p>
      </div>
    );
  }

  if (ejerciciosDisponibles.length === 0) {
    return (
      <div className="interacciones-cargando">
        <p>No hay ejercicios disponibles. Revisa el backend y la colección de ejercicios.</p>
      </div>
    );
  }

  if (!ejercicioActualId || !ejercicioActual) {
    return (
      <div className="interacciones-cargando">
        <p>No se ha podido cargar el ejercicio actual.</p>
      </div>
    );
  }

  const imgSrc = ejercicioActual.imagen ? `/static/${ejercicioActual.imagen}` : "/placeholder-ejercicio.png";

  return (
    <div className="interacciones-scope">
      {mostrarPanel && (
        <aside className="interacciones-sidebar" style={{ width: isMobileView ? "100%" : `${sidebarWidth}px` }}>
          <div className="interacciones-sidebar-header">
            <h2 className="interacciones-sidebar-title">Chats</h2>

            <div className="sidebar-actions">
              {isMobileView && (
                <button className="btn-icon" title="Volver al chat" onClick={() => setMostrarPanel(false)} type="button">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}

              <button
                className="btn-icon"
                title={showPlusPanel ? "Cerrar Nuevo chat" : "Nuevo chat"}
                onClick={() => {
                  setShowPlusPanel((v) => !v);
                  setQueryEj("");
                }}
                type="button"
              >
                ＋
              </button>
            </div>
          </div>

          {showPlusPanel && (
            <div className="plus-panel">
              <div className="plus-panel-header">
                <h3 className="plus-panel-title">Nuevo chat</h3>
                <button
                  className="plus-panel-close"
                  title="Cerrar"
                  onClick={() => {
                    setShowPlusPanel(false);
                    setQueryEj("");
                  }}
                  type="button"
                >
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
                    <div
                      key={e._id}
                      className="plus-item"
                      onClick={() => startNewChatWithExercise(e._id)}
                      role="button"
                      tabIndex={0}
                    >
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
                    <div className="sidebar-item-sub">
                      {i.concepto} · Nivel {i.nivel}
                    </div>
                  </div>

                  <button
                    className="sidebar-item-trash"
                    title="Eliminar interacción"
                    onClick={(e) => {
                      e.stopPropagation();
                      borrarInteraccion(i.id);
                    }}
                    type="button"
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
            className="chat-inputbar"
          >
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="chat-text"
              disabled={isSendingMessage || !ejercicioActualId}
            />

            <button
              type="submit"
              className="btn-secondary chat-send"
              disabled={isSendingMessage || !nuevoMensaje.trim() || !ejercicioActualId}
            >
              Enviar
            </button>
          </form>
        </div>
      </main>

      {showImageModal && (
        <div className="img-modal-backdrop" onClick={closeImageModal}>
          <div className="img-modal" onClick={(e) => e.stopPropagation()}>
            <button className="img-modal-close" onClick={closeImageModal} title="Cerrar" type="button">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img src={modalImageUrl} alt={modalImageAlt} />
          </div>
        </div>
      )}
    </div>
  );
}
