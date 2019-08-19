
function myFunction() {
    const x = document.getElementById("myAudio").autoplay;
  }
  myFunction();
//==================================================================================================
//	Settings
//==================================================================================================
const canvasColour = "rgba(58,51,53, 1)"; //#3a3335
const ballColours = ["#00b2d6", "#D5035E", "#F9E814"];
const rectColours = ["#00b2d6", "#FFFFFF"];

//==================================================================================================
//	Shapes
//==================================================================================================
class Shape {
  constructor() {
    this.x = Math.floor(Math.random() * canvas.width); //random
    this.y = Math.floor(Math.random() * canvas.height); //random
    this.r = Math.floor(10 + 5 * Math.random());
    this._step = this.step = 0.2 + Math.random();
    this.direction = 360 * Math.random(); // Move to a random direction
  }

  update() {
    
    // Move (x,y) based on the direction
    let angleRad = this.direction * (Math.PI / 180); //angle in radians
    this.x = this.x + this.step * Math.cos(angleRad);
    this.y = this.y + this.step * Math.sin(angleRad);

    // Slow down step (if accelerated) to match original _step
    if (this._step < this.step) {
      this.step -= this._step / this.step * 0.1;
    }
    
    // If a shape reaches the end of the canvas move it to the other side
    if (this.y + this.r <= 0) {
      // Top -> Bottom
      this.y = Math.ceil(canvas.height) + this.r;
      this.x = this.x - this.r;
    } else if (this.x - this.r >= canvas.width) {
      // Right -> Left
      this.x = 0 - this.r;
      this.y = this.y - this.r;
    } else if (this.y - this.r >= canvas.height) {
      // Bottom -> Top
      this.y = 0 - this.r;
      this.x = this.x - this.r;
    } else if (this.x + this.r <= 0) {
      // Left -> Right
      this.x = Math.ceil(canvas.width) + this.r;
      this.y = this.y - this.r;
    }
  }
}

class Ball extends Shape {
  constructor() {
    super();
    this.color = ballColours[Math.floor(Math.random() * ballColours.length)];
    this.lineWidth = 6;

    this.draw = function() {
      canvas.ctx.beginPath();
      canvas.ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, true);
      canvas.ctx.lineWidth = this.lineWidth;
      canvas.ctx.fillStyle = this.color;
      canvas.ctx.fill();
    };
    return this;
  }
}

class Rectangle extends Shape {
  constructor() {
    super();
    this.color = rectColours[Math.floor(Math.random() * rectColours.length)];
    this.lineWidth = 6;
    this.deg = Math.random() * 180; // Rotation

    this.draw = function() {
      canvas.ctx.save(); // Saves the coordinate system

      canvas.ctx.translate(this.x, this.y); // Move canvas to where we want our shape to be drawn
      canvas.ctx.rotate(this.deg); // Rotate around the start point of the line

      canvas.ctx.beginPath();
      canvas.ctx.rect(0, 0, this.r / 3, this.r);
      canvas.ctx.lineWidth = this.lineWidth;
      canvas.ctx.fillStyle = this.color;
      canvas.ctx.fill();

      canvas.ctx.restore(); // Restores the coordinate system back to (0,0)
    };
    return this;
  }

  update() {
    super.update();
    if (pointer.x < this.x) {
      this.deg += this.step/this._step * 0.005;
    } else if (pointer.x >= this.x) {
      this.deg -= this.step/this._step * 0.005;
    }
  }
}

function initShapes() {
  canvas.shapes = [];
  
  //Balls
  for (i = 0; i < 70; i++) {
    const ball = new Ball();
    ball.draw();
    canvas.shapes.push(ball);
  }

  //Rectangles
  for (i = 0; i < 50; i++) {
    const rect = new Rectangle();
    rect.draw();
    canvas.shapes.push(rect);
  }
}

//==================================================================================================
//	Canvas
//==================================================================================================
const canvas = document.querySelector(".particles");
canvas.size = function() {
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.style.width = window.innerWidth + "px";
  this.style.height = window.innerHeight + "px";
};

canvas.resize = function() {
  // Do I want any breakpoints here?
  // Only trigger events if canvas size is now bigger than it were
  if (this.width >= window.innerWidth && this.height >= window.innerHeight) {
    return;
  }
  canvas.init();
};

canvas.init = function() {
  canvas.ctx = this.getContext("2d");
  canvas.ctx.imageSmoothingEnabled = true;
  canvas.isTapped = false;
  canvas.size();
  canvas.fill(canvasColour);
  initShapes();
};

canvas.fill = function(colour) {
  canvas.ctx.fillStyle = colour;
  canvas.ctx.fillRect(0, 0, this.width, this.height);
};

canvas.redraw = function() {
  canvas.fill(canvasColour);
  canvas.shapes.forEach(function(shape) {
    shape.update();
    shape.draw();
  });
  requestAnimationFrame(canvas.redraw);
};

//==================================================================================================
//	Pointer
//==================================================================================================
let pointer = {
  x: 0,
  y: 0,
  r: 100 // Diameter of the tap
};

pointer.nearbyShapes = function() {
  return canvas.shapes.filter(function(shape) {
    let xLowerRange = pointer.x - pointer.r;
    let xHigherRange = pointer.x + pointer.r;
    let yLowerRange = pointer.y - pointer.r;
    let yHigherRange = pointer.y + pointer.r;
    if (
      shape.x > xLowerRange &&
      shape.x < xHigherRange &&
      shape.y > yLowerRange &&
      shape.y < yHigherRange
    ) {
      return true;
    }
  });
};

pointer.updateCoords = function(e) {
  pointer.x = (e.clientX || e.clientX === 0) ? e.clientX : e.touches[0].clientX;
  pointer.y = (e.clientY || e.clientY === 0) ? e.clientY : e.touches[0].clientY;
};

//==================================================================================================
//	Events
//==================================================================================================
let pushShapes = function(e) {
  pointer.updateCoords(e);
  let nearbyShapes = pointer.nearbyShapes();
  nearbyShapes.forEach(function(shape) {
    // Set new shape direction to opposite of pointer
    shape.direction = Math.atan2(shape.y - pointer.y, shape.x - pointer.x) * 180 / Math.PI;
    shape.step = 6;
    shape.draw();
  });
};

const tapStart =
  "ontouchstart" in window || navigator.msMaxTouchPoints
    ? "touchstart"
    : "mousedown";
const tapMove =
  "ontouchstart" in window || navigator.msMaxTouchPoints
    ? "touchmove"
    : "mousemove";
const tapEnd =
  "ontouchstart" in window || navigator.msMaxTouchPoints
    ? "touchend"
    : "mouseup";

document.addEventListener(
  tapStart,
  function(e) {
    canvas.isTapped = true;
    pushShapes(e);
  },
  false
);

document.addEventListener(
  tapMove,
  function(e) {
    if (!canvas.isTapped) return;
    pushShapes(e);
  },
  false
);

document.addEventListener(
  tapEnd,
  function(e) {
    canvas.isTapped = false;
  },
  false
);

//==================================================================================================
//	Init
//==================================================================================================
document.addEventListener("DOMContentLoaded", function(event) {
  canvas.init();
  requestAnimationFrame(canvas.redraw);
  window.addEventListener(
    "resize",
    function() {
      canvas.resize();
    },
    false
  );
});
