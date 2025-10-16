document.addEventListener("DOMContentLoaded", function () {
    if (typeof L === "undefined" || typeof map === "undefined") {
        console.error("Leaflet o el mapa no están definidos.");
        return;
    }

    if (!map.getPane('capasPuntosPane')) {
        map.createPane('capasPuntosPane');
        map.getPane('capasPuntosPane').style.zIndex = 650;
    }

    const capasPuntos = {};
    const controlCapasContainer = document.getElementById("controlCapasContainer");
    if (!controlCapasContainer) {
        console.error("No se encontró el contenedor #controlCapasContainer.");
        return;
    }

    const listaCapas = document.createElement("ul");
    listaCapas.className = "lista-capas";
    controlCapasContainer.appendChild(listaCapas);



    // Íconos: Centros de Desarrollo Comunitario
   
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHAUUwIZdDhl16SZRrr1B7ecSWWCoYFYEXorSWP12U_0FEwoefgkVzaslXDCn4ww/pub?output=csv";

// 🔸 Iconos por estado
const iconosEstado2 = {
    "Bueno": L.icon({ iconUrl: "img/icono/CDC_verde.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
    "Regular": L.icon({ iconUrl: "img/icono/CDC_amarillo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
    "Malo": L.icon({ iconUrl: "img/icono/CDC_rojo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] })
};

// 🔹 Conteo por estado
const conteoEstados2 = {
    "Centros de Desarrollo Comunitario": { Bueno: 0, Regular: 0, Malo: 0 }
};

// 🔹 Agrupación por estado
const gruposPorEstado = {
    "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
    "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
    "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV)
    .then(response => response.text())
    .then(csvText => {
        Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: function (results) {
                const data = results.data.slice(1);

                data.forEach(columnas => {
                    const name = columnas[1]?.trim();
                    const tipo = columnas[2]?.trim();
                    const direc = columnas[3]?.trim();
                    const lat = parseFloat(columnas[4]);
                    const lng = parseFloat(columnas[5]);
                    const linkGoogle = columnas[6]?.trim();
                    const contacto = columnas[7]?.trim();
                    const actGratis = columnas[8]?.trim();
                    const actCosto = columnas[9]?.trim();
                    const observaciones = columnas[10]?.trim();
                    const linkFoto = columnas[11]?.trim();
                    const estado = columnas[12]?.trim();
                    const estadoNormalizado = estado || "Regular";

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const icono = iconosEstado2[estadoNormalizado] || iconosEstado2["Regular"];

                        let popup = `<b>${name}</b><br>`;
                        if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
                        if (direc) popup += `<b>Dirección:</b> ${direc}<br>`;
                        if (linkGoogle) {
                            const limpio = linkGoogle.replace(/^"+|"+$/g, "").trim();
                            const urlSegura = encodeURI(limpio);
                            popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
                        }
                        if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
                        if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
                        if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
                        if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
                        if (linkFoto) popup += `<b>Foto:</b> <a href="${linkFoto}" target="_blank">Ver imagen</a><br>`;

                        const marker = L.marker([lat, lng], {
                            icon: icono,
                            pane: 'capasPuntosPane'
                        }).bindPopup(popup);

                        gruposPorEstado[estadoNormalizado].addLayer(marker);

                        if (typeof registrarElementoBuscable === "function") {
                            registrarElementoBuscable({
                                nombre: name,
                                capa: "Centros de Desarrollo Comunitario",
                                marker: marker
                            });
                        }

                        if (estadoNormalizado in conteoEstados2["Centros de Desarrollo Comunitario"]) {
                            conteoEstados2["Centros de Desarrollo Comunitario"][estadoNormalizado]++;
                        }
                    }
                });

                // 📁 Panel lateral con flecha desplegable por estado
                const itemCapa = document.createElement("li");
                  itemCapa.style.marginBottom = "14px";
                  itemCapa.style.fontSize = "13px";


                const details = document.createElement("details");
                details.open = false;
                details.style.marginLeft = "6px";

                const summary = document.createElement("summary");
                summary.style.cursor = "pointer";
                summary.style.fontWeight = "bold";
                summary.innerHTML = `
                    <img src="img/icono/CDC.png" width="23" style="vertical-align: middle; margin-right: 8px;">
                    Centros de Desarrollo Comunitario
                `;
                details.appendChild(summary);

                ["Bueno", "Regular", "Malo"].forEach(estado => {
                    const subItem = document.createElement("div");
                    subItem.style.marginLeft = "28px";
                    subItem.style.lineHeight = "1.6";

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = false;

                    checkbox.addEventListener("change", function () {
                        if (checkbox.checked) {
                            gruposPorEstado[estado].addTo(map);
                        } else {
                            map.removeLayer(gruposPorEstado[estado]);
                        }
                    });

                    const label = document.createElement("label");
                    label.style.marginLeft = "6px";
                    label.innerHTML = `
                        ${estado === "Bueno" ? "🟢" : estado === "Regular" ? "🟡" : "🔴"} 
                        ${estado} <span style="color: #555;">(${conteoEstados2["Centros de Desarrollo Comunitario"][estado]})</span>
                    `;

                    subItem.appendChild(checkbox);
                    subItem.appendChild(label);
                    details.appendChild(subItem);
                });

                itemCapa.appendChild(details);
                listaCapas.appendChild(itemCapa);
            }
        });
    });



    // Capa: Módulos Deportivos
const urlCSVModulos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB17wAqRP0vSPM2x68YQBluo4oaYYtMLydDev0yDpqV65Gsx5brSHRTs7aX9rixw/pub?output=csv";

const iconosEstado = {
  "Bueno": L.icon({ iconUrl: "img/icono/modulo_verde.png", iconSize: [20, 30], iconAnchor: [25, 20], popupAnchor: [10, -20] }),
  "Regular": L.icon({ iconUrl: "img/icono/modulo_amarillo.png", iconSize: [20, 30], iconAnchor: [25, 20], popupAnchor: [10, -20] }),
  "Malo": L.icon({ iconUrl: "img/icono/modulo_rojo.png", iconSize: [20, 30], iconAnchor: [25, 20], popupAnchor: [10, -20] })
};

// 🧮 Conteo por estado
const conteoEstados = {
  "Módulos Deportivos": { Bueno: 0, Regular: 0, Malo: 0 }
};

// 🗂️ Agrupación por estado
const gruposPorEstado2 = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSVModulos)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const talleres = columnas[10]?.trim();
          const horarios = columnas[11]?.trim();
          const edades = columnas[12]?.trim();
          const observaciones = columnas[13]?.trim();
          const linkFoto = columnas[14]?.trim();
          const estado = columnas[15]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstados["Módulos Deportivos"][estado]++;
            const icono = iconosEstado[estado] || iconosEstado["Regular"];

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (talleres) popup += `<b>Talleres Eventuales:</b> ${talleres}<br>`;
            if (horarios) popup += `<b>Días y Horarios:</b> ${horarios}<br>`;
            if (edades) popup += `<b>Edades:</b> ${edades}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
              const urlFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
              popup += `<img src="${urlFoto}" alt="Foto del módulo" style="width:100%; max-height:200px; margin-top:8px;"><br>`;
            } else {
              popup += `<em>Sin imagen disponible</em><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstado2[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Módulos Deportivos",
                marker: marker
              });
            }
          }
        });

        // 🧩 Panel lateral desplegable por estado
        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "12px";
        itemCapa.style.fontSize = "13px";

        const details = document.createElement("details");
        details.open = false;
        details.style.marginLeft = "6px";
        details.style.fontSize = "13px";

        const summary = document.createElement("summary");
        summary.style.cursor = "pointer";
        summary.style.fontWeight = "bold";
        summary.style.lineHeight = "1.4";
        summary.innerHTML = `
          <img src="img/icono/modulos.png" width="20" style="vertical-align: middle; margin-right: 8px;">
          Módulos Deportivos
        `;
        details.appendChild(summary);

        ["Bueno", "Regular", "Malo"].forEach(estado => {
          const subItem = document.createElement("div");
          subItem.style.marginLeft = "28px";
          subItem.style.lineHeight = "1.5";
          subItem.style.fontSize = "12.5px";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = false;

          checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
              gruposPorEstado2[estado].addTo(map);
            } else {
              map.removeLayer(gruposPorEstado2[estado]);
            }
          });

          const label = document.createElement("label");
          label.style.marginLeft = "6px";
          label.innerHTML = `
            ${estado === "Bueno" ? "🟢" : estado === "Regular" ? "🟡" : "🔴"} 
            ${estado} <span style="color: #555;">(${conteoEstados["Módulos Deportivos"][estado]})</span>
          `;

          subItem.appendChild(checkbox);
          subItem.appendChild(label);
          details.appendChild(subItem);
        });

        itemCapa.appendChild(details);
        listaCapas.appendChild(itemCapa);
      }
    });
  })
  .catch(error => console.error("Error al cargar Módulos Deportivos:", error));



