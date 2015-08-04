$(function(){
  // Load the template file.
  $.get( 'laplace.html' ).then( function ( template ) {
    ractive = new Ractive({
      el: '#laplace',
      template: template,

      // Models
      data: {
        // Boundary Options
        boundaries: [
          {position: 'Left', id: 'left', const_def: 0},
          {position: 'Top', id: 'top', const_def: 0, selected_type: 'sinusoid'},
          {position: 'Right', id: 'right', const_def: 0},
          {position: 'Bottom', id: 'bottom', const_def: 1, selected_type: 'array'}
        ],
        // Solution Options
        x: 30,
        y: 30,
        num_iterations: 50,
        // Animation Options
        no_anim: false,
        anim_interval: 120,
        anim_interval_options: [
          {time: 70, name: 'Fast'},
          {time: 120, name: 'Normal (Recommended)'},
          {time: 240, name: 'Slow'}
        ]
      }
    });
  });
});

function toggleAbout(){
  $('.about, .tool, .go-to-about, .go-to-tool').toggle();
}

function toggleParams(){
  $('.params, .hide-params, .show-params').toggle();
}

function getSquareSize(x, y){
  var bigger = x > y ? x : y;
  return Math.ceil(600/bigger);
}

function solve(){

  var x = parseInt(ractive.get('x'), 10);
  var y = parseInt(ractive.get('y'), 10);
  var iterations = parseInt(ractive.get('num_iterations'), 10);

  // Solved region validation
  if(isNaN(x) || isNaN(y)){
    showModal('You need to define the solved region size. Recommended values are 30 x 30.', 'Uh oh...');
    return;
  } else if(x > 100 || y > 100){
    showModal('For the solved region, each side must not exceed 100 units. This is for your own sake. I don\'t want to crash your computer. Recommended values are 30 x 30.', 'Uh oh...');
    return;
  } else if(x < 1 || y < 1){
    showModal('For the solved region, please provide how many units there should be each side. This has to be thus greater than 0. Recommended values are 30 x 30.', 'Uh oh...');
    return;
  } else if(isNaN(iterations) || iterations > 200 || iterations < 1){
    showModal('For the number of iterations, enter an integer between 1 and 200.', 'Oops');
    return;
  }

  // Hide the 3d canvas as it might be from the previous solution.
  // It will be re-drawn when the button is clicked
  $('#3d-canvas').hide();
  $('.nav-tabs').show();
  $('.nav-tabs .2d-tab a').tab('show');
  $('.nav-tabs .3d-tab').addClass('disabled').find('a').removeAttr('data-toggle');

   // Initialize solver and ouput helper 
  Laplace.init(x, y);
  OutputHelper.initCanvas(x, y, getSquareSize(x,y), $('#color-coded-canvas'));

  try{
    Laplace.setBoundaries(
      extractBoundaryParams('left'),
      extractBoundaryParams('top'),
      extractBoundaryParams('right'),
      extractBoundaryParams('bottom')
    );
  } catch(e){
    showModal('Please input all boundary parameters in number. Nothing can be blank. (Error Detail: ' + e + ')', 'Oops');
    return;
  }

  // Show output interface and hide input interface
  $('#color-coded-canvas').show();
  if($('.params').is(':visible')){
    toggleParams();
  }
  disableUI();
  $('.post-solve-options').hide();
  $('.info .coordinate').text('');

  // Solve and render
  if(ractive.get('no_anim')){
    Laplace.calculate(iterations);
    //OutputHelper.outputResultToText(Laplace.getResult(), $('.number-output-container'));
    OutputHelper.outputResultToCanvas(Laplace.getResult());
    done();
  } else{
    tick(0);
  }

  $('.place-holder').remove();
  
  function tick(total){
    total++;
    if (total > iterations) {
      done();
      return;
    }
    Laplace.calculate(1);
    //OutputHelper.outputResultToText(Laplace.getResult(), $('.number-output-container'));
    OutputHelper.outputResultToCanvas(Laplace.getResult());
    $('.info .num-interation').text('Iterations: ' + total);
    setTimeout(function(){tick(total);}, ractive.get('anim_interval'));
  }

  function done(){
    enableUI(); 
    $('.info .num-interation').text('Iterations: ' + iterations + ' (done)');
    $('.post-solve-options').show(); 
    OutputHelper.boundInfoEventForCanvas($('.info .coordinate'));
    show3D();
    $('.nav-tabs .3d-tab').removeClass('disabled').find('a').attr('data-toggle', 'tab');
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
          param2 = parseFloat(form_group.find('.sinusoid_param2').val()),
          param3 = parseFloat(form_group.find('.sinusoid_param3').val())
      if(isNaN(param1)) throw 'Amplitude Param is NaN';
      if(isNaN(param2)) throw 'Frequecy Param is NaN';
      if(isNaN(param3)) param3 = 0;

      return function(x, total){
        return param1 * Math.sin(param2 * (Math.PI/8) * x) + param3;
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
    case 'array':
      var param1 = form_group.find('.array_param1').val(),
        arr = _.map(param1.split(','), function(n){
          var num = parseFloat(n);
          if(isNaN(num)) throw 'A number in Array Param is NaN';
          else return num;
        });
        return function(x, total){
          return x <= arr.length ? arr[x-1] : 0;
        };
    default:
      return 0;
  }
}

function disableUI() {
  $('.params input, #solve-button').prop('disabled', true);
}

function enableUI(){
  $('.params input, #solve-button').prop('disabled', false);
}

function showModal(msg, title){
  $('#modal .modal-body').empty().append(
    $('<p/>').html(msg)
  );

  $('#modal .modal-title').text(title ? title: '');
  $('#modal').modal('show');
}

function showRawResult(){
  var data = OutputHelper.getRawTextOutput(Laplace.getResult());

  $('#modal .modal-body')
    .empty()
    .append('The solved data in comma seperated values are output below. Use ctrl+c or cmd+c to copy.')
    .append(
      $('<textarea/>').addClass('raw-output').html(data).focus(function(e){
        e.target.select();
        $(e.target).on('mouseup', function(e) {
          e.preventDefault();
        });
      })
    );

  $('#modal .modal-title').text('Result Data Export');
  $('#modal').modal('show');
  
  setTimeout(function(){$('#modal .raw-output').focus();}, 400);
}

function show3D(){
  OutputHelper3D.output3D($('#3d-canvas'), Laplace.getResult(),
    Laplace.getMax(), Laplace.getMin());
}