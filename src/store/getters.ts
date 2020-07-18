import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SELine } from "@/models/SELine";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import {
  AppState,
  IntersectionReturnType,
  SEIntersectionReturnType
} from "@/types";
import { Vector3 } from "three";
import Two, { Vector } from "two.js";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";

const PIXEL_CLOSE_ENOUGH = 8;

/**
 * The vectors to the centers of the circles
 */
const center1 = new Vector3();
const center2 = new Vector3();
/**
 * The vector perpendicular to both center vectors
 */
const normal = new Vector3();
/**
 * The vector so that normal, center1| center2, toVector form an orthonormal frame
 */
const toVector = new Vector3();
/**
 * The positive intersection vector (if it exists)
 */
const positiveIntersection = new Vector3();
/**
 * The negative intersection vector (if it exists)
 */
const negativeIntersection = new Vector3();
/**
 * A temporary vector used to help with the calculation of the intersection points
 * It is the projection of the intersection point (along the sphere) to the plane containing the centers of circles
 */
const tempVec = new Vector3();
const tempVec1 = new Vector3();
const tempVec2 = new Vector3();
/**
 * Returns true if vec is on vectorList, false otherwise
 * This is used to tell if an SEIntersectionPoint is going to be created on top of an existing SEPointOnOneDimensional,
 * If this returns true, then the SEIntersectionPoint is not created.
 * @param vec The search vector
 * @param vectorList The list of vectors
 */
function vectorOnList(vec: Vector3, vectorList: Vector3[]) {
  return vectorList.some(v => tempVec.subVectors(vec, v).isZero());
}

/**
 * Return an ordered list of IntersectionReturnType (i.e. a vector location and exists flag) for the
 * intersection of two lines. This must be called with the lines in alphabetical order in order to the
 * return type correct.
 * @param lineOne An SELine
 * @param lineTwo An SELine
 */
function intersectLineWithLine(
  lineOne: SELine,
  lineTwo: SELine
): IntersectionReturnType[] {
  const returnItems = [];
  console.debug("Create 2 new Vector3()");
  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };

  // Plus and minus the cross product of the normal vectors are the intersection vectors
  tempVec.crossVectors(lineOne.normalVector, lineTwo.normalVector).normalize();
  intersection1.vector.copy(tempVec);
  intersection2.vector.copy(tempVec.multiplyScalar(-1));

  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    tempVec.addVectors(lineOne.normalVector, lineTwo.normalVector).isZero() ||
    tempVec.subVectors(lineOne.normalVector, lineTwo.normalVector).isZero()
  ) {
    intersection1.exists = false;
    intersection2.exists = false;
  }
  returnItems.push(intersection1);
  returnItems.push(intersection2);
  return returnItems;
}

/**
 * Computes the intersection point(s) of a line and a segment, the line is always first
 * @param line An SELine
 * @param segment An SESegment
 */
function intersectLineWithSegment(
  line: SELine,
  segment: SESegment
): IntersectionReturnType[] {
  const returnItems = [];
  console.debug("Create 2 new Vector3()");
  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  // Plus and minus the cross product of the normal vectors are the possible intersection vectors

  tempVec1.crossVectors(line.normalVector, segment.normalVector).normalize();
  tempVec2.copy(tempVec1).multiplyScalar(-1);
  intersection1.vector.copy(tempVec1);
  intersection2.vector.copy(tempVec2);

  // determine if the first intersection point is on the segment
  if (!segment.onSegment(tempVec1)) {
    intersection1.exists = false;
  }
  // Determine if the second intersection point is on the segment
  if (!segment.onSegment(tempVec2)) {
    intersection2.exists = false;
  }
  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    tempVec.addVectors(line.normalVector, segment.normalVector).isZero() ||
    tempVec.subVectors(line.normalVector, segment.normalVector).isZero()
  ) {
    intersection1.exists = false;
    intersection2.exists = false;
  }

  returnItems.push(intersection1);
  returnItems.push(intersection2);
  return returnItems;
}

