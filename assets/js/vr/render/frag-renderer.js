
/*
Compiles supplied shader code and renders to canvases
*/

export class FragRenderer {
  constructor(gl, canvas, vertString, fragString) {

    this.gl = gl;
    this.canvas = canvas;

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0]),
      gl.STATIC_DRAW
    );

    //this.program = this.createProgramFromScripts(this.gl, ["2d-vertex-shader", "2d-fragment-shader"]);
    this.program = this.createProgramFromStrings(this.gl, [vertString, fragString]);

    gl.useProgram(this.program);
    this.initLocations();
  }



  compileShader(gl, shaderSource, shaderType) {
    // Create the shader object
    var shader = gl.createShader(shaderType);

    // Set the shader source code.
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check if it compiled
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      // Something went wrong during compilation; get the error
      throw "could not compile shader:" + gl.getShaderInfoLog(shader);
    }

    return shader;
  }

  compileShaderFromScript(gl, scriptId, shaderType){
    var shaderScript = document.getElementById(scriptId);
    if (!shaderScript) {
      throw("*** Error: unknown script element" + scriptId);
    }

    // extract the contents of the script tag.
    var shaderSource = shaderScript.text;
    return this.compileShader(gl, shaderSource, shaderType);
  }

  createProgram(gl, vertexShader, fragmentShader) {
    // create a program.
    var program = gl.createProgram();

    // attach the shaders.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // link the program.
    gl.linkProgram(program);

    // Check if it linked.
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        // something went wrong with the link
        throw ("program failed to link:" + gl.getProgramInfoLog (program));
    }

    return program;
  }

  createProgramFromScripts(gl, shaderScriptIds){
    var vertexShader = this.compileShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
    var fragmentShader = this.compileShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
    return this.createProgram(gl, vertexShader, fragmentShader);
  }

  createProgramFromStrings(gl, shaderScriptStrings){
    var vertexShader = this.compileShader(gl, shaderScriptStrings[0], gl.VERTEX_SHADER);
    var fragmentShader = this.compileShader(gl, shaderScriptStrings[1], gl.FRAGMENT_SHADER);
    return this.createProgram(gl, vertexShader, fragmentShader);
  }

  initLocations(){
    let program = this.program;
    let gl = this.gl;

    this.positionLocation = gl.getAttribLocation(program, "a_position");
    this.resolutionUniformLocation = gl.getUniformLocation(program, "iResolution");
    this.viewportUniformLocation = gl.getUniformLocation(program, "iViewport");
    this.timeUniformLocation = gl.getUniformLocation(program, "iTime");

    this.viewTransformUniformLocation = gl.getUniformLocation(program, "iViewTransform");
    this.inverseProjectionMatrixUniformLocation = gl.getUniformLocation(program, "iInvProjMatrix");

    this.leftControllerTransformUniformLocation = gl.getUniformLocation(program, "iLeftControllerTransform");
    this.leftBooleanUniformLocation = gl.getUniformLocation(program, "iLeftExists");
    this.rightControllerTransformUniformLocation = gl.getUniformLocation(program, "iRightControllerTransform");
    this.rightBooleanUniformLocation = gl.getUniformLocation(program, "iRightExists");

    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
  }


  setUniforms(time, ){
    this.gl.uniform1f(this.timeUniformLocation, time/1000);

  }

  setViewUniforms(view, viewport, invProjMatrix){
    let gl = this.gl;

    gl.uniform3f(this.resolutionUniformLocation, viewport.width, viewport.height, 1.);
    gl.uniform2f(this.viewportUniformLocation, viewport.x, viewport.y);

    gl.uniformMatrix4fv(this.viewTransformUniformLocation, false, view.transform.matrix);
    gl.uniformMatrix4fv(this.inverseProjectionMatrixUniformLocation, false, invProjMatrix);

  }

  updateInputSources(session, frame, refSpace) {
    let gl = this.gl;
    let left = false;
    let right = false;

    for (let inputSource of session.inputSources) {
      let targetRayPose = frame.getPose(inputSource.targetRaySpace, refSpace);

      // We may not get a pose back in cases where the input source has lost
      // tracking or does not know where it is relative to the given frame
      // of reference.
      if (!targetRayPose) {
        continue;
      }

      if (inputSource.targetRayMode == 'tracked-pointer') {
        if (inputSource.handedness == "left"){
          gl.uniformMatrix4fv(this.leftControllerTransformUniformLocation, false, targetRayPose.transform.matrix);
          left = true;
        }

        if (inputSource.handedness == "right"){
          gl.uniformMatrix4fv(this.rightControllerTransformUniformLocation, false, targetRayPose.transform.matrix);
          right = true;
        }
      }
    }

    gl.uniform1i(this.leftBooleanUniformLocation, left);
    gl.uniform1i(this.rightBooleanUniformLocation, right);
  }

  render(){
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
