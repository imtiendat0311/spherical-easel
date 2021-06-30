/** @format */

import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { Vector3 } from "three";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import { SENodule } from "@/models/SENodule";

/**
 * Each Point object is uniquely associated with a SEPoint object.
 * As part of plottables, Point concerns mainly with the visual appearance, but
 * SEPoint concerns mainly with geometry computations.
 */

export default class Point extends Nodule {
  /**
   * The vector location of the Point on the default sphere
   * The location vector in the Default Screen Plane
   * It will always be the case the x and y coordinates of these two vectors are the same.
   * The sign of the z coordinate indicates if the Point is on the back of the sphere
   */
  public _locationVector = new Vector3(1, 0, 0);
  public defaultScreenVectorLocation = new Two.Vector(1, 0);

  /**
   * The TwoJS objects that are used to display the point.
   * One is for the front, the other for the back. Only one is displayed at a time
   * The companion glowing objects are also declared, they are always larger than there
   * drawn counterparts so that a glowing edge shows.
   */
  protected frontPoint: Two.Circle;
  protected backPoint: Two.Circle;
  protected glowingFrontPoint: Two.Circle;
  protected glowingBackPoint: Two.Circle;

  /**
   * The styling variables for the drawn point. The user can modify these.
   */
  // Front
  protected fillColorFront = SETTINGS.point.drawn.fillColor.front;
  protected strokeColorFront = SETTINGS.point.drawn.strokeColor.front;
  protected glowingFillColorFront = SETTINGS.point.glowing.fillColor.front;
  protected glowingStrokeColorFront = SETTINGS.point.glowing.strokeColor.front;
  protected pointRadiusPercentFront = SETTINGS.point.radiusPercent.front;
  // Back - use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  protected fillColorBack = SETTINGS.point.drawn.fillColor.back;
  protected strokeColorBack = SETTINGS.point.drawn.strokeColor.back;
  protected glowingFillColorBack = SETTINGS.point.glowing.fillColor.back;
  protected glowingStrokeColorBack = SETTINGS.point.glowing.strokeColor.back;
  protected pointRadiusPercentBack = SETTINGS.point.radiusPercent.back;

  protected dynamicBackStyle = SETTINGS.point.dynamicBackStyle;

  /**
   * Initialize the current point scale factor that is adjusted by the zoom level and the user pointRadiusPercent
   * The initial size of the points are set by the defaults in SETTINGS
   */
  static pointScaleFactor = 1;

  /**
   * Update the point scale factor -- the points are drawn of the default size in the constructor
   * so to account for the zoom magnification we only need to keep track of the scale factor (which is
   * really just one over the current magnification factor) and then scale the point on the zoom event.
   * This is accomplished by the adjustSize() method
   * @param factor The ratio of the old magnification factor over the new magnification factor
   */
  static updatePointScaleFactorForZoom(factor: number): void {
    Point.pointScaleFactor *= factor;
  }

  constructor() {
    super();

    //Create the front/back/glowing/drawn TwoJS objects of the default size
    this.frontPoint = new Two.Circle(0, 0, SETTINGS.point.drawn.radius.front);
    this.backPoint = new Two.Circle(0, 0, SETTINGS.point.drawn.radius.back);
    this.glowingFrontPoint = new Two.Circle(
      0,
      0,
      SETTINGS.point.drawn.radius.front + SETTINGS.point.glowing.annularWidth
    );
    this.glowingBackPoint = new Two.Circle(
      0,
      0,
      SETTINGS.point.drawn.radius.back + SETTINGS.point.glowing.annularWidth
    );

    //Set the path.id's for all the TwoJS objects which are not glowing. This is for exporting to Icon.
    this.frontPoint.id = 13000000 + SENodule.POINT_COUNT * 100 + 0;
    this.backPoint.id = 13000000 + SENodule.POINT_COUNT * 100 + 1;

    // Set the location of the points front/back/glowing/drawn
    // The location of all points front/back/glowing/drawn is controlled by the
    //  Two.Group that they are all members of. To translate the group is to translate all points

    this.glowingFrontPoint.translation = this.defaultScreenVectorLocation;
    this.frontPoint.translation = this.defaultScreenVectorLocation;
    this.glowingBackPoint.translation = this.defaultScreenVectorLocation;
    this.backPoint.translation = this.defaultScreenVectorLocation;

    // The points are not initially glowing but are visible for the temporary object
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = true;
    this.glowingBackPoint.visible = false;

    // Set the properties of the points that never change - stroke width and glowing options
    this.frontPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.front;
    this.backPoint.linewidth = SETTINGS.point.drawn.pointStrokeWidth.back;
    this.glowingFrontPoint.linewidth =
      SETTINGS.point.drawn.pointStrokeWidth.front;
    this.glowingBackPoint.linewidth =
      SETTINGS.point.drawn.pointStrokeWidth.back;
  }

