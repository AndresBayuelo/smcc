$(document).ready(function(){

  $('#btnbsq').on('click', function (){
    event.preventDefault();
    $.get( '/obtener_plantacion', $('form#bsq').serialize() )
      .done(function( data ) {
        if (data.exe.hasOwnProperty('errorNum')){
          console.error(data);
        }else{
          if (data.exe.objects){
            let plantacion = data.exe.objects;
            $('resultbsq').empty();
            let card = $('<div class="card my-2"></div>');
            card.append('<div class="card-body"></div>');
            card.children('.card-body').append('<h5 class="card-title">'+plantacion.id+'</h5>');
            card.children('.card-body').append('<h6 class="card-subtitle mb-2 text-muted" id="std">'+plantacion.estado+'</h6>');
            card.children('.card-body').append('<p class="card-text">'+plantacion.descripcion+'</p>');
            card.children('.card-body').append('<p class="card-text text-right btns"></p>');
            card.children('.card-body').children('.btns').append('<button type="button" class="btn btn-secondary btnA">Bomba Agua</button>');
            card.children('.card-body').children('.btns').children('.btnA').on('click', function (){
              event.preventDefault();
              $.get( 'http://'+plantacion.ip+'/19', {} );
            });
            card.children('.card-body').children('.btns').append('<button type="button" class="btn btn-secondary btnB">Ventilador</button>');
            card.children('.card-body').children('.btns').children('.btnB').on('click', function (){
              event.preventDefault();
              $.get( 'http://'+plantacion.ip+'/18', {} );
            });
            if (plantacion.sgm_operativo.length){
              card.append('<ul class="list-group list-group-flush"></ul>');
              for(let i=0;i<plantacion.sgm_operativo.length;i++){
                let li = $('<li class="list-group-item" id="log"></li>');
                li.append('<p class="card-text">'+plantacion.sgm_operativo[i].fecha+',	'+plantacion.sgm_operativo[i].descripcion+'</p>');
                card.children('ul').append(li);
              }
            }
            $('#resultbsq').append(card);
          }
          console.log(data);
        }
      }).fail(function() {
        console.error( "error" );
      });
  });

});