document.addEventListener("DOMContentLoaded", function () {
  if (typeof L === "undefined" || typeof map === "undefined") {
    console.error("Leaflet o el mapa no están definidos.");
    return;
  }

  if (!map.getPane('coloniasPane')) {
    map.createPane('coloniasPane');
    map.getPane('coloniasPane').style.zIndex = 500;
  }

  let copacoPorClaveUT = {}; // Diccionario para COPACO por CLAVE UT

  // Cargar CSV con nombres de COPACO
  fetch("archivos/tablas/copaco_por_claveut.csv")
    .then(res => res.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          results.data.forEach(row => {
            const clave = row["Clave UT"]?.trim().toUpperCase();
            const nombre = row["Nombre Completo del COPACO"]?.trim();
            if (clave && nombre) {
              if (!copacoPorClaveUT[clave]) {
                copacoPorClaveUT[clave] = [];
              }
              copacoPorClaveUT[clave].push(nombre);
            }
          });
          cargarGeojsonColonias(); // Solo después de tener COPACO
        }
      });
    })
    .catch(error => console.error("Error al cargar CSV de COPACO:", error));

  function cargarGeojsonColonias() {
    fetch("archivos/vectores/colonias_wgs84_geojson_renombrado.geojson")
      .then(response => {
        if (!response.ok) throw new Error("Error al cargar el GeoJSON: " + response.statusText);
        return response.json();
      })
      .then(data => {
        console.log("GeoJSON de colonias cargado correctamente:", data);

        capaColonias = L.geoJSON(data, {
          pane: 'coloniasPane',
          style: estiloColoniasBase,
          onEachFeature: function (feature, layer) {
            const nombreColonia = feature.properties?.NOMBRE;
            const claveUT = feature.properties?.["CLAVE UT"]?.trim().toUpperCase();

            if (nombreColonia) {
              let popupContent = `
                <div class="popup-contenido">
                  <h4 class="popup-titulo">${nombreColonia}</h4>`;

              if (claveUT && copacoPorClaveUT[claveUT]) {
                popupContent += `
                  <div class="popup-copaco">
                    <b>COPACOS:</b>
                    <ul>
                      ${copacoPorClaveUT[claveUT].map(nombre => `<li>${nombre}</li>`).join("")}
                    </ul>
                  </div>`;
              }

              popupContent += `
                  <div class="estadisticasBoton">
                    <button class="VerEstadisticas btn btn-danger" onclick="verEstadisticas('${nombreColonia}')">
                      Ver Estadísticas
                    </button>
                  </div>
                </div>`;

              layer.bindPopup(popupContent);

              layer.on("click", function () {
                seleccionarColonia(layer);
              });
            }
          }
        }).addTo(map);

        if (!vistaInicialAplicada) {
          map.fitBounds(capaColonias.getBounds());
          vistaInicialAplicada = true;
        }
      })
      .catch(error => console.error("Error al cargar el GeoJSON:", error));
  }

  function seleccionarColonia(layer) {
    if (!capaColonias) return;

    capaColonias.eachLayer(capa => {
      capa.setStyle(estiloColoniasBase);
    });

    layer.setStyle({
      color: "yellow",
      weight: 6,
      fillOpacity: 0
    });

    layer.bringToFront();
    coloniaSeleccionada = layer;

    const bounds = layer.getBounds();
    if (window.innerWidth > 768) {
      map.fitBounds(bounds, { paddingTopLeft: [300, 0], paddingBottomRight: [0, 0] });
    } else {
      map.setView(bounds.getCenter(), 15);
    }

    setTimeout(() => {
      capaColonias.eachLayer(capa => {
        if (capa !== layer) {
          capa.setStyle({
            color: "gray",
            weight: 3,
            fillOpacity: 0.5
          });
        }
      });
    }, 300);

    layer.openPopup();
  }

  window.zoomAColonia = function (nombreColonia) {
    if (!capaColonias) {
      console.warn("La capa de colonias aún no se ha cargado.");
      return;
    }

    let encontrado = false;

    capaColonias.eachLayer(layer => {
      const nombre = layer.feature?.properties?.NOMBRE?.trim().toLowerCase();
      if (nombre === nombreColonia.trim().toLowerCase()) {
        seleccionarColonia(layer);
        encontrado = true;
      }
    });

    if (!encontrado) {
      console.warn(`No se encontró la colonia: ${nombreColonia}`);
    }
  };
});