  /**
   * Get and Set the location of the point in the Default Sphere, this also updates the display
   */
  set positionVector(idealUnitSphereVectorLocation: Vector3) {
    this._locationVector
      .copy(idealUnitSphereVectorLocation)
      .multiplyScalar(SETTINGS.boundaryCircle.radius);
    // Translate the whole group (i.e. all points front/back/glowing/drawn) to the new center vector
    this.defaultScreenVectorLocation.set(
      this._locationVector.x,
      this._locationVector.y
    );
    this.updateDisplay();
  }
  get positionVector(): Vector3 {
    return this._locationVector;
  }

  /**
   * The percent that the default radius point is scaled relative to the current magnification factor
   */
  get pointRadiusPercent(): number {
    if (this._locationVector.z < 0) {
      return this.dynamicBackStyle
        ? Nodule.contrastPointRadiusPercent(this.pointRadiusPercentFront)
        : this.pointRadiusPercentBack;
    } else {
      return this.pointRadiusPercentFront;
    }
  }

  frontGlowingDisplay(): void {
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = true;
    this.backPoint.visible = false;
    this.glowingBackPoint.visible = false;
  }

  backGlowingDisplay(): void {
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = true;
    this.glowingBackPoint.visible = true;
  }

  glowingDisplay(): void {
    if (this._locationVector.z > 0) {
      this.frontGlowingDisplay();
    } else {
      this.backGlowingDisplay();
    }
  }

  frontNormalDisplay(): void {
    this.frontPoint.visible = true;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = false;
    this.glowingBackPoint.visible = false;
  }

  backNormalDisplay(): void {
    this.frontPoint.visible = false;
    this.glowingFrontPoint.visible = false;
    this.backPoint.visible = true;
    this.glowingBackPoint.visible = false;
  }

  normalDisplay(): void {
    if (this._locationVector.z > 0) {
      this.frontNormalDisplay();
    } else {
      this.backNormalDisplay();
    }
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontPoint.addTo(layers[LAYER.foregroundPoints]);
    this.glowingFrontPoint.addTo(layers[LAYER.foregroundPointsGlowing]);
    this.backPoint.addTo(layers[LAYER.backgroundPoints]);
    this.glowingBackPoint.addTo(layers[LAYER.backgroundPointsGlowing]);
  }

  removeFromLayers(): void {
    this.frontPoint.remove();
    this.glowingFrontPoint.remove();
    this.backPoint.remove();
    this.glowingBackPoint.remove();
  }

  updateDisplay(): void {
    this.normalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontPoint.visible = false;
      this.glowingFrontPoint.visible = false;
      this.backPoint.visible = false;
      this.glowingBackPoint.visible = false;
    } else {
      this.normalDisplay();
    }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingFillColorFront = SETTINGS.style.selectedColor.front;
      this.glowingFillColorBack = SETTINGS.style.selectedColor.back;
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingFillColorFront = SETTINGS.point.glowing.fillColor.front;
      this.glowingFillColorBack = SETTINGS.point.glowing.fillColor.back;
      this.glowingStrokeColorFront = SETTINGS.point.glowing.strokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.point.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(options: StyleOptions): void {
    console.debug("Point: Update style of point using", options);
    if (options.panel === StyleEditPanels.Front) {
      // Set the front options
      if (options.pointRadiusPercent !== undefined) {
        // if the percent radius changes then the mutations changeStyle commit updates the object which can effect the location of the point's label
        this.pointRadiusPercentFront = options.pointRadiusPercent;
      }
      if (options.fillColor !== undefined) {
        this.fillColorFront = options.fillColor;
      }
      if (options.strokeColor !== undefined) {
        this.strokeColorFront = options.strokeColor;
      }
    } else if (options.panel === StyleEditPanels.Back) {
      // Set the back options
      // options.dynamicBackStyle is boolean, so we need to explicitly check for undefined otherwise
      // when it is false, this doesn't execute and this.dynamicBackStyle is not set
      if (options.dynamicBackStyle !== undefined) {
        this.dynamicBackStyle = options.dynamicBackStyle;
      }
      // overwrite the back options only in the case the dynamic style is not enabled
      if (!this.dynamicBackStyle !== undefined) {
        if (options.pointRadiusPercent) {
          // if the percent radius changes then the mutations changeStyle commit updates the object which can effect the location of the point's label
          this.pointRadiusPercentBack = options.pointRadiusPercent;
        }
        if (options.fillColor !== undefined) {
          this.fillColorBack = options.fillColor;
        }
        if (options.strokeColor !== undefined) {
          this.strokeColorBack = options.strokeColor;
        }
      }
    }
    // Now apply the style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }
  /**
   * Return the current style state
   */
  currentStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        return {
          panel: panel,
          pointRadiusPercent: this.pointRadiusPercentFront,
          strokeColor: this.strokeColorFront,
          fillColor: this.fillColorFront
        };
      }
      case StyleEditPanels.Back: {
        return {
          panel: panel,
          pointRadiusPercent: this.pointRadiusPercentBack,
          strokeColor: this.strokeColorBack,
          fillColor: this.fillColorBack,
          dynamicBackStyle: this.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }
  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        return {
          panel: panel,
          pointRadiusPercent: SETTINGS.point.radiusPercent.front,
          strokeColor: SETTINGS.point.drawn.strokeColor.front,
          fillColor: SETTINGS.point.drawn.fillColor.front
        };
        // Back
      }