/**
 * Find intersection between a line and a circle, the line is always first
 * @param line An SELine
 * @param circle An SESegment
 */
function intersectLineWithCircle(
  line: SELine,
  circle: SECircle
  // layer: Two.Group
): IntersectionReturnType[] {
  // Use the circle circle intersection
  return intersectCircles(
    line.normalVector,
    Math.PI / 2, // arc radius of lines
    circle.centerSEPoint.locationVector,
    circle.circleRadius
  );
}
/**
 * Find intersection between a two segment. This must be called with the lines in alphabetical order in order to the
 * return type correct.
 * @param segment1 An SESegment
 * @param segment2 An SESegment
 */
function intersectSegmentWithSegment(
  segment1: SESegment,
  segment2: SESegment
): IntersectionReturnType[] {
  const returnItems = [];
  console.debug("Create 2 new Vector3()");
  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  // Plus and minus the cross product of the normal vectors are the possible intersection vectors
  tempVec1
    .crossVectors(segment1.normalVector, segment2.normalVector)
    .normalize();
  tempVec2.copy(tempVec1).multiplyScalar(-1);
  intersection1.vector.copy(tempVec1);
  intersection2.vector.copy(tempVec2);

  // determine if the first intersection point is on the segment
  if (!segment1.onSegment(tempVec1) || !segment2.onSegment(tempVec1)) {
    intersection1.exists = false;
  }
  // Determine if the second intersection point is on the segment
  if (!segment1.onSegment(tempVec2) || !segment2.onSegment(tempVec2)) {
    intersection2.exists = false;
  }
  // If the normal vectors are on top of each other or antipodal, exists is false
  if (
    tempVec.addVectors(segment1.normalVector, segment2.normalVector).isZero() ||
    tempVec.subVectors(segment1.normalVector, segment2.normalVector).isZero()
  ) {
    intersection1.exists = false;
    intersection2.exists = false;
  }
  returnItems.push(intersection1);
  returnItems.push(intersection2);
  return returnItems;
}

/**
 * Find intersection between a segment and a circle, the segment is always first
 * @param segment An SESegment
 * @param circle An SECircle
 */
function intersectSegmentWithCircle(
  segment: SESegment,
  circle: SECircle
): IntersectionReturnType[] {
  // Use the circle circle intersection
  const temp = intersectCircles(
    segment.normalVector,
    Math.PI / 2, // arc radius of lines
    circle.centerSEPoint.locationVector,
    circle.circleRadius
  );

  // If the segment and the circle don't intersect, the return vector is the zero vector and this shouldn't be passed to the onSegment because that method expects a unit vector
  temp.forEach(item => {
    if (item.vector.isZero()) {
      item.exists = false;
    } else {
      item.exists = segment.onSegment(item.vector);
    }
  });
  return temp;
}

/**
 * Find intersection points between two circles.
 * The order *matter* intersectCircleWithCircle(C1,r1,C2,r2) is not intersectCircleWithCircle(C2,r2,C1,r1)
 * Always call this with the circles in alphabetical order
 * The array is a list of the intersections positive then negative.
 * @param n1 center vector of the first circle
 * @param arc1 arc length radius of the first circle
 * @param n2 center vector of the second circle
 * @param arc2 arc length radius of the second circle
 */
