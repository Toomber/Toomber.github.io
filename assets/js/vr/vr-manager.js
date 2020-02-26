
// Copyright 2018 The Immersive Web Community Group
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


  import {WebXRButton} from './util/webxr-button.js';
  import {mat4, vec3, quat} from './third-party/gl-matrix/src/gl-matrix.js';
  import {QueryArgs} from './util/query-args.js';
  import {InlineViewerHelper} from './util/inline-viewer-helper.js';

  import {FragRenderer} from './render/frag-renderer.js';

  // If requested, use the polyfill to provide support for mobile devices
  // and devices which only support WebVR.
  import WebXRPolyfill from './third-party/webxr-polyfill/build/webxr-polyfill.module.js';
  if (QueryArgs.getBool('usePolyfill', true)) {
    let polyfill = new WebXRPolyfill();
  }

  // XR globals.
  let xrButton = null;
  let xrImmersiveRefSpace = null;
  let inlineViewerHelper = null;

  // WebGL globals.
  let gl = null;
  let canvas = null;
  let fragRenderer = null;

  function initXR() {
    xrButton = new WebXRButton({
      onRequestSession: onRequestSession,
      onEndSession: onEndSession
    });
    document.getElementById('vr_controls').appendChild(xrButton.domElement);

    canvas = document.getElementById("vr_canvas");
    //canvas.addEventListener("click",fullscreen)

    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        xrButton.enabled = supported;
      });

      // Start up an inline session, which should always be supported on
      // browsers that support WebXR regardless of the available hardware.
      navigator.xr.requestSession('inline').then(onSessionStarted);
    }
  }

  function fullscreen(){
    if(canvas.webkitRequestFullScreen) {
      canvas.webkitRequestFullScreen();
    }
    else {
      canvas.mozRequestFullScreen();
    }
  }

  function onRequestSession() {
    return navigator.xr.requestSession('immersive-vr').then((session) => {
      xrButton.setSession(session);
      // Set a flag on the session so we can differentiate it from the
      // inline session.
      session.isImmersive = true;
      onSessionStarted(session);
    });
  }

  function onSessionStarted(session) {
    session.addEventListener('end', onSessionEnded);

    if (!gl) {
      // gl = createWebGLContext({
      //   xrCompatible: true
      // });
      //canvas = document.createElement('canvas');
      gl = canvas.getContext('webgl', { xrCompatible: true });

      // In order for an inline session to be used we must attach the WebGL
      // canvas to the document, which will serve as the output surface for
      // the results of the inline session's rendering.
      //document.body.appendChild(gl.canvas);

      // The canvas is synced with the window size via CSS, but we still
      // need to update the width and height attributes in order to keep
      // the default framebuffer resolution in-sync.
      function onResize() {
        gl.canvas.width = gl.canvas.clientWidth * window.devicePixelRatio;
        gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio;
      }
      window.addEventListener('resize', onResize);
      onResize();

      fragRenderer = new FragRenderer(gl, canvas, vertString, fragString);
      // program = fragRenderer.program;
      // gl.useProgram(program);

    }

    // WebGL layers for inline sessions won't allocate their own framebuffer,
    // which causes gl commands to naturally execute against the default
    // framebuffer while still using the canvas dimensions to compute
    // viewports and projection matrices.
    let glLayer = new XRWebGLLayer(session, gl);

    session.updateRenderState({
      baseLayer: glLayer
    });

    let refSpaceType = session.isImmersive ? 'local' : 'viewer';
    session.requestReferenceSpace(refSpaceType).then((refSpace) => {
      // Since we're dealing with multiple sessions now we need to track
      // which XRReferenceSpace is associated with which XRSession.
      if (session.isImmersive) {
        xrImmersiveRefSpace = refSpace;
      } else {
        inlineViewerHelper = new InlineViewerHelper(gl.canvas, refSpace);
        //inlineViewerHelper.setHeight(1.6);
      }
      session.requestAnimationFrame(onXRFrame);
    });
  }

  function onEndSession(session) {
    session.end();
  }

  function onSessionEnded(event) {
    // Only reset the button when the immersive session ends.
    if (event.session.isImmersive) {
      xrButton.setSession(null);
    }
  }

  // Called every time a XRSession requests that a new frame be drawn.
  function onXRFrame(t, frame) {
    let session = frame.session;
    // Ensure that we're using the right frame of reference for the session.
    let refSpace = session.isImmersive ?
                     xrImmersiveRefSpace :
                     inlineViewerHelper.referenceSpace;

    let pose = frame.getViewerPose(refSpace);

    updateInputSources(session, frame, refSpace);

    session.requestAnimationFrame(onXRFrame);

    if (pose) {
      let glLayer = session.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      fragRenderer.setUniforms(t);

      for (let view of pose.views) {
        let viewport = glLayer.getViewport(view);

        let invProjMatrix = mat4.create();
        mat4.invert(invProjMatrix, view.projectionMatrix);

        fragRenderer.setViewUniforms(view, viewport, invProjMatrix)

        gl.viewport(viewport.x, viewport.y,
                    viewport.width, viewport.height);

        fragRenderer.render();
      }
    }
  }

  function updateInputSources(session, frame, refSpace) {
    // let leftControllerTransformUniformLocation = gl.getUniformLocation(program, "iLeftControllerTransform");
    // let leftBooleanUniformLocation = gl.getUniformLocation(program, "iLeftExists");
    // let rightControllerTransformUniformLocation = gl.getUniformLocation(program, "iRightControllerTransform");
    // let rightBooleanUniformLocation = gl.getUniformLocation(program, "iRightExists");
    // gl.uniform1i(leftBooleanUniformLocation, false);
    // gl.uniform1i(rightBooleanUniformLocation, false);
    //
    // for (let inputSource of session.inputSources) {
    //   let targetRayPose = frame.getPose(inputSource.targetRaySpace, refSpace);
    //
    //   // We may not get a pose back in cases where the input source has lost
    //   // tracking or does not know where it is relative to the given frame
    //   // of reference.
    //   if (!targetRayPose) {
    //     continue;
    //   }
    //
    //   if (inputSource.targetRayMode == 'tracked-pointer') {
    //     if (inputSource.handedness == "left"){
    //       gl.uniformMatrix4fv(leftControllerTransformUniformLocation, false, targetRayPose.transform.matrix);
    //       gl.uniform1i(leftBooleanUniformLocation, true);
    //     }
    //
    //     if (inputSource.handedness == "right"){
    //       gl.uniformMatrix4fv(rightControllerTransformUniformLocation, false, targetRayPose.transform.matrix);
    //       gl.uniform1i(rightBooleanUniformLocation, true);
    //     }
    //   }
    // }

    fragRenderer.updateInputSources(session, frame, refSpace);
  }

    // Load shader files then start the XR application.

  import vertString from "./posts/minimal-vert-shader.js";
  let path = "./posts/" + document.getElementById("vr_input").value;
  var fragString;

  import(path)
  .then((module) => {
    fragString = module.default;
    initXR();
    })
  .catch(err => {throw "No Frag Shader Module Found";});
