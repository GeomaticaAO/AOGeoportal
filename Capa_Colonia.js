document.addEventListener("DOMContentLoaded", function () {
    if (typeof L === "undefined" || typeof map === "undefined") {
        console.error("Leaflet o el mapa no están definidos. Verifica la carga de `mapabase.js`.");
        return;
    }

    if (!map.getPane('coloniasPane')) {
        map.createPane('coloniasPane');
        map.getPane('coloniasPane').style.zIndex = 500;
    }

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
                    if (feature.properties?.NOMBRE) {
                        const nombreColonia = feature.properties.NOMBRE;
                        const popupContent = `
                            <div class="popup">
                                <b>Colonia:</b> ${nombreColonia}<br>
                                <div class="estadisticasBoton">
                                    <button class="VerEstadisticas btn btn-danger" onclick="verEstadisticas('${nombreColonia}')">
                                        Ver Estadísticas
                                    </button>
                                </div>
                            </div>
                        `;
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