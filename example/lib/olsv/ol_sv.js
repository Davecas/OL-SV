/**
 * @author Davecas (GitHub)
 *
 * @version 1.0
 * @desc Librería para integrar Street View en OpenLayers 3. Sigue haciendo
 * falta una clave de la API de Javascript de Google Maps.
 * La carpeta del proyecto debe mantenerse con la misma estructura y nombre 
 * para que funcione correctamente la imagen del puntero y el css
 *
 *
 */
(function(ol){
	"use strict";

	// Función auxiliar para covertir las coordenadas
	let convertCoords = function(coords){
		let coordinate = ol.proj.toLonLat([coords[0],coords[1]], "EPSG:3857");
		let latLng = {lat: coordinate[1], lng: coordinate[0]};
		return latLng;
	}

	ol.streetView = {
		/** @function 
		 * @name setStreetView
		 *
		 * @param {Object} params - Objeto con parametros.
		 * @param {Array<number>} params.coords- REQUERIDO. Array de coordenadas con latitud y longitud
		 * @param {ol.Map} params.map - REQUERIDO. Mapa de Openlayers 3. @see http://openlayers.org/en/latest/apidoc/ol.Map.html
		 * @param {boolean} [params.update] - Si no se pasa nada sera false por defecto.
		 * @param {callbackFunction} [params.onPositionChange] - Callback para ejecutar
		 * cuando se actualice la posicion en Street View
		 *
		 * @callback {function} onPositionChange
		 * @param {Array<number>} coords - Array de latitud y longitud.
		 * @param {Object} data - Datos de la petición al servicio
		 * de Google Street View.
		 */
		setStreetView: function(params = {}, callback){

			if(params.coords === undefined || !Array.isArray(params.coords || params.coords.length !== 2)){
				throw Error("Se deben pasar unas coordenadas válidas");
			}

			if((params.update !== undefined && params.update !== null) && typeof params.update !== "boolean"){
				throw TypeError("El parametro 'update' no es válido");
			}

			if(params.map === undefined || !(params.map instanceof ol.Map)){
				throw Error("Se debe pasar un mapa valido");
			}

			if(params.onPositionChange !== undefined && typeof params.onPositionChange !== "function"){
				throw typeError("La funcion onPositionChange no es una función válida");
			}

			let success = false;
			let coords = convertCoords(params.coords);
			let map = params.map;
			let update = params.update || false;
			let sv_service = new google.maps.StreetViewService();

			sv_service.getPanorama({
				location: coords,
				radius: 50
			}, function(data, status){
				if(status === google.maps.StreetViewStatus.OK){
					let mapContainer = map.getTargetElement();

					let panorama = map.panorama;
					if(panorama !== undefined){
						panorama.setPosition(coords);
						panorama.setVisible(true);
					}
					else{
						panorama = new google.maps.StreetViewPanorama(mapContainer,{
							position: coords,
							visible: true
						});

						panorama.setEnableCloseButton(true);

						//Evento cuando se cambia de posición en Street View
						panorama.addListener("position_changed", function(){
							if(update){
								let position = this.getPosition();
								let coords = ol.proj.fromLonLat([position.lng(),position.lat()], "EPSG:3857");
								map.getView().setCenter(coords);
							}

							if(typeof params.onPositionChange === "function"){
								params.onPositionChange(coords, data, status);
							}
						});

						map.panorama = panorama;
					}

					success = true;
				}
				else { // Si no encuentra imagenes para la petición de unas coordenadas
					alert("No valid location found here");
				}

				//Ejecuta el callback si es una funcion
				if(typeof callback === "function") {
					callback(success);
				}
			});
		},
		/**
		 * Es un control personalizado.
		 * @constructor
		 * @extends ol.control.Control
		 * @see http://openlayers.org/en/latest/apidoc/ol.control.Control.html
		 * @param {Object} opt_options - Opciones al crear el control personalizado
		 * @param {HTMLElement} [opt_options.element] - Solo se necesita si se crea un control heredando de este.
		 * @param {HTMLElement} [opt_options.target] - El elemento en el que se quiere incrustar el control.
		 * Si no se especifica, será el propio mapa.
		 * @param {ol.Map} opt_options.map - REQUERIDO. El mapa sobre el que se quiere incrustar Street View.
		 * @param {string} opt_options.className - El atributo 'class' usado para el botón.
		 * Usado para agregar CSS propio.
		 * @param {callback} opt_options.onPositionChange - Este callback se ejecuta
		 * cuando se cambia la posicion en Street View.
		 *
		 * @callback
		 * @param {Array<number>} coords - Array de coordenadas coords[0] = latitud. coords[1] = longitud
		 * @param {Object} data - Datos de la peticion al servicio de Street View Service.
		 * @param {string} status - Estado de la peticion a Street View Service.
		 * Contiene si se encuentran datos para unas coordenadas o si por el contrario
		 * no se encontraron daos validos o si hubo un error.
		 *
		 */
		StreetViewControl: function(opt_options = {}){

			if(!(this instanceof ol.streetView.	StreetViewControl)){
				throw new Error("Es necesario llamar al constructor con la palabra clave 'new'.");
			}

			let options = opt_options;
			let isPressed = false;
			let initialMapClass = "";
			let evtKey = null;
			let map = null;

			/** @method getMap
			 * @desc devuelve el mapa al que está unido la instancia del control.
			 */
			this.getMap = function(){
				return options.map;
			}

			if(options.className === undefined || options.className === null){
				if(options.target === undefined || options.className === null){
					options.className = "ol-control street-view-control";
				}
				else if(!(options.target instanceof HTMLElement)){
					throw new TypeError("'target': Debe ser un string.");
				}
				else{
					options.className = "";
				}
			}
			else if(typeof options.className !== "string"){
				throw TypeError("className: Tipo de parametro inválido.");
			}

			if(!(options.map instanceof ol.Map)){
				throw new TypeError("'map' debe ser de tipo ol.Map");
			}

			map = options.map;
			let mapContainer = map.getTargetElement();
			initialMapClass = mapContainer.className;
			mapContainer.className += " cursor-def";

			let toggleStreetView = function(ev){
				if(!isPressed){
					isPressed = true;
					mapContainer.className += " cursor-sv";

					evtKey = map.on("click", function(ev){
						let coords = ev.coordinate;
						let _onPositionChange = options.onPositionChange;

						ol.streetView.setStreetView({
							/** @type {Array<number>} coordenadas para street view */
							coords: coords,
							/** @type {ol.Map} mapa de OpenLayers.
							 * Si se pasa el mapa, la vista se actualizará
							 * según te mueves por Street View
							 */
							map: map,
							update: options.update,
							/** @type {function} callback */
							onPositionChange: _onPositionChange
						},function(success){
							if(success){
								mapContainer.className = initialMapClass;
								isPressed = false;
								map.unByKey(evtKey);
							}
						});
					});
				}
				else{
					isPressed = false;
					mapContainer.className = initialMapClass;
					map.unByKey(evtKey);
				}
			}

			//Crear elemento personalizado
			let element = document.createElement("div");
			element.className = options.className;
			element.id = "control-sv";

			if(options.content === undefined){
				element.textContent = "SV";
			}
			else if(options.content instanceof HTMLElement){
				element.appendChild(options.content);
			}
			else{
				throw TypeError("content: must be string or HTMLElement");
			}

			// Añadir evento de clic al botón.
			element.addEventListener("click", toggleStreetView, false);

			ol.control.Control.call(this,{
				element: element,
				target: options.target
			});

			options.map.addControl(this);
		}
	};

	ol.inherits(ol.streetView.StreetViewControl, ol.control.Control);
})(ol);