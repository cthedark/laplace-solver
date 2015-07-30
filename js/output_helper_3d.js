/*
 Disclaimer: Most of the code below is a result of some reverse engineering of Dean's GraphyCalc
 http://www.graphycalc.com
 Credits go to the author of this tool - Dean McNamee
*/

function _bigger(a, b){
  if (a > b) return a;
  return b;
}

function _makePath (points){
  var curves = [], path = new Pre3d.Path;

  for (var i = 1; i < points.length; i++) {
    curves.push(new Pre3d.Curve(i, i, null));
  }

  path.points = points;
  path.curves = curves;
  path.starting_point = 0;
  return path;
}

function _makeSmoothPath (points){
  var curves = [], path = new Pre3d.Path;
  for (var i = 3; i < points.length; i++) {
    points.push({
      x: points[i - 1].x / 6 + points[i - 2].x - points[i - 3].x / 6,
      y: points[i - 1].y / 6 + points[i - 2].y - points[i - 3].y / 6,
      z: points[i - 1].z / 6 + points[i - 2].z - points[i - 3].z / 6
    });
    points.push({
      x: points[i].x/-6 + points[i - 1].x + points[i - 2].x / 6,
      y: points[i].y/-6 + points[i - 1].y + points[i - 2].y / 6,
      z: points[i].z/-6 + points[i - 1].z + points[i - 2].z / 6
    });
    curves.push(new Pre3d.Curve(i - 1, points.length, points.length + 1));
  }
  path.points = points;
  path.curves = curves;
  path.starting_point = 1;
  return path;
}

