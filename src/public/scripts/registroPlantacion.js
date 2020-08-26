$(document).ready(function(){

  $('#btnplt').on('click', function (){
    event.preventDefault();
    $.post( '/registro_plantacion', $('form#plt').serialize() )
      .done(function( data ) {
        $('.alert').parent().parent().remove();
        let _alert = $('<div class="row"></div>');
        _alert.prepend('<div class="col-12"></div>');
        if (data.exe.hasOwnProperty('errorNum')){
          _alert.find('div').prepend('<div class="alert alert-danger" role="alert">'+data.exe.desc+'</div>');
          $('form#plt').prepend(_alert);
          console.error(data);
        }else{
          _alert.find('div').prepend('<div class="alert alert-success" role="alert"> Plantación registrada </div>');
          $('form#plt').prepend(_alert);
          console.log(data);
          setTimeout(function(){ 
            $('#modalRegPlt').modal('toggle');
            $('form#plt').find('#identplt').val('');
            $('form#plt').find('#descplt').val('');
            $('.alert').parent().parent().remove();
          },5000);
        }
      }).fail(function() {
        console.error( "error" );
      });
  });

});