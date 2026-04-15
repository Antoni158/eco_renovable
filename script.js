// ================================
// INICIALIZACIÓN DE EMAILJS
// ================================
emailjs.init("BBFPusPff4u-RJ_gy"); // ✅ Clave pública correcta

// ================================
// TOAST (MENSAJES FLOTANTES)
// ================================
function crearToast(mensaje, tipo = "ok") {
  let contenedor = document.getElementById("toastContainer");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toastContainer";
    Object.assign(contenedor.style, {
      position: "fixed",
      bottom: "25px",
      right: "25px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: "9999"
    });
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement("div");
  toast.textContent = mensaje;
  Object.assign(toast.style, {
    background: tipo === "error" ? "#ff5e5e" : "#00a64f",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
    opacity: "0",
    transform: "translateY(15px)",
    transition: "opacity 0.4s, transform 0.4s"
  });
  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 100);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(15px)";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ================================
// OBTENER PRODUCTOS SELECCIONADOS
// ================================
function obtenerProductosSeleccionados(seccion) {
  const productos = [];
  seccion.querySelectorAll(".catalogo-item").forEach(item => {
    const cantidad = parseInt(item.querySelector(".cantidad")?.value) || 0;
    if (cantidad > 0) {
      const nombre = item.querySelector("h4, h3")?.textContent.trim() || "Producto";
      const precio = parseFloat(item.querySelector(".precio").dataset.precio);
      productos.push({ nombre, cantidad, subtotal: cantidad * precio });
    }
  });
  return productos;
}

// ================================
// CALCULAR TOTAL POR SECCIÓN
// ================================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".btn-ver-total").forEach(btn => {
    btn.addEventListener("click", () => {
      const seccion = btn.closest(".tab-content") || btn.closest("section");
      const productos = obtenerProductosSeleccionados(seccion);
      const total = productos.reduce((sum, p) => sum + p.subtotal, 0);

      seccion.querySelector(".total").textContent = `Q${total.toFixed(2)}`;
      crearToast(
        productos.length > 0
          ? `💰 Total estimado: Q${total.toFixed(2)}`
          : "⚠️ No seleccionaste productos.",
        productos.length > 0 ? "ok" : "error"
      );
    });
  });
});

// ================================
// MOSTRAR / OCULTAR FORMULARIOS
// ================================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".btn-hacer-cotizacion").forEach(btn => {
    btn.addEventListener("click", () => {
      const form = btn.nextElementSibling;
      if (!form || form.tagName !== "FORM") return;

      const visible = form.style.display === "block";
      document.querySelectorAll(".formulario").forEach(f => (f.style.display = "none")); // Oculta los demás
      form.style.display = visible ? "none" : "block";

      if (!visible) form.scrollIntoView({ behavior: "smooth" });
    });
  });
});

// ================================
// ENVÍO DE FORMULARIOS (ADMIN + USUARIO)
// ================================
function enviarFormulario(form, tipo, mensajeId) {
  const formData = new FormData(form);
  const nombre = formData.get("nombre")?.trim();
  const email = formData.get("email")?.trim();
  const telefono = formData.get("telefono")?.trim() || "No proporcionado";
  const comentario =
    formData.get("comentario")?.trim() ||
    formData.get("direccion")?.trim() ||
    formData.get("detalle")?.trim() ||
    "No proporcionado";

  const seccion = form.closest(".tab-content") || form.closest("section");
  const productos = seccion ? obtenerProductosSeleccionados(seccion) : [];
  const total = productos.reduce((sum, p) => sum + p.subtotal, 0);

  if (!nombre || !email) {
    return crearToast("⚠️ Complete todos los campos obligatorios.", "error");
  }

  if ((form.id === "formProductos" || form.id.startsWith("formCotizacion")) && productos.length === 0) {
    return crearToast("⚠️ No seleccionaste productos.", "error");
  }

  const descripcion = productos.length > 0
    ? productos.map(p => `${p.nombre} x${p.cantidad} — Q${p.subtotal.toFixed(2)}`).join("\n")
    : comentario;

  const paramsAdmin = {
    nombre,
    email,
    telefono,
    direccion: comentario,
    descripcion: `${descripcion}\n\nTotal: Q${total.toFixed(2)}`,
    tipo_formulario: tipo,
    total: `Q${total.toFixed(2)}`
  };

  const paramsUsuario = {
    to_name: nombre,
    to_email: email,
    mensaje: `${descripcion}\n\nTotal: Q${total.toFixed(2)}`,
    tipo_formulario: tipo,
    total: `Q${total.toFixed(2)}`
  };

  // MODAL DE CONFIRMACIÓN
  const modal = document.getElementById("modalConfirm");
  const resumen = document.getElementById("resumenPedido");

  resumen.innerHTML = `
    <p><b>Resumen de tu ${tipo}:</b></p>
    <p>${descripcion.replace(/\n/g, "<br>")}</p>
    <p><b>Total:</b> Q${total.toFixed(2)}</p>
  `;
  modal.style.display = "flex";

  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnCancelar = document.getElementById("btnCancelar");

  btnConfirmar.onclick = () => {
    modal.style.display = "none";

    emailjs
      .send("service_l65u83j", "template_ejnxkjc", paramsAdmin)
      .then(() => emailjs.send("service_l65u83j", "template_030ki4a", paramsUsuario))
      .then(() => {
        crearToast("✅ Envío realizado correctamente");
        document.getElementById(mensajeId).textContent = "✅ Su solicitud fue enviada correctamente.";
        form.reset();
        seccion.querySelectorAll(".cantidad").forEach(i => (i.value = 0));
        seccion.querySelector(".total").textContent = "Q0.00";
      })
      .catch(error => {
        console.error("Error al enviar:", error);
        crearToast("❌ Error al enviar el formulario", "error");
      });
  };

  btnCancelar.onclick = () => {
    modal.style.display = "none";
    crearToast("🛑 Pedido cancelado.", "error");
  };

  window.onclick = (event) => {
    if (event.target === modal) modal.style.display = "none";
  };
}

// ================================
// ESCUCHAS DE FORMULARIOS
// ================================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const id = form.id;
      const map = {
        formProductos: ["compra", "mensajeProductos"],
        installForm: ["instalación", "mensaje-instalacion"],
        formMantenimiento: ["mantenimiento", "mensajeMantenimiento"],
        formCotizacionPaneles: ["cotización de paneles", "mensajePaneles"],
        formCotizacionCamaras: ["cotización de cámaras", "mensajeCamaras"],
        formCotizacionBombillas: ["cotización de bombillas", "mensajeBombillas"],
        formCotizacion: ["cotización general", "mensajeEnvio"]
      };

      if (map[id]) enviarFormulario(form, map[id][0], map[id][1]);
    });
  });
});

// ================================
// BOTÓN "VOLVER ARRIBA"
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const btnSubir = document.getElementById("btnSubir");
  window.addEventListener("scroll", () => {
    btnSubir.style.display = window.scrollY > 300 ? "block" : "none";
  });
  btnSubir.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// ================================
// FUNCIONALIDAD DE TABS DEL COTIZADOR
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      target.classList.add("active");

      // 🔄 Reinicia totales y cantidades al cambiar de pestaña
      target.querySelectorAll(".cantidad").forEach(i => (i.value = 0));
      target.querySelectorAll(".total").forEach(t => (t.textContent = "Q0.00"));

      target.scrollIntoView({ behavior: "smooth" });
    });
  });
});

