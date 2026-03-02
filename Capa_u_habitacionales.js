// Verificar que Leaflet esté disponible antes de ejecutar el script
if (typeof L === "undefined") {
  console.error("Leaflet no está cargado correctamente. Verifica que la biblioteca se haya incluido en index.html.");
} else {
  document.addEventListener("DOMContentLoaded", function () {
      console.log("DOM cargado, iniciando carga del GeoJSON de Unidades Habitacionales...");

      // Verificar que 'map' ya esté definido
      if (typeof map === "undefined") {
          console.error("El objeto 'map' no está definido. Verifica que se haya inicializado en otro archivo.");
          return;
      }

      // Declarar la variable global para la capa de Unidades Habitacionales
      window.U_Habitacionales_layer = null;

      // Deshabilitar el checkbox hasta que la capa se cargue
      var toggleCheckbox = document.getElementById("toggleUHabitacionalesCheckbox");
      if (toggleCheckbox) {
          toggleCheckbox.disabled = true;
      }

      // Función para cargar el GeoJSON
      function loadGeoJSON(url) {
          window.U_Habitacionales_layer = null;

          // Agregar un parámetro de cache busting para evitar el uso de versiones cacheadas
          const urlConCacheBust = url + "?v=" + Date.now();
          console.log(`Cargando GeoJSON de Unidades Habitacionales desde: ${urlConCacheBust}`);

          fetch(urlConCacheBust)
              .then(response => response.ok ? response.json() : Promise.reject(`Error al cargar el archivo: ${response.statusText}`))
              .then(data => {
                  console.log("GeoJSON de Unidades Habitacionales cargado:", data);

                  if (!data || !data.features || data.features.length === 0) {
                      throw new Error("El archivo GeoJSON no contiene 'features' válidos.");
                  }

                  // Crear la capa GeoJSON y asignar estilos
                  window.U_Habitacionales_layer = L.geoJSON(data, {
                      pointToLayer: (feature, latlng) => {
                          // Obtener el número de casas o departamentos
                          const numViviendas = feature.properties?.["NO. DE CASAS O DEPARTAMENTOS"] || 0;
                          
                          // Calcular el tamaño del icono basado en el número de viviendas
                          // Tamaño base: 20px, escala hasta 50px
                          let tamañoIcono;
                          if (numViviendas <= 50) {
                              tamañoIcono = 20;
                          } else if (numViviendas <= 100) {
                              tamañoIcono = 25;
                          } else if (numViviendas <= 200) {
                              tamañoIcono = 30;
                          } else if (numViviendas <= 500) {
                              tamañoIcono = 35;
                          } else if (numViviendas <= 1000) {
                              tamañoIcono = 40;
                          } else if (numViviendas <= 2000) {
                              tamañoIcono = 45;
                          } else {
                              tamañoIcono = 50;
                          }
                          
                          // Icono de edificio de apartamentos con tamaño variable
                          const iconoEdificio = L.divIcon({
                              html: `<div style="font-size: ${tamañoIcono}px; line-height: 1;">&#127970;</div>`,
                              className: 'emoji-icon',
                              iconSize: [tamañoIcono, tamañoIcono],
                              iconAnchor: [tamañoIcono/2, tamañoIcono/2],
                              popupAnchor: [0, -tamañoIcono/2]
                          });
                          return L.marker(latlng, { icon: iconoEdificio });
                      },
                      style: feature => {
                          // Estilo para polígonos
                          return { 
                              color: "#3498db", 
                              weight: 2, 
                              fillOpacity: 0.6,
                              fillColor: "#3498db"
                          };
                      },
                      onEachFeature: (feature, layer) => {
                          const props = feature.properties;
                          let popupContent = `<div style="font-size: 12px;"><h4 style="font-size: 14px; margin-bottom: 8px;">${props?.NOMBRE || "Unidad Habitacional"}</h4>`;
                          
                          // Mostrar todos los atributos disponibles excepto ADMINISTRADOR y COPACO
                          if (props) {
                              for (let key in props) {
                                  if (key !== 'NOMBRE' && key !== 'ADMINISTRADOR' && key !== 'COPACO' && props[key]) {
                                      popupContent += `<p style="margin: 4px 0;"><strong>${key}:</strong> ${props[key]}</p>`;
                                  }
                              }
                          }
                          
                          popupContent += `</div>`;
                          layer.bindPopup(popupContent);

                          if (L.DomEvent && typeof L.DomEvent.disableClickPropagation === "function") {
                              L.DomEvent.disableClickPropagation(layer);
                          }

                          // Eventos de resaltado (solo para polígonos)
                          if (layer.setStyle) {
                              layer.on("mouseover", () => layer.setStyle({ fillOpacity: 1, weight: 3 }));
                              layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.6, weight: 2 }));
                          }
                      }
                  });

                  console.log("Capa GeoJSON de Unidades Habitacionales cargada correctamente (apagada por defecto).");

                  // Habilitar el checkbox para que el usuario pueda interactuar
                  if (toggleCheckbox) {
                      toggleCheckbox.disabled = false;
                  }
              })
              .catch(error => console.error("Error al cargar el GeoJSON de Unidades Habitacionales:", error));
      }

      // Ejecutar la carga del GeoJSON
      loadGeoJSON("archivos/vectores/u_habitacionales.geojson");
  });
}
