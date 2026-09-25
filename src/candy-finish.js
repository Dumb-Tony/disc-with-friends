import * as T from "../vendor/three.module.js";
// Half-float scene buffer plus quarter-resolution highlight diffusion. No depth blur
// or film grain: the basket and the disc remain sharp while the world gains bloom.
export class CandyFinish {
  constructor(renderer) {
    this.renderer = renderer;
    this.sceneTarget = new T.WebGLRenderTarget(1, 1, {
      type: T.HalfFloatType,
      depthBuffer: true,
      samples: 2,
    });
    this.glowTarget = new T.WebGLRenderTarget(1, 1, {
      type: T.HalfFloatType,
      depthBuffer: false,
    });
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const vertexShader =
      "varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}";
    this.extract = new T.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        source: { value: this.sceneTarget.texture },
        pixel: { value: new T.Vector2() },
      },
      vertexShader,
      fragmentShader:
        "varying vec2 uv0;uniform sampler2D source;uniform vec2 pixel;void main(){vec3 c=vec3(0.);for(int i=-4;i<=4;i++){vec3 s=texture2D(source,uv0+vec2(float(i)*pixel.x*2.,0.)).rgb;float l=max(s.r,max(s.g,s.b));c+=s*smoothstep(1.1,2.4,l)*(1.-abs(float(i))*.16);}gl_FragColor=vec4(c/5.8,1.);}",
    });
    this.compose = new T.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        source: { value: this.sceneTarget.texture },
        glow: { value: this.glowTarget.texture },
        pixel: { value: new T.Vector2() },
      },
      vertexShader,
      fragmentShader: `varying vec2 uv0;uniform sampler2D source;uniform sampler2D glow;uniform vec2 pixel;
void main(){vec3 c=texture2D(source,uv0).rgb;vec3 bloom=vec3(0.);for(int i=-4;i<=4;i++)bloom+=texture2D(glow,uv0+vec2(0.,float(i)*pixel.y*2.)).rgb*(1.-abs(float(i))*.16);c+=bloom*.065;
float light=smoothstep(.15,1.5,dot(c,vec3(.2126,.7152,.0722)));c*=mix(vec3(.98,.99,1.035),vec3(1.025,1.005,.975),light);
vec2 q=uv0-.5;c*=1.-.12*dot(q,q);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    });
    this.quad = new T.Mesh(new T.PlaneGeometry(2, 2), this.extract);
    this.scene.add(this.quad);
  }
  resize() {
    const size = this.renderer.getDrawingBufferSize(new T.Vector2()),
      w = Math.max(1, Math.floor(size.x / 4)),
      h = Math.max(1, Math.floor(size.y / 4));
    this.sceneTarget.setSize(size.x, size.y);
    this.glowTarget.setSize(w, h);
    this.extract.uniforms.pixel.value.set(1 / w, 1 / h);
    this.compose.uniforms.pixel.value.set(1 / w, 1 / h);
  }
  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.sceneTarget);
    r.render(scene, camera);
    r.setRenderTarget(this.glowTarget);
    this.quad.material = this.extract;
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    this.quad.material = this.compose;
    r.render(this.scene, this.camera);
  }
}
