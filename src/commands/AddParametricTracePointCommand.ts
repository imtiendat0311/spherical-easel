import { Command } from "./Command";
import { SavedNames } from "@/types";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import Point from "@/plottables/Point";
import Label from "@/plottables/Label";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
import { SEParametric } from "@/models/SEParametric";
import { StyleEditPanels } from "@/types/Styles";

export class AddParametricTracePointCommand extends Command {
  private seTracePoint: SEParametricTracePoint;
  private parametricParent: SEParametric;
  private seTraceLabel: SELabel;
  constructor(
    parametricParent: SEParametric,
    tracePoint: SEParametricTracePoint,
    traceLabel: SELabel
  ) {
    super();
    this.parametricParent = parametricParent;
    this.seTracePoint = tracePoint;
    this.seTraceLabel = traceLabel;
  }

  do(): void {
    this.parametricParent.registerChild(this.seTracePoint);
    this.seTracePoint.registerChild(this.seTraceLabel);
    if (SETTINGS.point.showLabelsOfParametricEndPointsInitially) {
      this.seTraceLabel.showing = true;
    } else {
      this.seTraceLabel.showing = false;
    }
    Command.store.addPoint(this.seTracePoint);
    Command.store.addLabel(this.seTraceLabel);
    // Set the label to display the name of the point in visible count order
    this.seTracePoint.pointVisibleBefore = true;
    if (this.seTracePoint.label) {
      this.seTracePoint.incrementVisiblePointCount();
      this.seTracePoint.label.ref.shortUserName = `P${this.seTracePoint.visiblePointCount}`;
    }
    this.seTracePoint.markKidsOutOfDate();
    this.seTracePoint.update();
  }

  saveState(): void {
    // No code needed here
  }

  restoreState(): void {
    if (this.seTracePoint.label) {
      this.seTracePoint.decrementVisiblePointCount();
      this.seTracePoint.label.ref.shortUserName = `P${this.seTracePoint.visiblePointCount}`;
    }
    this.seTracePoint.pointVisibleBefore = false;
    Command.store.removeLabel(this.seTraceLabel.id);
    Command.store.removePoint(this.seTracePoint.id);
    this.seTracePoint.unregisterChild(this.seTraceLabel);
    this.parametricParent.unregisterChild(this.seTracePoint);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddParametricTracePoint",
      //Parent Info
      "parametricEndPointParametricParentName=" +
        Command.symbolToASCIIDec(this.parametricParent.name),
      //TracePoint Info
      "parametricEndPointseTracePointName=" +
        Command.symbolToASCIIDec(this.seTracePoint.name),
      "parametricEndPointseTracePointLocationVector=" +
        this.seTracePoint.locationVector.toFixed(9),
      "parametricEndPointseTracePointShowing=" + this.seTracePoint.showing,
      "parametricEndPointseTracePointExists=" + this.seTracePoint.exists,
      "parametricEndPointseTracePointFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTracePoint.ref.currentStyleState(StyleEditPanels.Front)
          )
        ),
      "parametricEndPointseTracePointBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTracePoint.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),

      //Trace Point Label Info
      "parametricEndPointseTraceLabelName=" +
        Command.symbolToASCIIDec(this.seTraceLabel.name),
      "parametricEndPointseTraceLabelLocationVector=" +
        this.seTraceLabel.locationVector.toFixed(9),
      "parametricEndPointseTraceLabelShowing=" + this.seTraceLabel.showing,
      "parametricEndPointseTraceLabelExists=" + this.seTraceLabel.exists,
      "parametricEndPointseTraceLabelLabelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seTraceLabel.ref.currentStyleState(StyleEditPanels.Label)
          )
        )
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });
    const parametricParent = objMap.get(
      propMap.get("parametricEndPointParametricParentName") ?? ""
    ) as SEParametric | undefined;

    if (parametricParent !== undefined) {
      // make the Trace Point
      const tracePoint = new Point();
      const seTracePoint = new SEParametricTracePoint(
        tracePoint,
        parametricParent
      );
      const seTracePointLocation = new Vector3();
      seTracePointLocation.from(
        propMap.get("parametricEndPointseTracePointLocationVector")
      ); // convert to vector
      seTracePoint.locationVector.copy(seTracePointLocation);
      const pointFrontStyleString = propMap.get(
        "parametricEndPointseTracePointFrontStyle"
      );
      if (pointFrontStyleString !== undefined)
        tracePoint.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(pointFrontStyleString)
        );
      const pointBackStyleString = propMap.get(
        "parametricEndPointseTracePointBackStyle"
      );
      if (pointBackStyleString !== undefined)
        tracePoint.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(pointBackStyleString)
        );

      // make the Trace Point Label
      const tracePointLabel = new Label("point");
      const seTracePointLabel = new SELabel(tracePointLabel, seTracePoint);
      const seTracePointLabelLocation = new Vector3();
      seTracePointLabelLocation.from(
        propMap.get("parametricEndPointseTraceLabelLocationVector")
      ); // convert to vector
      seTracePointLabel.locationVector.copy(seTracePointLabelLocation);
      const labelStyleString = propMap.get(
        "parametricEndPointseTraceLabelLabelStyle"
      );
      if (labelStyleString !== undefined) {
        tracePointLabel.updateStyle(
          StyleEditPanels.Label,
          JSON.parse(labelStyleString)
        );
      }

      //put the Trace Point in the object map
      if (propMap.get("parametricEndPointseTracePointName") !== undefined) {
        seTracePoint.name =
          propMap.get("parametricEndPointseTracePointName") ?? "";
        seTracePoint.showing =
          propMap.get("parametricEndPointseTracePointShowing") === "true";
        seTracePoint.exists =
          propMap.get("parametricEndPointseTracePointExists") === "true";
        objMap.set(seTracePoint.name, seTracePoint);
      } else {
        throw new Error(
          "AddParametricTracePoint: Trace Point Name doesn't exist"
        );
      }

      //put the Trace Point label in the object map
      if (propMap.get("parametricEndPointseTraceLabelName") !== undefined) {
        seTracePointLabel.name =
          propMap.get("parametricEndPointseTraceLabelName") ?? "";
        seTracePointLabel.showing =
          propMap.get("parametricEndPointseTraceLabelShowing") === "true";
        seTracePointLabel.exists =
          propMap.get("parametricEndPointseTraceLabelExists") === "true";
        objMap.set(seTracePointLabel.name, seTracePointLabel);
      } else {
        throw new Error(
          "AddParametricTracePoint: Trace Point Label Name doesn't exist"
        );
      }

      return new AddParametricTracePointCommand(
        parametricParent,
        seTracePoint,
        seTracePointLabel
      );
    } else {
      throw new Error(
        `AddParametricTracePoint: parametric parent ${parametricParent} is undefined`
      );
    }
  }
}
