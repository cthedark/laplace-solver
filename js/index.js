$(function(){
  // Init
  initBoundaryUI();
});

function toggleAbout(){
  $('.about, .tool, .go-to-about, .go-to-tool').toggle();
}

function solve(){

  Laplace.init(30, 30);
  OutputHelper.initCanvas(30, 30, 20, $('#color-coded-canvas'));

  disableUI();
  $('.post-solve-options').hide();
  try{
    Laplace.setBoundaries(
      extractBoundaryParams('left'),
      extractBoundaryParams('top'),
      extractBoundaryParams('right'),
      extractBoundaryParams('bottom')
    );
  } catch(e){
    showModal('Please input all parameters in number. Nothing can be blank. (Error Detail: ' + e + ')', 'Error');
    return;
  }

  if($('#param-solve-immediately').is(':checked') == true){
    Laplace.calculate(100);
    //OutputHelper.outputResultToText(Laplace.getResult(), $('.number-output-container'));
    OutputHelper.outputResultToCanvas(Laplace.getResult());
    done();
  } else{
    tick(0);
  }
  
  function tick(total){
    total++;
    if (total > 50) {
      done();
      return;
    }
    Laplace.calculate(2);
    //OutputHelper.outputResultToText(Laplace.getResult(), $('.number-output-container'));
    OutputHelper.outputResultToCanvas(Laplace.getResult());
    setTimeout(function(){tick(total);}, 200);
  }

  function done(){
    enableUI(); 
    $('.post-solve-options').show(); 
  }
    
}

function extractBoundaryParams(side){
  var form_group = $('#boundary-'+side),
      boundary_type = form_group.find('.param-boundary-type').val();

  switch(boundary_type){
    case 'constant':
      var param1 = parseFloat(form_group.find('.constant_param1').val());
      if(isNaN(param1)) throw 'Constant Param is NaN';
      return param1;
    case 'sinusoid':
      var param1 = parseFloat(form_group.find('.sinusoid_param1').val()),
          param2 = parseFloat(form_group.find('.sinusoid_param2').val());
      if(isNaN(param1)) throw 'Amplitude Param is NaN';
      if(isNaN(param2)) throw 'Frequecy Param is NaN';

      return function(x, total){
        x = x - total/2;
        return param1 * Math.sin(param2 * (Math.PI/8) * x);
      }
    case 'polynomial':
      var param1 = parseFloat(form_group.find('.polynomial_param1').val()),
          param2 = parseFloat(form_group.find('.polynomial_param2').val()),
          param3 = parseFloat(form_group.find('.polynomial_param3').val());

      if(isNaN(param1)) throw 'X^3 Multiplier Param is NaN';
      if(isNaN(param2)) throw 'X^2 Multiplier Param is NaN';
      if(isNaN(param3)) throw 'X Multiplier Param is NaN';

      return function(x, total){
        x = x - total/2;
        return param1 * Math.pow(x, 3) + param2 * Math.pow(x, 2) + param3 * x;
      }
    default:
      return 0;
  }
}

function disableUI() {
  $('params input, #solve-button').prop('disabled', true);
}

function enableUI(){
  $('params input, #solve-button').prop('disabled', false);
}

function initBoundaryUI(){
  var template = $("#boundary-template"),
      form = $('.tool .params form');
  _.forEach(['Bottom', 'Right', 'Top', 'Left'], function(value, i){
    var control = template.clone().attr('id', 'boundary-' + value.toLowerCase());
    control.find('label').html(value + ':&nbsp;');
    control.find('.constant_param1').val(4-i); // Set constant defaults like 1,2,3,4
    control.find('select').change(function(e){
      $(this).parent().children('span').hide();
      $(this).parent().children('.'+$(this).val()).show();
    });
    form.prepend(control);
  });
  template.remove();
  form.prepend($('<h3>').text('Boundaries'));
}

function showModal(msg, title){
  $('#modal .modal-body').empty().append(
    $('<p/>').html(msg)
  );

  $('#modal .modal-title').text(title ? title: '');
  $('#modal').modal('show');
}

function showRawResult(){
  // TODO
  var text_data = "This feature is work in progress.";
  showModal(text_data, 'Raw Result Array');
}