//Centro de Atención y Ciudados Infantiles
const urlCSVCACI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPKQMLclLqV4Lw_2bNoO9SMSBjTQk7UjCvVlGnNdJadNlzMU7L1gal5oMzpkHYeQ/pub?output=csv";

// 🔸 Íconos CACI actualizados
const iconosEstadoCACI = {
  "Bueno": L.icon({ iconUrl: "img/icono/CACI_verde.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Regular": L.icon({ iconUrl: "img/icono/CACI_amarillo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Malo": L.icon({ iconUrl: "img/icono/CACI_rojo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] })
};

// 🔢 Conteo por estado
const conteoEstadosCACI = {
  "CACI": { Bueno: 0, Regular: 0, Malo: 0 }
};

// 📦 Grupos de capa por estado
const gruposPorEstadoCACI = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSVCACI)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const name = columnas[1]?.trim();
          const clave = columnas[2]?.trim();
          const tipo = columnas[3]?.trim();
          const direc = columnas[4]?.trim();
          const poblacion = columnas[5]?.trim();
          const lat = parseFloat(columnas[6]);
          const lng = parseFloat(columnas[7]);
          const linkGoogle = columnas[8]?.trim();
          const contacto = columnas[9]?.trim();
          const actGratis = columnas[10]?.trim();
          const actCosto = columnas[11]?.trim();
          const observaciones = columnas[12]?.trim();
          const linkFoto = columnas[13]?.trim();
          const estado = columnas[14]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCACI["CACI"][estado]++;
            const icono = iconosEstadoCACI[estado] || iconosEstadoCACI["Regular"];

            let popup = `<b>${name}</b><br>`;
            if (clave) popup += `<b>Clave:</b> ${clave}<br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direc) popup += `<b>Dirección:</b> ${direc}<br>`;
            if (poblacion) popup += `<b>Población Objetivo:</b> ${poblacion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
              const urlFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
              popup += `<b>Foto:</b> <a href="${urlFoto}" target="_blank">Ver imagen</a><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCACI[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: name,
                capa: "CACI",
                marker: marker
              });
            }
          }
        });

        // 📁 Panel lateral desplegable CACI
        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "14px";
        itemCapa.style.fontSize = "13px";

        const details = document.createElement("details");
        details.open = false;
        details.style.marginLeft = "6px";
        details.style.fontSize = "13px";

        const summary = document.createElement("summary");
        summary.style.cursor = "pointer";
        summary.style.fontWeight = "bold";
        summary.style.lineHeight = "1.4";
        summary.innerHTML = `
          <img src="img/icono/CACI.png" width="25" style="vertical-align: middle; margin-right: 8px;">
          Centros de Atención y Cuidados Infantiles (CACI)
        `;
        details.appendChild(summary);

        ["Bueno", "Regular", "Malo"].forEach(estado => {
          const subItem = document.createElement("div");
          subItem.style.marginLeft = "28px";
          subItem.style.lineHeight = "1.5";
          subItem.style.fontSize = "12.5px";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = false;

          checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
              gruposPorEstadoCACI[estado].addTo(map);
            } else {
              map.removeLayer(gruposPorEstadoCACI[estado]);
            }
          });

          const label = document.createElement("label");
          label.style.marginLeft = "6px";
          label.innerHTML = `
            ${estado === "Bueno" ? "🟢" : estado === "Regular" ? "🟡" : "🔴"} 
            ${estado} <span style="color: #555;">(${conteoEstadosCACI["CACI"][estado]})</span>
          `;

          subItem.appendChild(checkbox);
          subItem.appendChild(label);
          details.appendChild(subItem);
        });

        itemCapa.appendChild(details);
        listaCapas.appendChild(itemCapa);
      }
    });
  })
  .catch(error => console.error("Error al cargar CACI:", error));


//Centros Culturales

const urlCSVCC = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHG661z-t8oJTl_ETTnRc9cKU5AAeCZKl2yUNkwgdFSqXmZzXughhU7ImB-dvnkQ/pub?output=csv";

const iconosEstadoCC = {
  "Bueno": L.icon({ iconUrl: "img/icono/CC_verde.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Regular": L.icon({ iconUrl: "img/icono/CC_amarillo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Malo": L.icon({ iconUrl: "img/icono/CC_rojo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] })
};

const conteoEstadosCC = {
  "Centros Culturales": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCC = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSVCC)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCC["Centros Culturales"][estado]++;
            const icono = iconosEstadoCC[estado] || iconosEstadoCC["Regular"];

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
            const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
            popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
            } else {
            popup += `<em>Sin imagen disponible</em><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCC[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Centros Culturales",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral con estilo homogéneo
        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "14px";
        itemCapa.style.fontSize = "13px";
        itemCapa.style.fontFamily = "Montserrat, sans-serif";

        const details = document.createElement("details");
        details.open = false;
        details.style.marginLeft = "6px";
        details.style.fontSize = "13px";
        details.style.fontFamily = "Montserrat, sans-serif";

        const summary = document.createElement("summary");
        summary.style.cursor = "pointer";
        summary.style.fontWeight = "bold";
        summary.style.lineHeight = "1.4";
        summary.style.fontSize = "13px";
        summary.style.fontFamily = "Montserrat, sans-serif";
        summary.innerHTML = `
          <img src="img/icono/CC.png" width="25" style="vertical-align: middle; margin-right: 8px;">
          Centros Culturales
        `;
        details.appendChild(summary);

        ["Bueno", "Regular", "Malo"].forEach(estado => {
          const subItem = document.createElement("div");
          subItem.style.marginLeft = "28px";
          subItem.style.lineHeight = "1.5";
          subItem.style.fontSize = "12.5px";
          subItem.style.fontFamily = "Montserrat, sans-serif";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = false;

          checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
              gruposPorEstadoCC[estado].addTo(map);
            } else {
              map.removeLayer(gruposPorEstadoCC[estado]);
            }
          });

          const label = document.createElement("label");
          label.style.marginLeft = "6px";
          label.style.fontSize = "12.5px";
          label.style.fontFamily = "Montserrat, sans-serif";

          const emojiEstado = estado === "Bueno" ? "🟢" : estado === "Regular" ? "🟡" : "🔴";
          label.innerHTML = `
            ${emojiEstado} ${estado} <span style="color: #555;">(${conteoEstadosCC["Centros Culturales"][estado]})</span>
          `;

          subItem.appendChild(checkbox);
          subItem.appendChild(label);
          details.appendChild(subItem);
        });

        itemCapa.appendChild(details);
        listaCapas.appendChild(itemCapa);
      }
    });
  })
  .catch(error => console.error("Error al cargar Centros Culturales:", error));


