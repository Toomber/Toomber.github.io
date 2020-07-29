
var banner;
var boids = [];
var urges = [];
var mousePos;
var boidNumber = 100;

var diameter = 15;
var maxSpeed = 4;
var maxAcc = 10;

let iceShader;
let pg;
let iceTexture;
let iceTextureAspectRatio;

function preload(){
  // load the shader
  iceShader = loadShader('assets/js/p5js/basic.vert','assets/js/banners/iceFragShader.frag');
  iceTexture = loadImage('assets/img/ice-texture.jpg');
}

function setup() {
  iceTextureAspectRatio = iceTexture.width / iceTexture.height;

  banner = selectAll('.banner')[0];
  var canvas = createCanvas(windowWidth,banner.height, WEBGL);
  canvas.parent(banner);
  //background('#8d2537');

  pg = createGraphics(windowWidth,banner.height, WEBGL);

  generateBoids();
  //updateBoidListsRepeatedly();
  // displayBoids();
}

function draw() {
  print(iceTextureAspectRatio);
  pg.fill(255);
  //background(100);
  //background('#c0334a');
  //pg.background('#8d2537');
  pg.background(0);
  pg.noStroke();
  //pg.circle(0,0,300);
  mousePos = createVector(mouseX-width/2,mouseY-height/2);
  moveBoids();
  wrapBoids();

  // boids.forEach(boid => {
  //     boid.color = color(255);
  // });
  //
  // boids[0].nearbyBoids.forEach(boid => {
  //   boid.color = color(100);
  // });

  displayBoids();


  shader(iceShader);
  iceShader.setUniform('tex0', pg);
  iceShader.setUniform('tex1Ratio', iceTextureAspectRatio);
  iceShader.setUniform('tex1', iceTexture);
  iceShader.setUniform("iResolution", [width, height]);
  iceShader.setUniform("iFrame", frameCount);
  iceShader.setUniform("iMouse", [mouseX, map(mouseY, 0, height, height, 0)]);
  //texture(pg);
  noStroke();
  rectMode(CENTER);
  rect(0,0,width, height);


}

function generateBoids() {
  for (let i = 0; i < boidNumber; i++) {
    boids.push(new Boid(createVector(1,1)));
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
    if (abs(centre.x-b.pos.x) + abs(centre.y - b.pos.y) < 1.5*radius){
      nearBoids.push(b);
    }
  }
  return nearBoids;
}

function findBoidsInRangePlus(boidList, centre, radius){
  let nearBoidsPlus = [];
  for (var b of boids){
    let v = b.pos.copy().sub(centre);
    let d2 = v.magSq();
    if (d2 < radius*radius){
      let found = {boid: b, displacement: v, distance2: d2};
      nearBoidsPlus.push(found);
    }
  }
  return nearBoidsPlus;
}

async function updateBoidListsRepeatedly() {
    while (true) {
        boids.forEach(boid => boid.updateNearby());
        await sleep(1000);
        print("update");
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Boid {

  constructor(pos, vel) {
    if (pos == undefined){
      pos = createVector(random(width)-width/2, random(height)-height/2);
    }
    this.pos = pos;
    if (vel == undefined){
      vel = p5.Vector.random2D().setMag(maxSpeed / 2);
    }
    this.vel = vel;
    this.acc = createVector(0, 0);
    //this.color = color('#262626');
    this.color = color(255);

    this.nearbyBoids = boids;
  }

  updateNearby(){
    this.nearbyBoids = findBoidsInRange(this.pos, 150);
  }

  move() {
    let acc = this.acc;
    acc.set(0,0);
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
    let found = findBoidsInRangePlus(this.nearBoids, this.pos, influenceRadius);

    for (var f of found){
      if (f.distance2 != 0){
        acc.sub(f.displacement.setMag(influenceFactor / f.distance2));
      }
    }

    let toMouse = mousePos.copy().sub(this.pos);
    let toMouseDistSq = toMouse.magSq();
    if (toMouseDistSq < mouseInfluenceRadius*mouseInfluenceRadius){
      acc.sub(toMouse.setMag(mouseInfluenceFactor / toMouseDistSq))
    }

    return acc;
  }

  //find centroid of nearby boids and accelerate as to be closer to it
  velMatchAcc() {
    let acc = createVector(0, 0);
    let influenceRadius = 50;
    let influenceFactor = 3;
    let found = findBoidsInRangePlus(this.nearBoids, this.pos, influenceRadius);

    for (var f of found){
      if (f.distance2 != 0){
        acc.add((f.boid.vel.copy().sub(this.vel)).setMag(influenceFactor / found.length / f.distance2));
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
    let found = findBoidsInRangePlus(this.nearBoids, this.pos, influenceRadius);

    for (var f of found){
      if (f.distance2 != 0){
        aggregate.add(f.displacement);
      }
    }
    aggregate.mult(influenceFactor/found.length);
    acc.add(aggregate);

    return acc;
  }

  wrap(){
    if (this.pos.x < -width/2-30){ this.pos.x += width+60; }
    if (this.pos.x > width/2+30){ this.pos.x -= (width+60); }
    if (this.pos.y < -height/2 - 30){ this.pos.y += height+60; }
    if (this.pos.y > height/2+30){ this.pos.y -= (height+60); }
    // if (this.pos.x < -width/2){ this.pos.x = -width/2; }
    // if (this.pos.x > width/2){ this.pos.x = width/2; }
    // if (this.pos.y < -height/2){ this.pos.y = -height/2; }
    // if (this.pos.y > height/2){ this.pos.y = height/2; }
  }

  display() {
     pg.push();
     pg.fill(this.color);
     pg.translate(this.pos.x, this.pos.y);
     pg.rotate(this.vel.heading());
     pg.ellipse(0,0, diameter, diameter/2.0);
     pg.pop();
   }

}

function createFlock(pos, vel, number){


}


function windowResized() {
  resizeCanvas(windowWidth,banner.height);
  pg.resizeCanvas(windowWidth,banner.height);
}
