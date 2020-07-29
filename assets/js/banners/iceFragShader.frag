
precision mediump float;

uniform vec2 iResolution;
uniform int iFrame;
uniform vec2 iMouse;

uniform sampler2D tex0;
uniform sampler2D tex1;
uniform float tex1Ratio;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.y = 1.0-uv.y;
  // uv.y += 0.01*sin(uv.x * 100.0);
  // uv.x += 0.001*cos(uv.y * 200.0);

  //vec2 uv1 = iResolution.x / iResolution.y > tex1Ratio ?
  vec2 uv1 = vec2(gl_FragCoord.x / iResolution.x, 0.5*(1.0 - iResolution.y / iResolution.x / tex1Ratio) + gl_FragCoord.y / iResolution.x / tex1Ratio);
  uv1.y = 1.0-uv1.y;

  vec4 color = texture2D(tex0, uv);
  vec4 color1 = texture2D(tex1, uv1);

  gl_FragColor = color1/2. + color;
}













// void main() {
//
//   vec2 uv = gl_FragCoord.xy / iResolution.xy;
//   uv.y = 1.0-uv.y;
//
//   vec4 color = texture2D(tex0, uv);
//   color.rgb = 1.0-color.rgb;
//
//   gl_FragColor = color;
//
// }
//
// #define PI2 6.2831853072 // PI * 2
// #define PI_O_2 1.5707963268 // PI / 2
//
// const float passes = 32.0;
// const float radius = 128.0;
// const float lossiness = 2.0;
// const float preserveOriginal = 3.0;
//
// const float directionStep = PI2 / passes;
// const float MAX_ITERATIONS = 100.0;
//
// void main() {
//     vec2 pixel = 1.0 / iResolution.xy;
//     vec2 uv = gl_FragCoord.xy / iResolution.xy;
//     uv.y = 1.0-uv.y;
//
//     float count = 1.0 + preserveOriginal;
//     vec4 color = texture2D(tex0, uv) * count;
//     //float directionStep = PI2 / passes;
//
//     vec2 off;
//     float c, s, dist, dist2, weight;
//     for(float d = 0.0; d < PI2; d += directionStep) {
//         c = cos(d);
//         s = sin(d);
//         dist = 1.0 / max(abs(c), abs(s));
//         dist2 = dist * (2.0 + lossiness);
//         off = vec2(c, s);
//         //for(float i= dist * 1.5; i <= radius; i += dist2) {
//         float iterDist = dist * 1.5;
//         for (float i = 0.0; i < MAX_ITERATIONS; i += 1.0) {
//             if (iterDist > radius){break;}
//             weight = i / radius; // 1.0 - cos(i / radius * PI_O_2);
//             count += weight;
//             color += texture2D( tex0, uv + off * pixel * i) * weight;
//             iterDist += dist2;
//         }
//     }
//
//     gl_FragColor = color / count;
// }
