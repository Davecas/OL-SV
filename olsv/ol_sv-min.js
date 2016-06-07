(function(ol){"use strict";let convertCoords=function(coords){let coordinate=ol.proj.toLonLat([coords[0],coords[1]],"EPSG:3857");let latLng={lat:coordinate[1],lng:coordinate[0]};return latLng;}
ol.streetView={setStreetView:function(params={},callback){if(params.coords===undefined||!Array.isArray(params.coords||params.coords.length!==2)){throw Error("Se deben pasar unas coordenadas válidas");}
if((params.update!==undefined&&params.update!==null)&&typeof params.update!=="boolean"){throw TypeError("El parametro 'update' no es válido");}
if(params.map===undefined||!(params.map instanceof ol.Map)){throw Error("Se debe pasar un mapa valido");}
if(params.onPositionChange!==undefined&&typeof params.onPositionChange!=="function"){throw typeError("La funcion onPositionChange no es una función válida");}
let success=false;let coords=convertCoords(params.coords);let map=params.map;let update=params.update||false;let sv_service=new google.maps.StreetViewService();sv_service.getPanorama({location:coords,radius:50},function(data,status){if(status===google.maps.StreetViewStatus.OK){let mapContainer=map.getTargetElement();let panorama=map.panorama;if(panorama!==undefined){panorama.setPosition(coords);panorama.setVisible(true);}
else{panorama=new google.maps.StreetViewPanorama(mapContainer,{position:coords,visible:true});panorama.setEnableCloseButton(true);panorama.addListener("position_changed",function(){if(update){let position=this.getPosition();let coords=ol.proj.fromLonLat([position.lng(),position.lat()],"EPSG:3857");map.getView().setCenter(coords);}
if(typeof params.onPositionChange==="function"){params.onPositionChange(coords,data,status);}});map.panorama=panorama;}
success=true;}
else{alert("No valid location found here");}
if(typeof callback==="function"){callback(success);}});},StreetViewControl:function(opt_options={}){if(!(this instanceof ol.streetView.StreetViewControl)){throw new Error("Es necesario llamar al constructor con la palabra clave 'new'.");}
let options=opt_options;let isPressed=false;let initialMapClass="";let evtKey=null;let map=null;this.getMap=function(){return options.map;}
if(options.className===undefined||options.className===null){if(options.target===undefined||options.className===null){options.className="ol-control street-view-control";}
else if(!(options.target instanceof HTMLElement)){throw new TypeError("'target': Debe ser un string.");}
else{options.className="";}}
else if(typeof options.className!=="string"){throw TypeError("className: Tipo de parametro inválido.");}
if(!(options.map instanceof ol.Map)){throw new TypeError("'map' debe ser de tipo ol.Map");}
map=options.map;let mapContainer=map.getTargetElement();initialMapClass=mapContainer.className;mapContainer.className+=" cursor-def";let toggleStreetView=function(ev){if(!isPressed){isPressed=true;mapContainer.className+=" cursor-sv";evtKey=map.on("click",function(ev){let coords=ev.coordinate;let _onPositionChange=options.onPositionChange;ol.streetView.setStreetView({coords:coords,map:map,update:options.update,onPositionChange:_onPositionChange},function(success){if(success){mapContainer.className=initialMapClass;isPressed=false;map.unByKey(evtKey);}});});}
else{isPressed=false;mapContainer.className=initialMapClass;map.unByKey(evtKey);}}
let element=document.createElement("div");element.className=options.className;element.id="control-sv";if(options.content===undefined){element.textContent="SV";}
else if(options.content instanceof HTMLElement){element.appendChild(options.content);}
else{throw TypeError("content: must be string or HTMLElement");}
element.addEventListener("click",toggleStreetView,false);ol.control.Control.call(this,{element:element,target:options.target});options.map.addControl(this);}};ol.inherits(ol.streetView.StreetViewControl,ol.control.Control);})(ol);