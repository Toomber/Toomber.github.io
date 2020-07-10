
var banner;
var boids = [];
var urges = [];
var mousePos;
var boidNumber = 100;

var diameter = 15;
var maxSpeed = 4;
var maxAcc = 10;

function setup() {
  banner = selectAll('.banner')[0];
  var canvas = createCanvas(windowWidth,banner.height);
  canvas.parent(banner);
  background('#8d2537');

  generateBoids();
  displayBoids();
}

function draw() {
  fill(255);
  //background(100);
  //background('#c0334a');
  background('#8d2537');
  noStroke();
  mousePos = createVector(mouseX,mouseY);
  moveBoids();
  wrapBoids();
  displayBoids();
}

function generateBoids() {
  for (let i = 0; i < boidNumber; i++) {
    boids.push(new Boid());
  }
}

function displayBoids() {
  boids.forEach(boid => boid.display());
}

function moveBoids() {
  boids.forEach(boid => boid.move());
}

function wrapBoids(){
  boids.forEach(boid => boid.wrap());
}

function findBoidsInRange(centre, radius){
  let nearBoids = [];
  for (var b of boids){
    let v = b.pos.copy().sub(centre);
    let d = v.mag();
    if (d < radius){
      let found = {boid: b, displacement: v, distance: d};
      nearBoids.push(found);
    }
  }
  return nearBoids;
}

class Boid {

  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().setMag(maxSpeed / 2);
    this.color = color('#262626');
  }

  move() {
    let acc = createVector(0, 0);
    let accumulatedAcc = 0;
    let urgeAccels = [this.collisionAcc(),this.velMatchAcc(),this.flockCenteringAcc()];

    for (let i = 0; i < urgeAccels.length; i++) {
      let urgeAcc = urgeAccels[i];
      let urgeMag = urgeAcc.mag();
      let addedMag = min(urgeMag, maxAcc - accumulatedAcc);
      acc.add(urgeAcc.setMag(addedMag));
      accumulatedAcc += addedMag;
    }

    this.vel.add(acc);
    this.vel.limit(maxSpeed);
    this.pos.add(this.vel);
  }

  //accelerate to avoid colliding with things (boids, walls?);
  collisionAcc() {
    let acc = createVector(0, 0);
    let influenceRadius = 40;
    let mouseInfluenceRadius = 100;
    let influenceFactor = 8;
    let mouseInfluenceFactor = 100;
    let found = findBoidsInRange(this.pos, influenceRadius);

    for (var f of found){
      if (f.distance != 0){
        acc.sub(f.displacement.setMag(influenceFactor / f.distance / f.distance));
      }
    }

    let toMouse = mousePos.copy().sub(this.pos);
    let toMouseDist = toMouse.mag();
    if (toMouseDist < mouseInfluenceRadius){
      acc.sub(toMouse.setMag(mouseInfluenceFactor / toMouseDist / toMouseDist))
    }

    return acc;
  }

  //find centroid of nearby boids and accelerate as to be closer to it
  velMatchAcc() {
    let acc = createVector(0, 0);
    let influenceRadius = 50;
    let influenceFactor = 3;
    let found = findBoidsInRange(this.pos, influenceRadius);

    for (var f of found){
      if (f.distance != 0){
        acc.add((f.boid.vel.copy().sub(this.vel)).setMag(influenceFactor / found.length / f.distance / f.distance));
      }
    }

    return acc;
  }

  //Accelertate to be closer to the centroid of nearby boids
flockCenteringAcc() {
    let acc = createVector(0, 0);
    let aggregate = createVector(0, 0);
    let influenceRadius = 100;
    let influenceFactor = 0.001;
    let found = findBoidsInRange(this.pos, influenceRadius);

    for (var f of found){
      if (f.distance != 0){
        aggregate.add(f.displacement);
      }
    }
    aggregate.mult(influenceFactor/found.length);
    acc.add(aggregate);

    return acc;
  }

  wrap(){
    if (this.pos.x < -30){ this.pos.x += width+60; }
    if (this.pos.x > width+30){ this.pos.x -= (width+60); }
    if (this.pos.y < -30){ this.pos.y += height+60; }
    if (this.pos.y > height+30){ this.pos.y -= (height+60); }
  }

  display() {
     push();
     fill(this.color);
     translate(this.pos.x, this.pos.y);
     rotate(this.vel.heading());
     ellipse(0,0, diameter, diameter/2.0);
     pop();
   }

}



function windowResized() {
  resizeCanvas(windowWidth,banner.height);
}