var OutputHelper3D = {
  renderer: null,
  COLOR: new Pre3d.RGBA(0 / 255, 100 / 255, 20 / 255, 1),
  AXIS_COLOR: new Pre3d.RGBA(140 / 255, 140 / 255, 140 / 255, 1),
  solution_array: null,
  solution_max: null,
  solution_min: null,

  AXES: [
    _makePath([
      { x: - 1, y: 0, z: 0 }, 
      { x: 0, y: 0, z: 0 }, 
      { x: 1, y: 0, z: 0 }
    ]), 
    _makePath([
      { x: 0, y: -1, z: 0 }, 
      { x: 0, y: 0, z: 0 }, 
      { x: 0, y: 1, z: 0 }
    ]), 
    _makePath([
      { x: 0, y: 0, z: -1 }, 
      { x: 0, y: 0, z: 0 }, 
      { x: 0, y: 0, z: 1 }
    ])
  ],

  cached_graph_max: null,

  _getScaledV: function(v){
    if(this.cached_graph_max === null){
      this.cached_graph_max = _bigger(Math.abs(this.solution_min), Math.abs(this.solution_max));
    }
    return v/this.cached_graph_max;
  },

  _getSolutionPaths: function() {
    var paths = [], smooth = false, // make this false for faster performance
      // We are only going to render the region inside the boundaries, hence length - 2
      x_total = this.solution_array[0].length - 2,
      y_total = this.solution_array.length - 2,
      steps = 20, // total number of points we want to reference
      x_step = makeStep(x_total), y_step = makeStep(y_total);
    var self = this;

    function makeStep(total){
      if (total < steps) return total;
      return Math.ceil(total/steps);
    }

    function shiftAndScaleCoordX(coord){
      return (coord - x_total / 2) / (_bigger(x_total, y_total) / 2);
    }

    function shiftAndScaleCoordY(coord){
      return (coord - y_total / 2) / (_bigger(x_total, y_total) / 2);
    }

    // x lines
    for (var curr_x = 1; curr_x <= x_total;){
      var points = [];
      for (var curr_y = 1; curr_y <= y_total;){
        var v = self.solution_array[curr_y][curr_x];
        points.push({
          x: shiftAndScaleCoordX(curr_x),
          y: self._getScaledV(v),
          z: shiftAndScaleCoordY(curr_y)
        }); 

        // We shall increment by the specified step - but if it exceeds the boundary, set to the boundary
        if(curr_y != y_total && curr_y + y_step > y_total) curr_y = y_total;
        else curr_y += y_step;
      }
      paths.push(smooth ? _makeSmoothPath(points) : _makePath(points));

      if(curr_x != x_total && curr_x + x_step > x_total) curr_x = x_total;
      else curr_x += x_step;
    }
    // y lines
    for (var curr_y = 1; curr_y <= y_total;){
      var points = [];
      for (var curr_x = 1; curr_x <= x_total;){
        var v = self.solution_array[curr_y][curr_x];
        points.push({
          x: shiftAndScaleCoordX(curr_x),
          y: self._getScaledV(v),
          z: shiftAndScaleCoordY(curr_y)
        });

        if(curr_x != x_total && curr_x + x_step > x_total) curr_x = x_total;
        else curr_x += x_step;
      }
      paths.push(smooth ? _makeSmoothPath(points) : _makePath(points));

      if(curr_y != y_total && curr_y + y_step > y_total) curr_y = y_total;
      else curr_y += y_step;
    }

    return paths;
  },

  drawAxes: function(){
    // Draw x and y axis
    var self = this;
    self.renderer.clearBackground();
    self.renderer.ctx.setStrokeColor(
      self.AXIS_COLOR.r, self.AXIS_COLOR.g, self.AXIS_COLOR.b, self.AXIS_COLOR.a
    );
    for (var i = 0; i < self.AXES.length; i++) {
      self.renderer.drawPath(self.AXES[i]);
    }
  },

  drawGraph: function(){
    // It's safer to reference the singleton class itself instead of 'this' 
    // because this func is used as a callback in a different contenxt
    var self = OutputHelper3D;
    self.drawAxes();

    // Draw the actual stuff
    self.renderer.ctx.setStrokeColor(
      self.COLOR.r, self.COLOR.g, self.COLOR.b, self.COLOR.a
    );

    var solutionPaths = self._getSolutionPaths();
    for (var i = 0; i < solutionPaths.length; i++){
      self.renderer.drawPath(solutionPaths[i])
    }
  },

  output3D: function(canvas_elem, result, max, min){

    // Show if it's hidden
    canvas_elem.show();

    this.solution_array = result;
    this.solution_max = max;
    this.solution_min = min;
    this.cached_graph_max = null;
    this.renderer = new Pre3d.Renderer(canvas_elem[0]);
    this.renderer.ctx.lineWidth = 1;
    this.renderer.camera.focal_length = 2.5;

    canvas_elem.unbind();
    this._autoCamera(this.renderer, 0, 0, - 3, 0.5, 0.5, 0, this.drawGraph, {
        panZOnMouseWheel: false,
        panZOnMouseWheelScale: 5,
        zAxisLimit: - 1
    });
    
    this.drawGraph();
  },

  // The below is taken entirely from Dean's DemoUtils without much modification.
  // Register mouse handlers to automatically handle camera:
  //   Mouse -> rotate around origin x and y axis.
  //   Mouse + ctrl -> pan x / y.
  //   Mouse + shift -> pan z.
  //   Mouse + ctrl + shift -> adjust focal length.
  _autoCamera: function(renderer, ix, iy, iz, tx, ty, tz, draw_callback, opts) {
    var camera_state = {
      rotate_x: tx,
      rotate_y: ty,
      rotate_z: tz,
      x: ix,
      y: iy,
      z: iz
    };

    opts = opts !== undefined ? opts : { };

    function set_camera() {
      var ct = renderer.camera.transform;
      ct.reset();
      ct.rotateZ(camera_state.rotate_z);
      ct.rotateY(camera_state.rotate_y);
      ct.rotateX(camera_state.rotate_x);
      ct.translate(camera_state.x, camera_state.y, camera_state.z);
    }

    function registerTouchListener(canvas, listener) {
      var state = {
        first_event: true,
        is_clicking: false,
        last_x: 0,
        last_y: 0
      };

      canvas.addEventListener('touchstart', function(e) {
        state.is_clicking = true;
        state.last_x = e.touches[0].clientX;
        state.last_y = e.touches[0].clientY;
        // Event was handled, don't take default action.
        e.preventDefault();
        return false;
      }, false);

      canvas.addEventListener('touchend', function(e) {
        state.is_clicking = false;
        // Event was handled, don't take default action.
        e.preventDefault();
        return false;
      }, false);

      canvas.addEventListener('touchmove', function(e) {
        var delta_x = state.last_x - e.touches[0].clientX;
        var delta_y = state.last_y - e.touches[0].clientY;

        state.last_x = e.touches[0].clientX;
        state.last_y = e.touches[0].clientY;

        // We need one event to get calibrated.
        if (state.first_event) {
          state.first_event = false;
        } else {
          var info = {
            is_clicking: state.is_clicking,
            canvas_x: state.last_x,
            canvas_y: state.last_y,
            delta_x: delta_x,
            delta_y: delta_y,
            touch: true,
            shift: false,
            ctrl: false
          };

          listener(info);
        }

        // Event was handled, don't take default action.
        e.preventDefault();
        return false;
      }, false);
    }

    function registerMouseListener(canvas, listener) {
      var state = {
        first_event: true,
        is_clicking: false,
        last_x: 0,
        last_y: 0
      };

      function relXY(e) {
        if (typeof e.offsetX == 'number')
          return {x: e.offsetX, y: e.offsetY};

        var off = {x: 0, y: 0};
        var node = e.target;
        var pops = node.offsetParent;
        if (pops) {
          off.x += node.offsetLeft - pops.offsetLeft;
          off.y += node.offsetTop - pops.offsetTop;
        }

        return {x: e.layerX - off.x, y: e.layerY - off.y};
      }

      canvas.addEventListener('mousedown', function(e) {
        var rel = relXY(e);
        state.is_clicking = true;
        state.last_x = rel.x;
        state.last_y = rel.y
        // Event was handled, don't take default action.
        e.preventDefault();
        return false;
      }, false);

      canvas.addEventListener('mouseup', function(e) {
        state.is_clicking = false;
        // Event was handled, don't take default action.
        e.preventDefault();
        return false;
      }, false);

      canvas.addEventListener('mouseout', function(e) {
        state.is_clicking = false;
        // Event was handled, don't take default action.
        e.preventDefault();
        return false;
      }, false);

      canvas.addEventListener('mousemove', function(e) {
        var rel = relXY(e);
        var delta_x = state.last_x - rel.x;
        var delta_y = state.last_y - rel.y;


        state.last_x = rel.x;
        state.last_y = rel.y;

        // We need one event to get calibrated.
        if (state.first_event) {
          state.first_event = false;
        } else {
          var info = {
            is_clicking: state.is_clicking,
            canvas_x: state.last_x,
            canvas_y: state.last_y,
            delta_x: delta_x,
            delta_y: delta_y,
            shift: e.shiftKey,
            ctrl: e.ctrlKey
          };

          listener(info);
        }

        e.preventDefault();
        return false;
      }, false);
    }

    // Register and translate mouse wheel messages across browsers.
    function registerMouseWheelListener(canvas, listener) {
      function handler(e) {
        // http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        listener(e.detail ? -e.detail : e.wheelDelta/40);
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
      // Register on both mousewheel and DOMMouseScroll.  Hopefully a browser
      // only fires on one and not both.
      canvas.addEventListener('DOMMouseScroll', handler, false);
      canvas.addEventListener('mousewheel', handler, false);
    }

    // We debounce fast mouse movements so we don't paint a million times.
    var cur_pending = null;

    function handleCameraMouse(info) {
      if (!info.is_clicking)
        return;

      if (info.shift && info.ctrl) {
        renderer.camera.focal_length = clamp(0.05, 10,
            renderer.camera.focal_length + (info.delta_y * 0.01));
      } else if (info.shift) {
        camera_state.z += info.delta_y * 0.01;
        if (opts.zAxisLimit !== undefined && camera_state.z > opts.zAxisLimit) {
          camera_state.z = opts.zAxisLimit;
        }
      } else if (info.ctrl) {
        camera_state.x -= info.delta_x * 0.01;
        camera_state.y -= info.delta_y * 0.01;
      } else {
        camera_state.rotate_y -= info.delta_x * 0.01;
        camera_state.rotate_x -= info.delta_y * 0.01;
      }

      if (cur_pending != null)
        clearTimeout(cur_pending);

      cur_pending = setTimeout(function() {
        cur_pending = null;
        set_camera();
        if (info.touch === true) {
          opts.touchDrawCallback(false);
        } else {
          draw_callback();
        }
      }, 0);
    }

    registerMouseListener(renderer.canvas, handleCameraMouse);
    if (opts.touchDrawCallback !== undefined)
      registerTouchListener(renderer.canvas, handleCameraMouse);

    if (opts.panZOnMouseWheel === true) {
      var wheel_scale = opts.panZOnMouseWheelScale !== undefined ?
                          opts.panZOnMouseWheelScale : 30;
      registerMouseWheelListener(renderer.canvas, function(delta_y) {
        // Create a fake info to act as if shift + drag happened.
        var fake_info = {
          is_clicking: true,
          canvas_x: null,
          canvas_y: null,
          delta_x: 0,
          delta_y: delta_y * wheel_scale,
          shift: true,
          ctrl: false
        };
        handleCameraMouse(fake_info);
      });
    }

    // Set up the initial camera.
    set_camera();
  }
};