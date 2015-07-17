var ColorHelper = {
  getColorHexForValue: function(v, min, max, mid_color){
    // Return white if v is NaN
    if(isNaN(v) || v === undefined) return '#FFFFFF';
     
    var color_float = (v - min) / (max - min) * 511; // There can be 512 colors total
    var color_index = Math.round(color_float);
    var r_color_index=0, g_color_index=0, b_color_index=0;

    if(mid_color == 'white'){
      if (color_index > 255) {
        r_color_index = 255;
        b_color_index = 511 - color_index;
        g_color_index = b_color_index;
      } else if (color_index < 256){
        b_color_index = 255;
        r_color_index = color_index;
        g_color_index = r_color_index;
      }
    } else {
      // Purple (just blend red and blue)
      r_color_index = Math.floor(color_index / 2);
      b_color_index = 255 - r_color_index;
      g_color_index = 0;
    }
    
    return "#" + this._makeSureTwoDigits(r_color_index.toString(16)) + 
      this._makeSureTwoDigits(g_color_index.toString(16)) + 
      this._makeSureTwoDigits(b_color_index.toString(16));
  },

  _makeSureTwoDigits: function(hex){
    return (hex.length == 1) ? ('0' + hex) : hex;
  }
};