function intersectCircles(
  n1: Vector3, // center
  arc1: number, // arc radius
  n2: Vector3,
  arc2: number
): IntersectionReturnType[] {
  //Initialize the items and the return items
  const returnItems = [];
  console.debug("Create 2 new Vector3()");
  const intersection1: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };
  const intersection2: IntersectionReturnType = {
    vector: new Vector3(),
    exists: true
  };

  //Convert to the case where all arc lengths are less than Pi/2
  let radius1 = arc1;
  center1.copy(n1).normalize();
  if (arc1 > Math.PI / 2) {
    radius1 = Math.PI - radius1;
    center1.multiplyScalar(-1);
  }
  let radius2 = arc2;
  center2.copy(n2).normalize();
  if (arc2 > Math.PI / 2) {
    radius2 = Math.PI - radius2;
    center2.multiplyScalar(-1);
  }

  // distance between the two centers
  const centerDistance = center1.angleTo(center2); // distance between the two centers

  // The circles intersect if and only if the three lengths have the property that each is less than the sum of the other two (by the converse to the spherical triangle inequality)
  if (
    centerDistance < radius1 + radius2 &&
    radius1 < centerDistance + radius2 &&
    radius2 < centerDistance + radius1
  ) {
    // The circles intersect
    // Form the normal that points on the positive side of the intersections
    normal.crossVectors(center1, center2).normalize();
    // semi-perimeter = sum of the length of the triangle/2
    const s = (radius1 + radius2 + centerDistance) / 2;
    // Compute the angle opposite the radius1 side. See M'Clelland & Preston. A treatise on
    // spherical trigonometry with applications to spherical geometry and numerous
    // examples - Part 1. 1907 page 114 Article 60 Case 1
    //
    //   . = positive intersection point
    //   \ \
    //    \   \
    //     \     \
    //      \       \radius2
    //       \radius1  \
    //        \_________A__\
    //          <- cenDist->

    const A =
      2 *
      Math.atan(
        Math.sqrt(
          (Math.sin(s - centerDistance) * Math.sin(s - radius2)) /
            (Math.sin(s) * Math.sin(s - radius1))
        )
      );
    // There are two cases:
    // 0 < A < Pi/2
    //  .  (positive intersection point)
    //  |\ \
    //  | \   \
    //  |  \     \
    // a|   \       \radius2
    //  |    \radius1  \
    //  |_____\_________A__\
    //   <-------  b ------>
    //          <- cenDist->

    //  Pi/2 < A < Pi (which is marked by A = arctan(...) < 0 so A is really arctan(...) + Pi  )
    //
    //  .  (negative intersection point)
    //  |\ \
    //  | \   \
    //  |  \     \
    // a|   \       \radius1
    //  |    \radius2  \
    //  |___A'_\A_________\
    //   <- b -><- cenDist->

    let a: number;
    let b: number;
    if (A > 0) {
      // Analyze the right triangle with hypotenuse radius2 and adjacent angle A'=A > 0
      // By page 85 Eq (3)
      a = Math.asin(Math.sin(radius2) * Math.sin(A));
      // By page 85 Eq (2)
      b = Math.atan(Math.tan(radius2) * Math.cos(A));

      // Create the toVector so that center2, normal, and toVector are an orthonormal frame
      toVector.crossVectors(center2, normal).normalize();
    } else {
      // Analyze the right triangle with hypotenuse radius2 and adjacent angle A'= Pi-A > 0
      // By page 85 Eq (3)
      a = Math.asin(Math.sin(radius2) * Math.sin(Math.PI - A));
      // By page 85 Eq (2)
      b = Math.atan(Math.tan(radius2) * Math.cos(Math.PI - A));
      // Create the toVector so that center2, normal, and toVector are an orthonormal frame
      toVector.crossVectors(normal, center2).normalize();
    }
    // tempVec= cos(b)*center2 + sin(b)*toVector is the projection of the intersections to the plane containing the centers of the circles
    tempVec.copy(center2).multiplyScalar(Math.cos(b));
    tempVec.addScaledVector(toVector, Math.sin(b));

    // The positive intersection is cos(a)*tempVec + sin(a)*normal
    intersection1.vector.copy(tempVec).multiplyScalar(Math.cos(a));
    intersection1.vector.addScaledVector(normal, Math.sin(a));
    // The negative intersection is cos(-a)*tempVec + sin(-a)*normal
    intersection2.vector.copy(tempVec).multiplyScalar(Math.cos(-a));
    intersection2.vector.addScaledVector(normal, Math.sin(-a));
    returnItems.push(intersection1);
    returnItems.push(intersection2);
    return returnItems;
  } else {
    // The circles do not intersect
    intersection1.exists = false;
    intersection2.exists = false;
    returnItems.push(intersection1);
    returnItems.push(intersection2);
    return returnItems;
  }
}

