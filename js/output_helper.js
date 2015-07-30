var OutputHelper = {

  outputResultToText: function(result, output_div){
    // Deprecated
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
    output_div.empty().append(result_box);
  },

  canvas: null,
  x: null,
  y: null,
  pixels: null,
  ctx: null,
  info_element: null,
  result: null,

  initCanvas: function(x, y, pixels, canvas_elem){
    canvas_elem.attr('width', (x+2)*pixels);
    canvas_elem.attr('height', (y+2)*pixels);
    canvas_elem.unbind('mousemove');
    //this.canvas = oCanvas.create({ canvas: '#'+canvas_elem.attr('id'), background: '#222' });
    this.canvas = canvas_elem[0];
    this.ctx = this.canvas.getContext("2d");
    this.x = x;
    this.y = y;
    this.pixels = pixels;
    this.info_element = null;
  },

  outputResultToCanvas: function(result){
    
    if (!this.canvas){
      throw 'canvas is not initialized';
    }

    var self = this;
    this.result = result;
    this.ctx.beginPath();

    _.forEach(result, function(row, i){
      _.forEach(row, function(v, j){
          var color = ColorHelper.getColorHexForValue(v, Laplace.getMin(), Laplace.getMax());
          var rounded_up_value = Math.round(v * 10000)/10000;
          self.ctx.fillStyle = color;
          self.ctx.fillRect(j*self.pixels, i*self.pixels, self.pixels, self.pixels);
      });
    });

    // Draw the boundary indicator
    self.ctx.strokeStyle="green";
    self.ctx.lineWidth=3;
    self.ctx.rect(self.pixels, self.pixels, self.pixels*self.x, self.pixels*self.y);
    self.ctx.stroke();
    this.ctx.closePath();
  },

  boundInfoEventForCanvas: function(info_output_span){
    if (!this.canvas){
      throw 'canvas is not initialized';
    }
    this.info_element = info_output_span;
    var self = this;

    $(this.canvas).mousemove(function(e){
      var x = Math.floor(e.offsetX / self.pixels);
      var y = Math.floor(e.offsetY / self.pixels);
      var info = 'V(' + x + ', ' + y +') = ' + self.result[y][x];
      info_output_span.text(info);
    });
  },

  resetCanvas: function(){
    this.canvas = null;
  },

  getRawTextOutput: function(arr){
    var data = '';
    _.forEach(arr, function(v, i){
      data += v.toString();
      if(i != arr.length - 1) data += '&#13;&#10;';
    });
    return data;
  }
};