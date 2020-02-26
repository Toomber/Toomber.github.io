export default `
precision mediump float;

uniform vec3 iResolution;
uniform vec2 iViewport;
uniform float iTime;

uniform mat4 iViewTransform;
uniform mat4 iInvProjMatrix;
uniform mat4 iLeftControllerTransform;
uniform bool iLeftExists;
uniform mat4 iRightControllerTransform;
uniform bool iRightExists;

vec3 getHandPos(mat4 transform){
  return vec3(transform[3][0], transform[3][1], transform[3][2]);
}

float castRay( in vec3 ro, in vec3 rd )
{
  float d = 0.;
  float t = 0.;
  float l = 10000.;
  vec3 p = ro;
  vec3 left;
  vec3 right;
  //rd = vec3(abs(rd.x), rd.y, abs(rd.z));

  if (iLeftExists) left = getHandPos(iLeftControllerTransform);
  if (iRightExists) right = getHandPos(iRightControllerTransform);

  for(int i=0;i<200;i++)
  {

    if (iLeftExists){
      l = length(left - p) - .1;
    }
    if (iRightExists){
      l = min(l, length(right - p) - .1);
    }


    //if (abs(pos.x) > .5 && abs(pos.y) > .5 || abs(pos.z) > .5) break;
    vec3 q = vec3(abs(p.x), p.y, abs(p.z));
    d = length(mod(q, 5.) -2.) -1.;
    d = min(min(d, p.y + 1.), l);
    if (d < .001) break;
    //if (d > 5.) break;

    t += d;
    p = ro + t*rd;
    //t = length(p - ro);
  }
  //float k = step(.5, fract(pos.y)) * step(.5, fract(pos.z)) / 4.;
  return t / 8.;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - iViewport.xy) / iResolution.xy;
  vec4 p = iInvProjMatrix * vec4(uv * 2. - 1., 1., 1.);
  vec4 ro = vec4(0., 0., 0., 1.);
  vec4 rd = normalize(p - ro);
  rd.w = 0.;
  ro = iViewTransform * ro;
  rd = normalize(iViewTransform * rd);

  float res = castRay(ro.xyz, rd.xyz);
  gl_FragColor = vec4(0., res/5., res/5., 1.);
}
`;
