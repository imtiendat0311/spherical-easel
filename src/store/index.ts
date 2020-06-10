/** @format */

import Vue from "vue";
import Vuex from "vuex";
import Two from "two.js";
import { AppState } from "@/types";
import Point from "@/plottables/Point";
import Circle from "@/plottables/Circle";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { Vector3, Matrix4 } from "three";

Vue.use(Vuex);

const findPoint = (arr: SEPoint[], id: number): SEPoint | null => {
  const out = arr.filter(v => v.ref.id === id);
  return out.length > 0 ? out[0] : null;
};

const SMALL_ENOUGH = 1e-2;
const PIXEL_CLOSE_ENOUGH = 8;
const ANGLE_SMALL_ENOUGH = 1; // within 1 degree?
const tmpMatrix = new Matrix4();
const initialState = {
  sphere: null,
  sphereRadius: 0,
  editMode: "rotate",
  // slice(): create a copy of the array
  transformMatElements: tmpMatrix.elements.slice(),
  // nodes: [], // Possible future addition (array of SENode)
  points: [],
  lines: [],
  circles: []
};
export default new Vuex.Store({
  state: initialState,
  mutations: {
    init(state: AppState): void {
      state = { ...initialState };
    },
    setSphere(state: AppState, sph: Two.Group): void {
      state.sphere = sph;
    },
    setSphereRadius(state: AppState, radius: number): void {
      state.sphereRadius = radius;
    },
    setEditMode(state: AppState, mode: string): void {
      state.editMode = mode;
    },
    addPoint(state: AppState, point: SEPoint): void {
      state.points.push(point);
      state.sphere?.add(point.ref);
    },
    removePoint(state: AppState, pointId: number): void {
      const pos = state.points.findIndex(x => x.id === pointId);
      if (pos >= 0) {
        state.points[pos].ref.remove();
        state.points.splice(pos, 1);
      }
    },
    addLine(
      state: AppState,
      {
        line
      }: /*startPoint,
        endPoint*/
      { line: SELine /*; startPoint: Point; endPoint: Point */ }
    ): void {
      // Find both end points in the current list of points
      // const start = findPoint(state.points, startPoint.id);
      // const end = findPoint(state.points, endPoint.id);
      // if (start !== null && end !== null) {
      //   const newLine = { ref: line, start, end, isSegment: line.isSegment };
      // start.startOf.push(newLine);
      // end.endOf.push(newLine);
      state.lines.push(line);
      state.sphere?.add(line.ref);
      // }
    },
    removeLine(state: AppState, lineId: number): void {
      const pos = state.lines.findIndex(x => x.id === lineId);
      if (pos >= 0) {
        /* victim line is found */
        const victimLine: SELine = state.lines[pos];

        // Locate the start point of this victim line
        // const sPointPos = state.points.findIndex(
        //   v => v.ref.id == victimLine.start.ref.id
        // );
        // if (sPointPos >= 0) {
        //   const pos = state.points[sPointPos].startOf.findIndex(
        //     (z: SELine) => z.ref.id === victimLine.ref.id
        //   );
        //   if (pos >= 0) state.points[sPointPos].startOf.splice(pos, 1);
        // }

        // Locate the end point of this victim line
        // const ePointPos = state.points.findIndex(
        //   v => v.ref.id == victimLine.end.ref.id
        // );
        // if (ePointPos >= 0) {
        //   const pos = state.points[ePointPos].endOf.findIndex(
        //     (z: SELine) => z.ref.id === victimLine.ref.id
        //   );
        //   if (pos >= 0) state.points[ePointPos].endOf.splice(pos, 1);
        // }
        // Remove it from the sphere
        victimLine.ref.remove();

        state.lines.splice(pos, 1); // Remove the line from the list
      }
    },
    addCircle(
      state: AppState,
      {
        circle,
        centerPoint,
        circlePoint
      }: { circle: Circle; centerPoint: Point; circlePoint: Point }
    ): void {
      const start = findPoint(state.points, centerPoint.id);
      const end = findPoint(state.points, circlePoint.id);
      if (start !== null && end !== null) {
        const newCircle = { ref: circle, center: start, point: end };
        // start.centerOf.push(newCircle);
        // end.circumOf.push(newCircle);
        // state.circles.push(newCircle);
        // state.sphere?.add(circle);
      }
    },
    removeCircle(state: AppState, circleId: string): void {
      // FIXME
      const circlePos = -1; //state.circles.findIndex(x => x.ref.id === circleId);
      if (circlePos >= 0) {
        /* victim line is found */
        const victimCircle: SECircle = state.circles[circlePos];

        // Locate the start point of this victim line
        const sPointPos = state.points.findIndex(
          v => v.ref.id == victimCircle.center.ref.id
        );
        if (sPointPos >= 0) {
          // const spos = state.points[sPointPos].centerOf.findIndex(
          //   (r: SECircle) => r.ref.id === victimCircle.ref.id
          // );
          // if (spos >= 0) state.points[sPointPos].circumOf.splice(spos, 1);
        }

        // Locate the end point of this victim line
        const ePointPos = state.points.findIndex(
          v => v.ref.id == victimCircle.point.ref.id
        );
        if (ePointPos >= 0) {
          // const epos = state.points[ePointPos].circumOf.findIndex(
          //   (r: SECircle) => r.ref.id === victimCircle.ref.id
          // );
          // if (epos >= 0) state.points[ePointPos].circumOf.splice(epos, 1);
        }
        // Remove it from the sphere
        victimCircle.ref.remove();

        state.circles.splice(circlePos, 1); // Remove the line from the list
      }
    },
    setTransformation(state: AppState, m: Matrix4): void {
      debugger; //eslint-disable-line
      m.toArray(state.transformMatElements);
    }
  },
  actions: {
    /* Define async work in this block */
  },
  getters: {
    /* The following is just a starter code.  More work needed */

    /** Find nearby points by checking the distance in the ideal sphere
     * or screen distance (in pixels)
     */
    findNearbyPoints: (state: AppState) => (
      idealPosition: Vector3,
      screenPosition: Two.Vector
    ): SEPoint[] => {
      return state.points.filter(p => {
        const distanceInUnitSphere = p.positionOnSphere.distanceTo(
          idealPosition
        );
        const distanceOnScreen = p.ref.translation.distanceTo(screenPosition);
        // console.debug(
        //   `Distance to SEPoint ${p.id}: ideal ${distanceInUnitSphere} screen ${distanceOnScreen}`
        // );
        return (
          distanceInUnitSphere < SMALL_ENOUGH ||
          distanceOnScreen < PIXEL_CLOSE_ENOUGH
        );
      });
    },

    /** When a point is on a geodesic circle, it has to be perpendicular to
     * the normal direction of that circle */
    findNearbyLines: (state: AppState) => (
      idealPosition: Vector3,
      screenPosition: Two.Vector
    ): SELine[] => {
      return state.lines.filter((z: SELine) => {
        const angleToNormal = z.normalDirection.angleTo(idealPosition);
        // console.debug(
        //   `Line ${z.id} angle between ${idealPosition.toFixed(
        //     2
        //   )} and ${z.normalDirection.toFixed(
        //     2
        //   )} is ${angleToNormal.toDegrees().toFixed(2)}`
        // );
        return Math.abs(angleToNormal - Math.PI / 2) < ANGLE_SMALL_ENOUGH;
      });
    },
    forwardTransform: (state: AppState): Matrix4 => {
      tmpMatrix.fromArray(state.transformMatElements);
      return tmpMatrix;
    },
    inverseTransform: (state: AppState): Matrix4 => {
      tmpMatrix.fromArray(state.transformMatElements);
      return tmpMatrix.getInverse(tmpMatrix);
    }
  }
});
