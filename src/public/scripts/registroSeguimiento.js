$(document).ready(function(){

  $('#btnsgm').on('click', function (){
    event.preventDefault();
    $.post( '/registro_sgmoperativo', $('form#sgm').serialize() )
      .done(function( data ) {
        $('.alert').parent().parent().remove();
        let _alert = $('<div class="row"></div>');
        _alert.prepend('<div class="col-12"></div>');
        if (data.exe.hasOwnProperty('errorNum')){
          _alert.find('div').prepend('<div class="alert alert-danger" role="alert">'+data.exe.desc+'</div>');
          $('form#sgm').prepend(_alert);
          console.error(data);
        }else{
          _alert.find('div').prepend('<div class="alert alert-success" role="alert"> Seguimiento registrado </div>');
          $('#log').prepend('<p class="card-text">'+$('form#sgm').find('#fechasgm').val()+' '+$('form#sgm').find('#descsgm').val()+'</p>');
          $('#std').text($('form#sgm').find('#stdsgm').val());
          $('form#sgm').prepend(_alert);
          console.log(data);
          setTimeout(function(){ 
            $('#modalSgm').modal('toggle');
                $('form#sgm').find('#identsgm').val('');
                $('form#sgm').find('#fechasgm').val('');
                $('form#sgm').find('#descsgm').val('');
                $('form#sgm').find('#imgcsgm').val('');
                $('.alert').parent().parent().remove();
          },5000);
        }
      }).fail(function() {
        console.error( "error" );
      });
  });

});