import React, { FormEvent, FormEventHandler, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { BasicEditor } from './Component/BasicEditor';
import { PixiJsApp } from './Component/PixiJsEditor';
import { PixiJsMiniEditor } from './Component/PixiJsMiniEditor';
import { Application, Graphics, ICanvas, Sprite, Texture, Text, filters, Point, FederatedPointerEvent, ColorSource, IPointData, } from 'pixi.js';
import { EditorSettings } from './Component/EditorSettings';
import { Button, ButtonGroup, Divider, FileInput, FormGroup, Icon, InputGroup, ProgressBar, Tab, Tabs } from '@blueprintjs/core';
import { AdjustmentFilter } from 'pixi-filters';
import { IDots, IPosition } from './Types/Dots';
import { strict } from 'assert';
import { Viewport } from 'pixi-viewport';
import dots from "./TempData/0.jpg.json";
import jsPDF from 'jspdf';

const dotLabels = {
  "A": "A",
  "Ar_Articulare": "Ar",
  "B": "B",
  "Cm_columela": "Cm",
  "D": "D",
  "Gn_Gnathion": "Gn",
  "Go_Gonion": "Go",
  "Is_gornja_vilica": "Is",
  "Li_labrale_inferius": "Li",
  "Ls_Labrale_superius": "Ls",
  "Me_Menton": "Me",
  "N_Nasion": "N",
  "N_nasion_meka_tkiva": "N'",
  "Pg_Pogonion": "Pg",
  "Pg_pogonion_meka_tkiva": "Pg'",
  "Prn_pronasale": "Prn",
  "S_Sella": "S",
  "Se_Sella_entrance": "Se",
  "Sn_subnasale": "Sn",
  "Sna_Spina_nasalis_anterior": "Sna",
  "Snp_Spina_nasalis_poserior": "Snp",
  "is_donja_vilica": "is",
}

function subtract(main: Point, other: Point): Point {
  var outPoint: Point = new Point(0, 0);

  if (!outPoint) {
    (outPoint as any) = new Point();
  }
  outPoint.x = main.x - other.x;
  outPoint.y = main.y - other.y;

  return outPoint;
}

const fileName = "data/xrays/0.jpg";
const jsonName = "data/json/0.jpg.json";

type LoadingStateType = "Loading" | "Loaded" | "ToLoad" | "None";

var editor: Application<ICanvas>;
var miniEditor: Application<ICanvas>;
var miniSprite: Sprite;
var sprite: Sprite;
var zoom = 2;
var brightnessFilter = new AdjustmentFilter({ brightness: 1 });
var contrastFilter = new AdjustmentFilter({ contrast: 1 });
var dotsLabels: Text;
var viewport: Viewport;
var isCalibrating: boolean = false;
var calibrationDots = {
  dot1: new Graphics(),
  dot2: new Graphics(),
  line: new Graphics(),
  toggle: true,


  dot1Viewport: new Graphics(),
  dot2Viewport: new Graphics(),
  lineViewport: new Graphics(),
}

var dragging = false;
var currentlyDragging: DotsKeys;
var filesAdded: string[] = [];

let dragStartPos: Point = new Point();
let dragStartObjPos: Point = new Point();


/*SN	Spaja tacke S i N
SpP	Spaja tacke Sna i Snp
MP	Spaja tacke Me i Go
E	Spaja tacke Prn i Pg'
I	Spaja tacke Is i Ap
i	Spaja tacke is i ap
Frankfurtska horizontala	Spaja tacke Or i Po*/
var analysisLines = {
  SN: [new Graphics(), new Graphics(), "N_Nasion", "S_Sella"],
  SpP: [new Graphics(), new Graphics(), "Sna_Spina_nasalis_anterior", "Snp_Spina_nasalis_poserior"],
  MP: [new Graphics(), new Graphics(), "Go_Gonion", "Me_Menton"],
  E: [new Graphics(), new Graphics(), "Prn_pronasale", "Pg_pogonion_meka_tkiva"],
  /*I: [new Graphics(), new Graphics(), "N_Nasion", "S_Sella"],
  i: [new Graphics(), new Graphics(), "N_Nasion", "S_Sella"],
  Frank: [new Graphics(), new Graphics(), "N_Nasion", "S_Sella"],*/
}

var angleText: Text = new Text("", {
  fontFamily: 'Arial',
  fontSize: 12,
  fill: 0xF57328,
  align: 'left'
});

const progressLabels = [
  "Uploading image...",
  "Running model...",
  "Preparing results..."
];

const rand = () => Math.random() * 1000;

// calcualte angel betwen therr points
function angleBetweenPoints(key1: DotsKeys, key2: DotsKeys, key3: DotsKeys) {
  const P1 = dotContainer[key1];
  const P2 = dotContainer[key2];
  const P3 = dotContainer[key3];

  // Calculate vectors a and b
  var a = [P1.x - P2.x, P1.y - P2.y];
  var b = [P3.x - P2.x, P3.y - P2.y];

  // Calculate dot product of vectors a and b
  var dotProduct = a[0] * b[0] + a[1] * b[1];

  // Calculate magnitudes of vectors a and b
  var magnitudeA = Math.sqrt(a[0] ** 2 + a[1] ** 2);
  var magnitudeB = Math.sqrt(b[0] ** 2 + b[1] ** 2);

  // Calculate cosine of the angle between vectors a and b
  var cosineAngle = dotProduct / (magnitudeA * magnitudeB);

  // Calculate angle in radians
  var angleRadians = Math.acos(cosineAngle);

  // Convert angle from radians to degrees
  var angleDegrees = (angleRadians * 180) / Math.PI;

  return angleDegrees;
}

type DotLine = (Graphics | string)[];

function calculateAngleLines(lineContainer1: DotLine, lineContainer2: DotLine) {
  const line1 = [dotContainer[lineContainer1[2] as DotsKeys], dotContainer[lineContainer1[3] as DotsKeys]];
  const line2 = [dotContainer[lineContainer2[2] as DotsKeys], dotContainer[lineContainer2[3] as DotsKeys]];

  const m1 = (line1[1].y - line1[0].y) / (line1[1].x - line1[0].x);
  const m2 = (line2[1].y - line2[0].y) / (line2[1].x - line2[0].x);
  const tanTheta = (m1 - m2) / (1 + m1 * m2);
  const theta = Math.atan(tanTheta);

  // Convert the angle to degrees
  var degrees = (theta * 180) / Math.PI;

  if (degrees < 0) {
    degrees *= -1;
  }

  return degrees;
}

/* DOTS */
type Dots = typeof dots;
type DotsKeys = keyof typeof dots;

type DotsMap = {
  [Property in DotsKeys]: Graphics;
};

var dotContainer: DotsMap = {
  A: new Graphics,
  B: new Graphics,
  D: new Graphics,
  N_Nasion: new Graphics,
  S_Sella: new Graphics,
  Sna_Spina_nasalis_anterior: new Graphics,
  Snp_Spina_nasalis_poserior: new Graphics,
  Go_Gonion: new Graphics,
  Me_Menton: new Graphics,
  Prn_pronasale: new Graphics,
  Pg_pogonion_meka_tkiva: new Graphics,
  Ar_Articulare: new Graphics,
  Cm_columela: new Graphics,
  Gn_Gnathion: new Graphics,
  Is_gornja_vilica: new Graphics,
  Li_labrale_inferius: new Graphics,
  Ls_Labrale_superius: new Graphics,
  N_nasion_meka_tkiva: new Graphics,
  Pg_Pogonion: new Graphics,
  Se_Sella_entrance: new Graphics,
  Sn_subnasale: new Graphics,
  is_donja_vilica: new Graphics
};

var dotViewportContainer: DotsMap = {
  A: new Graphics,
  B: new Graphics,
  D: new Graphics,
  N_Nasion: new Graphics,
  S_Sella: new Graphics,
  Sna_Spina_nasalis_anterior: new Graphics,
  Snp_Spina_nasalis_poserior: new Graphics,
  Go_Gonion: new Graphics,
  Me_Menton: new Graphics,
  Prn_pronasale: new Graphics,
  Pg_pogonion_meka_tkiva: new Graphics,
  Ar_Articulare: new Graphics,
  Cm_columela: new Graphics,
  Gn_Gnathion: new Graphics,
  Is_gornja_vilica: new Graphics,
  Li_labrale_inferius: new Graphics,
  Ls_Labrale_superius: new Graphics,
  N_nasion_meka_tkiva: new Graphics,
  Pg_Pogonion: new Graphics,
  Se_Sella_entrance: new Graphics,
  Sn_subnasale: new Graphics,
  is_donja_vilica: new Graphics
};

function App() {


  async function bootstrapImage() {

    var texture = await Texture.from(fileName);
    sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = editor.view.width / 2;
    sprite.y = editor.view.height / 2;
    sprite.height = editor.view.height;
    sprite.width = editor.view.width;

    sprite.filters = [brightnessFilter, contrastFilter];

    editor.stage.addChildAt(sprite, 0);

    (Object.keys(dots) as (keyof typeof dots)[]).forEach((key, index) => {
      var dotsGraphics = dotContainer[key];

      // Set the fill style and draw the dot

      dotsGraphics.beginFill(0xF8008A);
      dotsGraphics.drawCircle(0, 0, 6);
      dotsGraphics.endFill();

      // Create a new Text object for the label
      dotsLabels = new Text(dotLabels[key], {
        fontSize: 14,
        fill: 0xF8008A,
      });

      // Set the position of the label
      dotsLabels.anchor.set(0.5);
      dotsLabels.position.set(0, - 15);
      dotsGraphics.position.set(dots[key].x * 0.8, dots[key].y * 0.8);

      dotsGraphics.interactive = true;

      const onDragStart = (event: FederatedPointerEvent) => {
        dotsGraphics.alpha = 0.5;
        dotViewportContainer[key].alpha = 0.5;
        dragStartPos = event.data.global.clone();
        dragStartObjPos = dotsGraphics.position.clone();

        currentlyDragging = key;
        dragging = true;
      }

      const onDragEnd = (event: FederatedPointerEvent) => {
        dragging = false;
        dotsGraphics.alpha = 1;
        dotViewportContainer[key].alpha = 1;
      }


      dotsGraphics.on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd);


      // Add the Container object to the stage
      dotsGraphics.addChild(dotsLabels);
      editor.stage.addChild(dotsGraphics);
    });

    editor.stage.addChild(calibrationDots.dot1);
    editor.stage.addChild(calibrationDots.dot2);
    editor.stage.addChild(calibrationDots.line);
    editor.stage.addChild(angleText);

    const onDragMove = (event: FederatedPointerEvent) => {
      if (dragging) {
        const newPos = event.data.global.clone();
        const delta = subtract(newPos, dragStartPos);
        dotContainer[currentlyDragging].position.set(dragStartObjPos.x + delta.x, dragStartObjPos.y + delta.y);
        dotViewportContainer[currentlyDragging].position.set((dragStartObjPos.x + delta.x) * 1 / 0.8 - miniSprite.width / 2, (dragStartObjPos.y + delta.y) * 1 / 0.8 - miniSprite.height / 2);
      }
    }

    editor.stage.on('pointermove', onDragMove);

    function onClick(event: FederatedPointerEvent): void {
      event.stopImmediatePropagation();
      if (isCalibrating) {
        var dot: Graphics;

        const ratio = miniSprite.width / editor.renderer.width;
        const { x, y, } = event.global;

        if (calibrationDots.toggle) {
          const { dot1, dot2, line, dot1Viewport, dot2Viewport, lineViewport, } = calibrationDots;

          dot = dot1;

          dot1.clear();
          dot2.clear();
          line.clear();
          dot1Viewport.clear();
          dot2Viewport.clear();
          lineViewport.clear();

          // Set the fill style and draw the dot
          dot1.beginFill(0xF8008A);
          dot1.drawCircle(0, 0, 4);
          dot1.endFill();

          dot1.position.x = x;
          dot1.position.y = y;

          // VIEWPORT
          dot1Viewport.beginFill(0xF8008A);
          dot1Viewport.drawCircle(0, 0, 4);
          dot1Viewport.endFill();

          dot1Viewport.position.x = x * ratio - miniSprite.width / 2;
          dot1Viewport.position.y = y * ratio - miniSprite.height / 2;

          // 
          calibrationDots.toggle = false;
        } else {
          const { dot1, dot2, line, dot1Viewport, dot2Viewport, lineViewport, } = calibrationDots;

          dot = dot2;

          dot2.clear();

          // Set the fill style and draw the dot
          dot2.beginFill(0xF8008A);
          dot2.drawCircle(0, 0, 4);
          dot2.endFill();

          dot2.position.x = event.global.x;
          dot2.position.y = event.global.y;

          // Set the line style and draw the horizontal line
          line.lineStyle(2, 0xA020F0);
          line.moveTo(dot1.position.x, dot1.position.y);
          line.lineTo(dot2.position.x, dot2.position.y);

          // VIEWPORT
          dot2Viewport.beginFill(0xF8008A);
          dot2Viewport.drawCircle(0, 0, 4);
          dot2Viewport.endFill();

          dot2Viewport.position.x = x * ratio - miniSprite.width / 2;
          dot2Viewport.position.y = y * ratio - miniSprite.height / 2;

          lineViewport.lineStyle(2, 0xA020F0);
          lineViewport.moveTo(dot1Viewport.position.x, dot1Viewport.position.y);
          lineViewport.lineTo(dot2Viewport.position.x, dot2Viewport.position.y);

          calibrationDots.toggle = true;
        }
      }
    }

    editor.stage.on("click", onClick);
  }

  function bootstrapViewport() {
    var texture = Texture.from(fileName, {}, true);
    viewport = new Viewport({
      screenWidth: 400,
      screenHeight: 400,
      worldWidth: texture.width,
      worldHeight: texture.height,

      events: miniEditor.renderer.events
    });

    miniSprite = new Sprite(texture);
    miniSprite.anchor.set(0.5);

    viewport.center = new Point(miniSprite.width / 2, miniSprite.height / 2);

    viewport.zoomPercent(zoom);

    viewport.addChild(miniSprite);

    miniEditor.stage.addChild(viewport);

    setTimeout(() => {
      (Object.keys(dots) as (keyof typeof dots)[]).forEach((key, index) => {
        var dotsGraphics: Graphics = dotViewportContainer[key];

        const x = dots[key].x - miniSprite.width / 2;
        const y = dots[key].y - miniSprite.height / 2;

        // Set the fill style and draw the dot
        dotsGraphics.beginFill(0xF8008A);
        dotsGraphics.drawCircle(0, 0, 4);
        dotsGraphics.endFill();

        // Create a new Text object for the label
        dotsLabels = new Text(dotLabels[key], {
          fontSize: 14,
          fill: 0xF8008A
        });

        // Set the position of the label
        dotsLabels.anchor.set(0.5);
        dotsLabels.position.set(0, - 15);

        dotsGraphics.position.set(x, y);

        dotsGraphics.addChild(dotsLabels);

        // Add the Container object to the stage
        miniSprite.addChild(dotsGraphics);

        dotViewportContainer[key] = dotsGraphics;
      });

      (Object.keys(analysisLines) as (keyof typeof analysisLines)[]).forEach((key, index) => {
        var lineMain: Graphics = analysisLines[key][0] as Graphics;
        var lineViewport: Graphics = analysisLines[key][1] as Graphics;

        editor.stage.addChild(lineMain);
        miniSprite.addChild(lineViewport);
      });
    }, 300);

    // Create a new Graphics object
    const graphics = new Graphics();

    // Set the line style and draw the horizontal line
    graphics.lineStyle(2, 0xA020F0);
    graphics.moveTo(180, miniEditor.renderer.screen.height / 2);
    graphics.lineTo(miniEditor.renderer.screen.width - 180, miniEditor.renderer.screen.height / 2);

    // Set the line style and draw the vertical line
    graphics.lineStyle(2, 0xA020F0);
    graphics.moveTo(miniEditor.renderer.screen.width / 2, 180);
    graphics.lineTo(miniEditor.renderer.screen.width / 2, miniEditor.renderer.screen.height - 180);

    // Add the Graphics object to the stage
    miniEditor.stage.addChild(graphics);

    miniSprite.addChild(calibrationDots.dot1Viewport);
    miniSprite.addChild(calibrationDots.dot2Viewport);
    miniSprite.addChild(calibrationDots.lineViewport);
  }

  async function loadPixiJs(pixi: Application<ICanvas>) {
    editor = pixi;

    bootstrapImage();
  }

  async function loadMiniPixiJs(pixi: Application<ICanvas>) {
    miniEditor = pixi;

    bootstrapViewport();
  }

  function pixiMoveHandler(x: number, y: number) {
    if (miniSprite == undefined) {
      return;
    }

    const ratio = miniSprite.width / editor.renderer.width;

    const xX = - x + editor.renderer.width / 2;
    const yY = - y + editor.renderer.height / 2;
    miniSprite.position.set(xX * ratio, yY * ratio);

    console.log("RATIO " + ratio);
    console.log("HX: " + miniSprite.x);
    console.log("WXS: " + miniSprite.y);

    console.log("pos " + miniEditor.stage.position.x + " y  " + miniEditor.stage.position.y)
  }

  function updateBrightness(brightness: number) {
    brightnessFilter.brightness = brightness / 100;
  }

  function updateContrast(contrast: number) {
    contrastFilter.contrast = contrast / 100;
  }

  function updateZoom(newZoom: number): void {
    zoom = newZoom;

    if (viewport != null) {
      viewport.zoomPercent(zoom);
    }
  }

  function toggleCalibration(): void {
    isCalibrating = !isCalibrating;
  }

  async function handleAnalysisChange(isEnabled: boolean) {
    const ratio = miniSprite.width / editor.renderer.width;

    await (Object.keys(analysisLines) as (keyof typeof analysisLines)[]).forEach((key, index) => {
      var lineMain: Graphics = analysisLines[key][0] as Graphics;
      var lineViewport: Graphics = analysisLines[key][1] as Graphics;

      if (isEnabled) {
        type Main = keyof typeof dots;
        var dot1: Main = analysisLines[key][2] as Main;
        var dot2: Main = analysisLines[key][3] as Main;
        var miniDiff = editor.renderer.width / 2;

        drawLine(lineMain, 2, dotContainer[dot1].position.x, dotContainer[dot1].position.y, dotContainer[dot2].position.x, dotContainer[dot2].position.y, 0x00FF00);
        drawLine(lineViewport, 2, dotViewportContainer[dot1].position.x, dotViewportContainer[dot1].position.y, dotViewportContainer[dot2].position.x, dotViewportContainer[dot2].position.y, 0x00FF00);
      } else {
        lineMain.clear();
        lineViewport.clear();
      }
    });

    if (isEnabled) {
      angleText.position.set(100, 100);

      var SNA = angleBetweenPoints("S_Sella", "N_Nasion", "A");
      var SNB = angleBetweenPoints("S_Sella", "N_Nasion", "B");
      var ANB = angleBetweenPoints("A", "N_Nasion", "B");
      var NSAr = angleBetweenPoints("S_Sella", "Ar_Articulare", "Go_Gonion");
      var ArGoMe = angleBetweenPoints("Ar_Articulare", "Go_Gonion", "Me_Menton");

      const { SN, SpP, MP, } = analysisLines;
      var SnSpP = calculateAngleLines(SN, SpP);
      var SnMp = calculateAngleLines(SN, MP);
      var SppMp = calculateAngleLines(MP, SpP);

      var SGO = Math.sqrt(
        (dotContainer['S_Sella'].x - dotContainer['Go_Gonion'].x) ** 2 + (dotContainer['S_Sella'].y - dotContainer['Go_Gonion'].y) ** 2
      );
      var NMe = Math.sqrt(
        (dotContainer['N_Nasion'].x - dotContainer['Me_Menton'].x) ** 2 + (dotContainer['N_Nasion'].y - dotContainer['Me_Menton'].y) ** 2
      );
      var NSe = Math.sqrt(
        (dotContainer['N_Nasion'].x - dotContainer['Se_Sella_entrance'].x) ** 2 +
        (dotContainer['N_Nasion'].y - dotContainer['Se_Sella_entrance'].y) ** 2
      );

      angleText.text = "SNA:" + SNA.toFixed(0) + "\n"
        + "SNB:" + SNB.toFixed(0) + "\n"
        + "ANB:" + ANB.toFixed(0) + "\n"
        + "NSAr:" + NSAr.toFixed(0) + "\n"
        + "ArGoMe:" + ArGoMe.toFixed(0) + "\n"
        + "\n\n"
        + "SnSpP:" + SnSpP.toFixed(0) + "\n"
        + "SnMp:" + SnMp.toFixed(0) + "\n"
        + "SppMp:" + SppMp.toFixed(2) + "\n"
        + "\n\n"
        + "SGO:" + SGO.toFixed(2) + "\n"
        + "NMe:" + NMe.toFixed(2) + "\n"
        + "NSe:" + NSe.toFixed(2) + "\n";
    } else {
      angleText.text = "";
    }

    angleText.updateText(false);
  }

  function drawLine(graphics: Graphics, width: number, x0: number, y0: number, x1: number, y1: number, color?: ColorSource) {
    graphics.lineStyle(width, color);
    graphics.moveTo(x0, y0);
    graphics.lineTo(x1, y1);
  }

  const [{ loadingState, progressValue, }, setState] = useState({ loadingState: "None", progressValue: 0.1 });

  function handleOnFileInputChange(event: FormEvent<HTMLInputElement>): void {
    setState({ loadingState: "ToLoad", progressValue: 0.1 });

    filesAdded = ["15.jpg"];
  }

  function handleExportFile(event: FormEvent<HTMLElement>): void {
    var canvas = document.getElementById('main-canvas') as any;
    var imgData = canvas.toDataURL("image/png", 1.0);
    var pdf = new jsPDF();

    pdf.text("Hello world!", 1, 1);
    pdf.addImage(imgData, 'PNG', 20, 20, 80, 80);
    pdf.save("download.pdf");
  }

  const mainRender = loadingState == "Loaded" ? (
    <div className="columns main-editor">
      <div className="column">
        <PixiJsApp pixiHandler={loadPixiJs} pixiMoveHandler={pixiMoveHandler} />
      </div>
      <div className="column">
        <div className="editor-settings block">
          <EditorSettings updateBrightness={updateBrightness} updateContrast={updateContrast} updateZoom={updateZoom} handleCalibration={toggleCalibration} handleAnalysisChange={handleAnalysisChange} />
        </div>
        <div className='level'>
          <div className="level-left">
            <PixiJsMiniEditor pixiHandler={loadMiniPixiJs} />
          </div>
        </div>
      </div>
    </div>
  ) : loadingState == "Loading" || loadingState == "ToLoad" ? (
    <div className='columns'>
    <div className='column is-one-third is-offset-one-third is-main-header'>
      <ProgressBar className="progress-bar" value={progressValue} />
      <span>{progressValue < 0.3 ? progressLabels[0] : (progressValue < 0.8 ? progressLabels[1] : progressLabels[2])}</span>
    </div>
    </div>
  ) : (
    <div className="columns">
      <div className="column is-one-third is-offset-one-third is-main-header">
        <img src="logo.png" alt="Bulma: Free, open source, and modern CSS framework based on Flexbox" />
        <div className="analysis-container">
          <p>Get started with analysis by choosing a image file.</p>
          <FileInput className="app-file-input" text={"Choose file..."} buttonText={"Browse"} large={true} onInputChange={handleOnFileInputChange} />
        </div>
      </div>
    </div>
  )

  if (loadingState == "ToLoad") {
    setTimeout(() => {
      setState({ loadingState: "Loading", progressValue: 0.3 });
    }, 1200);

    setTimeout(() => {
      setState({ loadingState: "Loading", progressValue: 0.8 });
    }, 4000);

    setTimeout(() => {
      setState({ loadingState: "Loaded", progressValue: 1.0 });
    }, 5200);
  }

  // <div className="navbar-brand">
  //         <a className="navbar-item" href="https://bulma.io">
  //           <img src="logo.png" alt="Bulma: Free, open source, and modern CSS framework based on Flexbox" width="112"
  //             height="28" />
  //         </a>
  //       </div>
  return (
    <div className="app-container bp4-dark">
      <nav className="app-nav has-text-centered">
        <div>
          <ButtonGroup minimal={true} className="margin-top-fix">
            <Button icon="user" />
            <Button icon="notifications" />
            <Button icon="cog" />
          </ButtonGroup>
        </div>
        <Divider />
        <div>
          <ButtonGroup vertical={true} alignText='left' className="margin-top-fix2">
            <Button
              icon="add"
              text="New report"
            />
            <Button
              icon="export"
              text="Export"
              disabled={loadingState != "Loaded"}
              onClick={handleExportFile}
            />
          </ButtonGroup>
        </div>
        <div className="margin-top-fix2">
          {filesAdded.length > 0 ? (
            <div className="app-subtitle">
              <span className="bp4-text-small bp4-text-muted">Recents</span>
            </div>
          ) : null}
          {filesAdded.map((file) => {
            return (
              <div className="level project-file-container">
                <div className="level-left project-file-full">
                  <Icon icon={'document'} />
                  <span className="project-file">{file}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="navbar-brand">
          <a className="navbar-item" href="https://bulma.io">
            <img src="logo.png" alt="Bulma: Free, open source, and modern CSS framework based on Flexbox" width="112"
              height="28" />
          </a>
        </div>
      </nav>
      <main className='container editor-container'>
        {mainRender}
      </main>
    </div>
  );

  // var analysisTab = (
  //   /*<div className='columns'>
  //     <div className="column is-three-fifths">
  //       <PixiJsApp pixiHandler={loadPixiJs} pixiMoveHandler={pixiMoveHandler} />
  //     </div>
  //   </div>*/
  // );

  // return (
  //   //bp4-dark
  //   <div className="App">
  //     <Tabs large={true}>
  //       <Tab id='it' title='Digitization' panel={initialTab} />
  //       <Tab id='an' title='Analysis' panel={analysisTab} />
  //     </Tabs>

  //   </div>
  // );
}

export default App;