export default {
  findNearbyObjects: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SENodule[] => {
    return state.nodules.filter(obj => obj.isHitAt(unitIdealVector));
  },
  /** Find nearby points by checking the distance in the ideal sphere
   * or screen distance (in pixels)
   */
  findNearbyPoints: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SEPoint[] => {
    return state.points.filter(
      p =>
        p.isHitAt(unitIdealVector) &&
        p.ref.defaultScreenVectorLocation.distanceTo(screenPosition) <
          PIXEL_CLOSE_ENOUGH
    );
  },

  /** When a point is on a geodesic circle, it has to be perpendicular to
   * the normal direction of that circle */
  findNearbyLines: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SELine[] => {
    return state.lines.filter((z: SELine) => z.isHitAt(unitIdealVector));
  },
  findNearbySegments: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SESegment[] => {
    return state.segments.filter((z: SESegment) => z.isHitAt(unitIdealVector));
  },
  findNearbyCircles: (state: AppState) => (
    unitIdealVector: Vector3,
    screenPosition: Two.Vector
  ): SECircle[] => {
    return state.circles.filter((z: SECircle) => z.isHitAt(unitIdealVector));
  },
  // forwardTransform: (state: AppState): Matrix4 => {
  //   tmpMatrix.fromArray(state.transformMatElements);
  //   return tmpMatrix;
  // },
  // inverseTransform: (state: AppState): Matrix4 => {
  //   tmpMatrix.fromArray(state.transformMatElements);
  //   return tmpMatrix.getInverse(tmpMatrix);
  // },
  createAllIntersectionsWithLine: (state: AppState) => (
    newLine: SELine
  ): SEIntersectionReturnType[] => {
    // Avoid creating an intersection where any SEPoint already exists
    const avoidVectors: Vector3[] = [];
    // First add the two parent points of the newLine, if they are new, then
    //  they won't have been added to the state.points array yet so add them first
    avoidVectors.push(newLine.startSEPoint.locationVector);
    avoidVectors.push(newLine.endSEPoint.locationVector);
    state.points.forEach(pt => avoidVectors.push(pt.locationVector));

    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];

    // Intersect this new line with all old lines
    state.lines
      .filter((line: SELine) => line.id !== newLine.id) // ignore self
      .forEach((oldLine: SELine) => {
        const intersectionInfo = intersectLineWithLine(oldLine, newLine);
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            console.debug("made intersection");
            const newPt = new Point();
            newPt.stylize(DisplayStyle.TEMPORARY);
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldLine,
              newLine,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldLine,
              parent2: newLine
            });
          }
        });
      });
    //Intersect this new line with all old segments
    state.segments.forEach((oldSegment: SESegment) => {
      const intersectionInfo = intersectLineWithSegment(newLine, oldSegment);
      intersectionInfo.forEach((info, index) => {
        if (
          !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
        ) {
          // info.vector is not on the avoidVectors array, so create an intersection
          const newPt = new Point();
          newPt.stylize(DisplayStyle.TEMPORARY);
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            newLine,
            oldSegment,
            index,
            false
          );
          newSEIntersectionPt.locationVector = info.vector;
          newSEIntersectionPt.exists = info.exists;
          intersectionPointList.push({
            SEIntersectionPoint: newSEIntersectionPt,
            parent1: newLine,
            parent2: oldSegment
          });
        }
      });
    });
    //Intersect this new line with all old circles
    state.circles.forEach((oldCircle: SECircle) => {
      const intersectionInfo = intersectLineWithCircle(newLine, oldCircle);
      intersectionInfo.forEach((info, index) => {
        if (
          !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
        ) {
          // info.vector is not on the avoidVectors array, so create an intersection
          const newPt = new Point();
          newPt.stylize(DisplayStyle.TEMPORARY);
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            newLine,
            oldCircle,
            index,
            false
          );
          newSEIntersectionPt.locationVector = info.vector;
          newSEIntersectionPt.exists = info.exists;
          intersectionPointList.push({
            SEIntersectionPoint: newSEIntersectionPt,
            parent1: newLine,
            parent2: oldCircle
          });
        }
      });
    });
    return intersectionPointList;
  },
  createAllIntersectionsWithSegment: (state: AppState) => (
    newSegment: SESegment
  ): SEIntersectionReturnType[] => {
    // Avoid creating an intersection where any SEPoint already exists
    const avoidVectors: Vector3[] = [];
    // First add the two parent points of the newLine, if they are new, then
    //  they won't have been added to the state.points array yet so add them first
    avoidVectors.push(newSegment.startSEPoint.locationVector);
    avoidVectors.push(newSegment.endSEPoint.locationVector);
    state.points.forEach(pt => avoidVectors.push(pt.locationVector));

    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];
    // Intersect this new segment with all old lines
    state.lines.forEach((oldLine: SELine) => {
      const intersectionInfo = intersectLineWithSegment(oldLine, newSegment);
      intersectionInfo.forEach((info, index) => {
        if (
          !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
        ) {
          // info.vector is not on the avoidVectors array, so create an intersection
          const newPt = new Point();
          newPt.stylize(DisplayStyle.TEMPORARY);
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            oldLine,
            newSegment,
            index,
            false
          );
          newSEIntersectionPt.locationVector = info.vector;
          newSEIntersectionPt.exists = info.exists;

          intersectionPointList.push({
            SEIntersectionPoint: newSEIntersectionPt,
            parent1: oldLine,
            parent2: newSegment
          });
        }
      });
    });
    //Intersect this new segment with all old segments
    state.segments
      .filter((segment: SESegment) => segment.id !== newSegment.id) // ignore self
      .forEach((oldSegment: SESegment) => {
        const intersectionInfo = intersectSegmentWithSegment(
          oldSegment,
          newSegment
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
          ) {
            const newPt = new Point();
            newPt.stylize(DisplayStyle.TEMPORARY);
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldSegment,
              newSegment,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldSegment,
              parent2: newSegment
            });
          }
        });
      });
    //Intersect this new segment with all old circles
    state.circles.forEach((oldCircle: SECircle) => {
      const intersectionInfo = intersectSegmentWithCircle(
        newSegment,
        oldCircle
      );
      intersectionInfo.forEach((info, index) => {
        if (
          !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
        ) {
          // info.vector is not on the avoidVectors array, so create an intersection
          const newPt = new Point();
          newPt.stylize(DisplayStyle.TEMPORARY);
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            newSegment,
            oldCircle,
            index,
            false
          );
          newSEIntersectionPt.locationVector = info.vector;
          newSEIntersectionPt.exists = info.exists;
          intersectionPointList.push({
            SEIntersectionPoint: newSEIntersectionPt,
            parent1: newSegment,
            parent2: oldCircle
          });
        }
      });
    });
    return intersectionPointList;
  },

  createAllIntersectionsWithCircle: (state: AppState) => (
    newCircle: SECircle
  ): SEIntersectionReturnType[] => {
    // Avoid creating an intersection where any SEPoint already exists
    const avoidVectors: Vector3[] = [];
    // First add the two parent points of the newLine, if they are new, then
    //  they won't have been added to the state.points array yet so add them first
    avoidVectors.push(newCircle.centerSEPoint.locationVector);
    avoidVectors.push(newCircle.circleSEPoint.locationVector);
    state.points.forEach(pt => avoidVectors.push(pt.locationVector));
    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];
    // Intersect this new circle with all old lines
    state.lines.forEach((oldLine: SELine) => {
      const intersectionInfo = intersectLineWithCircle(oldLine, newCircle);
      intersectionInfo.forEach((info, index) => {
        if (
          !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
        ) {
          // info.vector is not on the avoidVectors array, so create an intersection
          const newPt = new Point();
          newPt.stylize(DisplayStyle.TEMPORARY);
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            oldLine,
            newCircle,
            index,
            false
          );
          newSEIntersectionPt.locationVector = info.vector;
          newSEIntersectionPt.exists = info.exists;
          intersectionPointList.push({
            SEIntersectionPoint: newSEIntersectionPt,
            parent1: oldLine,
            parent2: newCircle
          });
        }
      });
    });
    //Intersect this new circle with all old segments
    state.segments.forEach((oldSegment: SESegment) => {
      const intersectionInfo = intersectSegmentWithCircle(
        oldSegment,
        newCircle
      );
      intersectionInfo.forEach((info, index) => {
        if (
          !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
        ) {
          // info.vector is not on the avoidVectors array, so create an intersection
          const newPt = new Point();
          newPt.stylize(DisplayStyle.TEMPORARY);
          const newSEIntersectionPt = new SEIntersectionPoint(
            newPt,
            oldSegment,
            newCircle,
            index,
            false
          );
          newSEIntersectionPt.locationVector = info.vector;
          newSEIntersectionPt.exists = info.exists;
          intersectionPointList.push({
            SEIntersectionPoint: newSEIntersectionPt,
            parent1: oldSegment,
            parent2: newCircle
          });
        }
      });
    });
    //Intersect this new circle with all old circles
    state.circles
      .filter((circle: SECircle) => circle.id !== newCircle.id) // ignore self
      .forEach((oldCircle: SECircle) => {
        const intersectionInfo = intersectCircles(
          oldCircle.centerSEPoint.locationVector,
          oldCircle.circleRadius,
          newCircle.centerSEPoint.locationVector,
          newCircle.circleRadius
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v => tempVec.subVectors(info.vector, v).isZero())
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new Point();
            newPt.stylize(DisplayStyle.TEMPORARY);
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldCircle,
              newCircle,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldCircle,
              parent2: newCircle
            });
          }
        });
      });
    return intersectionPointList;
  },
  /**
   * Create the intersection of two one-dimensional objects
   * Make sure the SENodules are in the correct order: SELines, SESegments, then SECircles.
   * That the (one,two) pair is one of:
   *  (SELine,SELine), (SELine,SESegment), (SELine,SECircle), (SESegment, SESegment),
   *      (SESegment, SECircle), (SECircle, SECircle)
   * If they have the same type put them in alphabetical order.
   * The creation of the intersection objects automatically follows this convention in assigning parents.
   */
  intersectTwoObjects: (state: AppState) => (
    one: SENodule,
    two: SENodule
  ): IntersectionReturnType[] => {
    if (one instanceof SELine) {
      if (two instanceof SELine) return intersectLineWithLine(one, two);
      else if (two instanceof SESegment)
        return intersectLineWithSegment(one, two);
      else if (two instanceof SECircle)
        return intersectLineWithCircle(one, two);
    } else if (one instanceof SESegment) {
      if (two instanceof SESegment)
        return intersectSegmentWithSegment(one, two);
      else if (two instanceof SECircle)
        return intersectSegmentWithCircle(one, two);
    } else if (one instanceof SECircle && two instanceof SECircle)
      return intersectCircles(
        one.centerSEPoint.locationVector,
        one.circleRadius,
        two.centerSEPoint.locationVector,
        two.circleRadius
      );
    throw "Attempted to intersect a non-dimensional object";
  },
  findIntersectionPointsStartingWith: (state: AppState) => (
    prefix: string
  ): SEIntersectionPoint[] => {
    return state.points
      .filter(p => p instanceof SEIntersectionPoint && p.name.includes(prefix))
      .map(obj => obj as SEIntersectionPoint);
  },
  selectedObjects: (state: AppState) => (): SENodule[] => {
    return state.selections;
  }
};
