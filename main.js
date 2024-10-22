import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import Stats from "stats.js";
import * as THREE from "three";
import * as OBCF from "@thatopen/components-front";
import * as WEB from "web-ifc";

const container = document.getElementById("container");
const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);

const world = worlds.create();
world.scene = new OBC.SimpleScene(components);
world.renderer = new OBCF.PostproductionRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();
world.scene.three.background = null;
world.scene.setup();
world.scene.config.backgroundColor = new THREE.Color(0xff0000);
world.scene.config.directionalLight.intensity = 10;
world.scene.config.ambientLight.intensity = 10;
world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

const grids = components.get(OBC.Grids);
const grid = grids.create(world);
grid.config.color = new THREE.Color(0xffffff);
grid.config.primarySize = 10;
grid.config.secondarySize = 40;
grid.config.visible = true;
// // grids._defaultConfig.color.set(0xff0000);
// console.log(grid);

const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);

const { postproduction } = world.renderer;
postproduction.enabled = true;
postproduction.customEffects.excludedMeshes.push(grid.three);
const ao = postproduction.n8ao.configuration;
await fragmentIfcLoader.setup();

const dimensions = components.get(OBCF.LengthMeasurement);
let model;
async function loadIfc() {
  const file = await fetch(
    "https://adryelfmr.github.io/ifcapi/projetomatheus.ifc"
  );
  const data = await file.arrayBuffer();
  const buffer = new Uint8Array(data);
  model = await fragmentIfcLoader.load(buffer);
  model.name = "example";

  world.scene.three.add(model);

  dimensions.world = world;
  dimensions.enabled = true;
  dimensions.snapDistance = 1;
}

fragments.onFragmentsLoaded.add((model) => {
  console.log(model);
});

const highlighter = components.get(OBCF.Highlighter);
highlighter.setup({ world });
highlighter.zoomToSelection = true;

const outliner = components.get(OBCF.Outliner);
outliner.world = world;
outliner.enabled = true;

outliner.create(
  "example",
  new THREE.MeshBasicMaterial({
    color: 0xbcf124,
    transparent: true,
    opacity: 0.5,
  })
);

highlighter.events.select.onHighlight.add(function (data) {
  outliner.clear("example");
  outliner.add("example", data);
});

highlighter.events.select.onClear.add(function () {
  outliner.clear("example");
});

function download(file) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  console.log("O world é:" + world);
}

async function exportFragments() {
  if (!fragments.groups.size) {
    return;
  }
  const group = Array.from(fragments.groups.values())[0];
  const data = fragments.export(group);
  download(new File([new Blob([data])], "small.frag"));

  const properties = group.getLocalProperties();
  if (properties) {
    download(new File([JSON.stringify(properties)], "small.json"));
  }
}

function disposeFragments() {
  fragments.dispose();
}

const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";
world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());

BUI.Manager.init();

const panel = BUI.Component.create(() => {
  return BUI.html`
  <bim-panel active label="IFC Loader Tutorial" class="options-menu">
    <bim-panel-section collapsed label="Controls">
      <bim-panel-section style="padding-top: 12px;">
      
        <bim-button label="Load IFC"
          @click="${() => {
            loadIfc();
          }}">
        </bim-button>  
            
        <bim-button label="Export fragments"
          @click="${() => {
            exportFragments();
          }}">
        </bim-button>  
            
        <bim-button label="Dispose fragments"
          @click="${() => {
            disposeFragments();
          }}">
        </bim-button>
      
      </bim-panel-section>
      
    </bim-panel>
  `;
});

document.body.append(panel);

const button = BUI.Component.create(() => {
  return BUI.html`
    <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
      @click="${() => {
        if (panel.classList.contains("options-menu-visible")) {
          panel.classList.remove("options-menu-visible");
        } else {
          panel.classList.add("options-menu-visible");
        }
      }}">
    </bim-button>
  `;
});

document.body.append(button);