//Centros Interactivos
const urlCSV_CI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSESYWPbYWjhESKJclNKWd0gqEKw5PdFlHaY0NpDzg11inxf27cR_Y2jTiAS_6_2Q/pub?output=csv";

const iconosEstadoCI = {
  "Bueno": L.icon({ iconUrl: "img/icono/CI_verde.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Regular": L.icon({ iconUrl: "img/icono/CI_amarillo.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Malo": L.icon({ iconUrl: "img/icono/CI_rojo.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] })
};

const conteoEstadosCI = {
  "Centros Interactivos": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCI = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV_CI)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCI["Centros Interactivos"][estado]++;
            const icono = iconosEstadoCI[estado] || iconosEstadoCI["Regular"];

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
            const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
             popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
            } else {
             popup += `<em>Sin imagen disponible</em><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCI[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Centros Interactivos",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral
        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "14px";
        itemCapa.style.fontSize = "13px";
        itemCapa.style.fontFamily = "Montserrat, sans-serif";

        const details = document.createElement("details");
        details.open = false;
        details.style.marginLeft = "6px";
        details.style.fontSize = "13px";
        details.style.fontFamily = "Montserrat, sans-serif";

        const summary = document.createElement("summary");
        summary.style.cursor = "pointer";
        summary.style.fontWeight = "bold";
        summary.style.lineHeight = "1.4";
        summary.style.fontSize = "13px";
        summary.style.fontFamily = "Montserrat, sans-serif";
        summary.innerHTML = `
          <img src="img/icono/CI.png" width="20" style="vertical-align: middle; margin-right: 8px;">
          Centros Interactivos
        `;
        details.appendChild(summary);

        ["Bueno", "Regular", "Malo"].forEach(estado => {
          const subItem = document.createElement("div");
          subItem.style.marginLeft = "28px";
          subItem.style.lineHeight = "1.5";
          subItem.style.fontSize = "12.5px";
          subItem.style.fontFamily = "Montserrat, sans-serif";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = false;

          checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
              gruposPorEstadoCI[estado].addTo(map);
            } else {
              map.removeLayer(gruposPorEstadoCI[estado]);
            }
          });

          const label = document.createElement("label");
          label.style.marginLeft = "6px";
          label.style.fontSize = "12.5px";
          label.style.fontFamily = "Montserrat, sans-serif";
          const emoji = estado === "Bueno" ? "🟢" : estado === "Regular" ? "🟡" : "🔴";
          label.innerHTML = `
            ${emoji} ${estado} <span style="color: #555;">(${conteoEstadosCI["Centros Interactivos"][estado]})</span>
          `;

          subItem.appendChild(checkbox);
          subItem.appendChild(label);
          details.appendChild(subItem);
        });

        itemCapa.appendChild(details);
        listaCapas.appendChild(itemCapa);
      }
    });
  })
  .catch(error => console.error("Error al cargar Centros Interactivos:", error));


//Casas del Adulto Mayor
const urlCSV_CAM = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5IFXp46_S-RTabO95mZuiiJTWToudyW71SCZIeu1GGfwcsNEJ04OEU2DMc8Jw5Q/pub?output=csv";

const iconosEstadoCAM = {
  "Bueno": L.icon({ iconUrl: "img/icono/CAM_verde.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Regular": L.icon({ iconUrl: "img/icono/CAM_amarillo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Malo": L.icon({ iconUrl: "img/icono/CAM_rojo.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] })
};

const conteoEstadosCAM = {
  "Casas del Adulto Mayor": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCAM = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV_CAM)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCAM["Casas del Adulto Mayor"][estado]++;
            const icono = iconosEstadoCAM[estado] || iconosEstadoCAM["Regular"];

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
            const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
            popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
            } else {
            popup += `<em>Sin imagen disponible</em><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCAM[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Casas del Adulto Mayor",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral
        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "14px";
        itemCapa.style.fontSize = "13px";
        itemCapa.style.fontFamily = "Montserrat, sans-serif";

        const details = document.createElement("details");
        details.open = false;
        details.style.marginLeft = "6px";
        details.style.fontSize = "13px";
        details.style.fontFamily = "Montserrat, sans-serif";

        const summary = document.createElement("summary");
        summary.style.cursor = "pointer";
        summary.style.fontWeight = "bold";
        summary.style.lineHeight = "1.4";
        summary.style.fontSize = "13px";
        summary.style.fontFamily = "Montserrat, sans-serif";
        summary.innerHTML = `
          <img src="img/icono/CAM.png" width="25" style="vertical-align: middle; margin-right: 8px;">
          Casas del Adulto Mayor
        `;
        details.appendChild(summary);

        ["Bueno", "Regular", "Malo"].forEach(estado => {
          const subItem = document.createElement("div");
          subItem.style.marginLeft = "28px";
          subItem.style.lineHeight = "1.5";
          subItem.style.fontSize = "12.5px";
          subItem.style.fontFamily = "Montserrat, sans-serif";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = false;

          checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
              gruposPorEstadoCAM[estado].addTo(map);
            } else {
              map.removeLayer(gruposPorEstadoCAM[estado]);
            }
          });

          const label = document.createElement("label");
          label.style.marginLeft = "6px";
          label.style.fontSize = "12.5px";
          label.style.fontFamily = "Montserrat, sans-serif";
          const emoji = estado === "Bueno" ? "🟢" : estado === "Regular" ? "🟡" : "🔴";
          label.innerHTML = `
            ${emoji} ${estado} <span style="color: #555;">(${conteoEstadosCAM["Casas del Adulto Mayor"][estado]})</span>
          `;

          subItem.appendChild(checkbox);
          subItem.appendChild(label);
          details.appendChild(subItem);
        });

        itemCapa.appendChild(details);
        listaCapas.appendChild(itemCapa);
      }
    });
  })
  .catch(error => console.error("Error al cargar Casas del Adulto Mayor:", error));

