/*
Laplace's equation solver of a rectangular region using relaxation method.
By Charles Ko
University of Washington - Physics
6/23/2015

This module supports any arbitrary boundary conditions. 
User must initialize by defining the rectangle size (resolution)
User must define boudary conditions for all four sides of the rectangle.
Use calculate method to advance iterative process towards the solution.
Use getResult method to see what the current solution looks like.

Note - It would be very simple to convert this into a Poisson's equation solver.
One can just input values into the array (this.field) then use the calculate method.
*/

var Laplace = {

  x: 100, // Number of points in x direction (set to default)
  y: 100, // Number of points in y direction (set to default)
  field: null,
  min: null, // Cached minimum
  max: null, // Cached maximum

  init: function(x, y){
    if(x) this.x = x;
    if(y) this.y = y;

    // Construct an array of arrays to represent the two dimensional field
    // with discrete points
    var field_array = [];
    for(var i = 0; i <= this.y + 1; i++){
      var row_array = [];
      for(var j = 0; j <= this.x + 1; j++){
        row_array.push(0); // Set the initial value to 0
      }
      field_array.push(row_array);
    }
    this.field = field_array;
  },

  setBoundaries: function(left, top, right, bottom){
    // Each of the four arguments represent a single side boundary
    // For example, left is the left side boundary of the rectangular region
    // Each argument can be of three types = number, function, and array
    if (this.field == null) throw 'Not initialized. Please run Laplace.init first.';

    left = this._generateBoundaryArray(left, this.y);
    top = this._generateBoundaryArray(top, this.x);
    right = this._generateBoundaryArray(right, this.y, true);
    bottom = this._generateBoundaryArray(bottom, this.x, true);

    // Apply the boundary arrays to the field boundaries
    this.field[0] = top;
    this.field[this.field.length-1] = bottom;

    for(var i = 0; i <= this.y + 1; i++){
      this.field[i][0] = left[i];
      this.field[i][this.field[i].length-1] = right[i];
    }
  },

  calculate: function(iterations){
    // Advance the interative process a number of times specified by the argument
    if (this.field == null) throw 'Not initialized. Please run Laplace.init first.';

    // Reset cached extrema
    this.min = null; this.max = null;

    iterations = iterations || 1;
    for (var i = 0; i < iterations; i++){
      for (var j = 0; j < this.field.length; j++){
        for (var k = 0; k < this.field[j].length ; k++){
          // j and k are the coordinate for the current point
          // Calculate the average value of the surrounding points

          // Do not update the boundaries
          if(j != 0 && k != 0 && j != this.field.length-1 && k != this.field[j].length-1)
            this.field[j][k] = (this.field[j-1][k] + this.field[j+1][k] + this.field[j][k-1] + this.field[j][k+1]) / 4;

          // Update Extrema
          if(isNaN(this.field[j][k])) continue;
          if(this.min == null || this.min > this.field[j][k]) {
            this.min = this.field[j][k];
          } 
          if(this.max == null || this.max < this.field[j][k]) {
            this.max = this.field[j][k];
          }
        }
      }
    }
  },

  getResult: function() {return this.field;},
  getMin: function() {return (this.min == null) ? this._getExtreme(false) : this.min;},
  getMax: function() {return (this.max == null) ? this._getExtreme(true) : this.max;},

  //
  // PRIVATE METHODS
  //

  _generateBoundaryArray: function(b, array_num, reverse){
    // Returns an array of numbers representing a single side boundary
    if (b instanceof Array) return b;

    var boundary_array = [];
    for(var i = 0; i <= array_num + 1; i++){
      // We don't need to care about vetices, insert NaN
      boundary_array.push(typeof b == 'function' ? b(i, array_num) : b);
    }
    return reverse ? boundary_array.reverse() : boundary_array;
  },

  _getExtreme: function(max) {
    // Look at all values and determine what the min and max values are
    var extreme = null;
    for(var i = 0; i <= this.y+1; i++){
      for(var j = 0; j <= this.x+1; j++){
        var curr = this.field[i][j];
        if(isNaN(curr)) continue;
        if (extreme == null) {
          extreme = curr;
          continue;
        }
        extreme = max ? (curr > extreme ? curr : extreme) : (curr < extreme ? curr : extreme);
      }
    }

    if(max) this.max = extreme;
    else this.min = extreme;

    return extreme;
  }
};
