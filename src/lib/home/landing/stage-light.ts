// EvenTime's take on the SurfBoard stage light: Vedhika glows green, Boltools cracks a blue
// bolt, EvenTime opens a violet ticket behind the headline. Drawn at reduced resolution
// because the light is soft by nature, which keeps it cheap on low-end phones.

const RENDER_SCALE = 0.5;
const MAX_PIXEL_RATIO = 1.5;

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uReveal;
uniform float uTime;
uniform vec3 uPaper;

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float a = -0.14 + 0.03 * sin(uTime * 0.3);
  uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;
  uv.y += (1.0 - uReveal) * 0.7;

  // A ticket: a rounded card with a semicircle bitten out of each side.
  vec2 size = vec2(0.95, 0.52) * uReveal * 1.9;
  float d = roundBox(uv, size, 0.14 * uReveal + 0.001);
  float notch = length(vec2(abs(uv.x) - size.x, uv.y)) - 0.14 * uReveal;
  d = max(d, -notch);
  d += 0.035 * sin(uv.x * 6.0 + uTime * 0.7) * sin(uv.y * 5.0 - uTime * 0.5);

  float glow = 1.0 - smoothstep(-0.05, 0.45, d);
  float core = 1.0 - smoothstep(-0.4, 0.05, d);
  vec3 edge = vec3(0.80, 0.74, 1.0);
  vec3 deep = vec3(0.424, 0.278, 1.0);
  vec3 col = mix(uPaper, edge, glow * uReveal);
  col = mix(col, deep, core);
  // A tall phone screen outgrows the ticket, so the field finishes the job and leaves no paper corner.
  col = mix(col, deep, smoothstep(0.8, 1.0, uReveal));
  gl_FragColor = vec4(col, 1.0);
}
`;

export type StageLight = { setReveal: (value: number) => void; destroy: () => void };

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader could not be created");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader failed");
  return shader;
}

// Returns null when WebGL is unavailable, so the caller falls back to a CSS glow.
export function createStageLight(canvas: HTMLCanvasElement, paper: [number, number, number] = [1, 1, 1]): StageLight | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl || gl.isContextLost()) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "uRes");
  const uReveal = gl.getUniformLocation(program, "uReveal");
  const uTime = gl.getUniformLocation(program, "uTime");
  gl.uniform3fv(gl.getUniformLocation(program, "uPaper"), paper);

  let reveal = 0;
  let frame = 0;
  let visible = true;
  const started = performance.now();

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO) * RENDER_SCALE;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (now: number) => {
    frame = 0;
    if (!visible) return;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uReveal, reveal);
    gl.uniform1f(uTime, (now - started) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // The ticket only drifts once it is on screen; an unlit stage costs nothing.
    if (reveal > 0.001) frame = requestAnimationFrame(draw);
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });
  observer.observe(canvas);
  window.addEventListener("resize", resize);
  resize();
  wake();

  return {
    setReveal(value) {
      reveal = value;
      wake();
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      // Never lose the context here: a canvas hands back the same one, so a remount
      // (StrictMode, Fast Refresh) would get a dead context and fail to compile.
      gl.deleteProgram(program);
    },
  };
}
