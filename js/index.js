function outputCurrentResultToText(){
    var result = Laplace.getResult();
    var result_box = $('<div/>');
    _(result).forEach(function(row){
        var row_div = $('<div/>');
        _(row).forEach(function(v){
            row_div.append(
                $('<span/>')
                    // Put space in between for people who want to copy/paste data
                    .html( (Math.round(v * 10000)/10000) + "&nbsp;" )
                    .css('color', ColorHelper.getColorHexForValue(v, Laplace.getMin(), Laplace.getMax())) 
            ); 
        }).value();
        result_box.append(row_div);
    }).value();
    $('.number-output-container').empty().append(result_box);
}

function toggleAbout(){
    $('.about, .tool, .go-to-about, .go-to-tool').toggle();
}

function solve(){

    try{
        var left = parseInt($('#param-left').val(), 10),
            top = parseInt($('#param-top').val(), 10),
            right = parseInt($('#param-right').val(), 10),
            bottom = parseInt($('#param-bottom').val(), 10);
    } catch(e){
        return
    }

    disableUI();
    Laplace.init(20, 30);
    Laplace.setBoundaries(left,top,right,bottom);

    if($('#param-solve-immediately').is(':checked') == true){
        Laplace.calculate(100);
        outputCurrentResultToText();
        enableUI();
    } else{
        tick(0);
    }
    
    function tick(total){
        total++;
        if (total > 50) {enableUI(); return;}
        Laplace.calculate(2);
        outputCurrentResultToText();
        setTimeout(function(){tick(total);}, 200);
    }
    
}

function disableUI() {
    $('#solve-button').prop('disabled', true);
}

function enableUI(){
    $('#solve-button').prop('disabled', false);
}