      case StyleEditPanels.Back: {
        return {
          panel: panel,

          pointRadiusPercent: SETTINGS.point.dynamicBackStyle
            ? Nodule.contrastPointRadiusPercent(
                SETTINGS.point.radiusPercent.front
              )
            : SETTINGS.point.radiusPercent.back,

          strokeColor: SETTINGS.point.dynamicBackStyle
            ? Nodule.contrastStrokeColor(SETTINGS.point.drawn.strokeColor.front)
            : SETTINGS.point.drawn.strokeColor.back,

          fillColor: SETTINGS.point.dynamicBackStyle
            ? Nodule.contrastFillColor(SETTINGS.point.drawn.fillColor.front)
            : SETTINGS.point.drawn.fillColor.back,

          dynamicBackStyle: SETTINGS.point.dynamicBackStyle
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }
  /**
   * Sets the variables for point radius glowing/not
   */
  adjustSize(): void {
    this.frontPoint.scale =
      (Point.pointScaleFactor * this.pointRadiusPercentFront) / 100;

    this.backPoint.scale =
      (Point.pointScaleFactor *
        (this.dynamicBackStyle
          ? Nodule.contrastPointRadiusPercent(this.pointRadiusPercentFront)
          : this.pointRadiusPercentBack)) /
      100;

    this.glowingFrontPoint.scale =
      (Point.pointScaleFactor * this.pointRadiusPercentFront) / 100;

    this.glowingBackPoint.scale =
      (Point.pointScaleFactor *
        (this.dynamicBackStyle
          ? Nodule.contrastPointRadiusPercent(this.pointRadiusPercentFront)
          : this.pointRadiusPercentBack)) /
      100;
  }
  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the point
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.
        // FRONT
        if (SETTINGS.point.temp.fillColor.front === "noFill") {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = SETTINGS.point.temp.fillColor.front;
        }
        this.frontPoint.stroke = SETTINGS.point.temp.strokeColor.front;
        // strokeWidth is not user modifiable, strokeWidth is always the default drawn one
        // front pointRadiusPercent applied by adjustSize(); (accounts for zoom)

        // BACK
        if (SETTINGS.point.temp.fillColor.back === "noFill") {
          this.backPoint.noFill();
        } else {
          this.backPoint.fill = SETTINGS.point.temp.fillColor.back;
        }
        this.backPoint.stroke = SETTINGS.point.temp.strokeColor.back;
        // strokeWidth is not user modifiable, strokeWidth is always the default drawn one
        // back pointRadiusPercent applied by adjustSize(); (accounts for zoom)

        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.
        // FRONT
        if (this.fillColorFront === "noFill") {
          this.frontPoint.noFill();
        } else {
          this.frontPoint.fill = this.fillColorFront;
        }
        if (this.strokeColorFront == "noStroke") {
          this.frontPoint.noStroke();
        } else {
          this.frontPoint.stroke = this.strokeColorFront;
        }
        //stroke width is not user modifiable - set in the constructor
        // pointRadiusPercent applied by adjustSize();

        // BACK
        if (this.dynamicBackStyle) {
          if (Nodule.contrastFillColor(this.fillColorFront) === "noFill") {
            this.backPoint.noFill();
          } else {
            this.backPoint.fill = Nodule.contrastFillColor(this.fillColorFront);
          }
        } else {
          if (this.fillColorBack === "noFill") {
            this.backPoint.noFill();
          } else {
            this.backPoint.fill = this.fillColorBack;
          }
        }
        if (this.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(this.strokeColorFront) === "noStroke"
          ) {
            this.backPoint.noStroke();
          } else {
            this.backPoint.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
          }
        } else {
          if (this.strokeColorBack === "noStroke") {
            this.backPoint.noStroke();
          } else {
            this.backPoint.stroke = this.strokeColorBack;
          }
        }
        //stroke width is not user modifiable - set in the constructor
        // pointRadiusPercent applied by adjustSize();

        // FRONT Glowing
        if (this.glowingFillColorFront === "noFill") {
          this.glowingFrontPoint.noFill();
        } else {
          this.glowingFrontPoint.fill = this.glowingFillColorFront;
        }
        if (this.glowingStrokeColorBack === "noStroke") {
          this.glowingFrontPoint.noStroke();
        } else {
          this.glowingFrontPoint.stroke = this.glowingStrokeColorBack;
        }

        // points have no dashing

        // Back Glowing
        if (SETTINGS.point.glowing.fillColor.back === "noFill") {
          this.glowingBackPoint.noFill();
        } else {
          this.glowingBackPoint.fill = this.glowingFillColorBack;
        }
        if (this.glowingStrokeColorBack === "noStroke") {
          this.glowingBackPoint.noStroke();
        } else {
          this.glowingBackPoint.stroke = this.glowingStrokeColorBack;
        }

        // points have no dashing

        break;
      }
    }
  }
}
