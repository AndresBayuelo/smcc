$(document).ready(function(){

  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/layers/GraphicsLayer"
  ], function(Map, MapView, Graphic, GraphicsLayer) {

    var map = new Map({
      basemap: "osm"
    });

    var graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    $.get( '/obtener_plantaciones', {} )
      .done(function( data ) {
      if (data.exe.hasOwnProperty('errorNum')){
        console.error(data);
      }else{
        for(let i=0; i<data.exe.objects.length; i++){

          let plantacion = data.exe.objects[i];

          var point = {
            type: "point",
            longitude: plantacion.longitud,
            latitude: plantacion.latitud
          };
      
          /*var simpleMarkerSymbol = {
            type: "simple-marker",
            color: [226, 119, 40],  // orange
            outline: {
              color: [255, 255, 255], // white
              width: 1
            }
          };*/
      
          var simpleMarkerSymbol = {
            type: "picture-marker",
            url: "/img/hoja.png",
            width: "32px",
            height: "32px"
          }
      
          //*** ADD ***//
          // Create attributes
          var attributes = {
            Name: plantacion.id,  // The name of the
            Location: "",  // The owner of the
          };
          // Create popup template
          var popupTemplate = {
            title: plantacion.id,
            content: "\
              <b>Latitud:</b> "+plantacion.latitud+"<br>\
              <b>Longitud:</b> "+plantacion.longitud+"<br>\
              <b>Humedad ambiente:</b> "+plantacion.humedadamb+"% <br>\
              <b>Temperatura Cº:</b> "+plantacion.tempcent+" <br>\
              <b>Temperatura Fº:</b> "+plantacion.tempfar+" <br>\
              <b>Humedad Suelo:</b> "+plantacion.humedadsuelo+" <br>"
          };
      
          var pointGraphic = new Graphic({
            geometry: point,
            symbol: simpleMarkerSymbol,
            //*** ADD ***//
            attributes: attributes,
            popupTemplate: popupTemplate
          });
      
          graphicsLayer.add(pointGraphic);
          
        }
        console.log(data);
      }
      }).fail(function() {
        console.error( "error" );
      });

    var view = new MapView({
      container: "map",
      map: map,
      center: [-74.08175, 4.60971], // longitude, latitude
      zoom: 11
    });
  });
  
});