//Centros de Artes y Oficios
const urlCSV_CAO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vROHBchPW4nHQ6PN9Ivf1I0XR6OMvOpSUYLmUV4dxgpQoPDOfh_sCrbiA9csekUmg/pub?output=csv";

const iconosEstadoCAO = {
  "Bueno": L.icon({ iconUrl: "img/icono/CAO_verde.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Regular": L.icon({ iconUrl: "img/icono/CAO_amarillo.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] }),
  "Malo": L.icon({ iconUrl: "img/icono/COA_rojo.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] })
};

const conteoEstadosCAO = {
  "Centros de Artes y Oficios": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCAO = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV_CAO)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCAO["Centros de Artes y Oficios"][estado]++;
            const icono = iconosEstadoCAO[estado] || iconosEstadoCAO["Regular"];

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
             const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
                 popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
                    } else {
                 popup += `<em>Sin imagen disponible</em><br>`;
                    }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCAO[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Centros de Artes y Oficios",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral
        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "14px";
        itemCapa.style.fontSize = "13px";
        itemCapa.style.fontFamily = "Montserrat, sans-serif";

        const details = document.createElement("details");
        details.open = false;
        details.style.marginLeft = "6px";
        details.style.fontSize = "13px";
        details.style.fontFamily = "Montserrat, sans-serif";

        const summary = document.createElement("summary");
        summary.style.cursor = "pointer";
        summary.style.fontWeight = "bold";
        summary.style.lineHeight = "1.4";
        summary.style.fontSize = "13px";
        summary.style.fontFamily = "Montserrat, sans-serif";
        summary.innerHTML = `
          <img src="img/icono/CAO.png" width="20" style="vertical-align: middle; margin-right: 8px;">
          Centros de Artes y Oficios
        `;
        details.appendChild(summary);

        ["Bueno", "Regular", "Malo"].forEach(estado => {
          const subItem = document.createElement("div");
          subItem.style.marginLeft = "28px";
          subItem.style.lineHeight = "1.5";
          subItem.style.fontSize = "12.5px";
          subItem.style.fontFamily = "Montserrat, sans-serif";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = false;

          checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
              gruposPorEstadoCAO[estado].addTo(map);
            } else {
              map.removeLayer(gruposPorEstadoCAO[estado]);
            }
          });

          const label = document.createElement("label");
          label.style.marginLeft = "6px";
          label.style.fontSize = "12.5px";
          label.style.fontFamily = "Montserrat, sans-serif";
          const emoji = estado === "Bueno" ? "🟢" : estado === "Regular" ? "🟡" : "🔴";
          label.innerHTML = `
            ${emoji} ${estado} <span style="color: #555;">(${conteoEstadosCAO["Centros de Artes y Oficios"][estado]})</span>
          `;

          subItem.appendChild(checkbox);
          subItem.appendChild(label);
          details.appendChild(subItem);
        });

        itemCapa.appendChild(details);
        listaCapas.appendChild(itemCapa);
      }
    });
  })
  .catch(error => console.error("Error al cargar Centros de Artes y Oficios:", error));
});