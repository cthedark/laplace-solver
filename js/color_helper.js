var ColorHelper = {
    getColorHexForValue: function(v, min, max){
        // Hot value
        var color_float = (v - min) / (max - min) * 255;
        color_float = Math.round(color_float);
        r_color_hex = this._makeSureTwoDigits(color_float.toString(16));

        // Cold value (reverse of hot)
        b_color_hex = this._makeSureTwoDigits( (255 - color_float).toString(16) );

        return "#" + r_color_hex + "00" + b_color_hex;
    },

    _makeSureTwoDigits: function(hex){
        return (hex.length == 1) ? ('0' + hex) : hex;
    }
};