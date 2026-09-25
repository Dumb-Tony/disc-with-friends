import { course } from "./course.js";
import { courseById } from "./courses.js";
export class Round {
  constructor() {
    this.courseId = course.id;
    this.index = 0;
    this.scores = Array(9).fill(null);
    this.strokes = 0;
    this.penalties = 0;
    this.practice = false;
    this.done = false;
    this.holed = false;
  }
  get course() {
    return courseById(this.courseId);
  }
  get holes() {
    return this.course.holes;
  }
  get hole() {
    return this.holes[this.index];
  }
  get total() {
    return this.scores.reduce((n, s) => n + (s?.strokes || 0), 0);
  }
  get relative() {
    return this.scores.reduce(
      (n, s, i) => n + (s ? s.strokes - this.holes[i].par : 0),
      0,
    );
  }
  start(index = 0, practice = false, courseId = this.courseId) {
    if (!courseById(courseId)) throw new Error("Unknown course");
    this.courseId = courseId;
    this.index = index;
    this.scores = Array(9).fill(null);
    this.strokes = 0;
    this.penalties = 0;
    this.practice = practice;
    this.done = false;
    this.holed = false;
  }
  restart() {
    this.scores[this.index] = null;
    this.strokes = 0;
    this.penalties = 0;
    this.holed = false;
    this.done = false;
  }
  finish() {
    if (this.holed) return;
    this.holed = true;
    this.scores[this.index] = {
      strokes: this.strokes,
      penalties: this.penalties,
    };
    if (this.index === 8 && !this.practice) this.done = true;
  }
  advance() {
    if (!this.holed || this.index >= 8) return false;
    this.index++;
    this.strokes = 0;
    this.penalties = 0;
    this.holed = false;
    return true;
  }
  serialize(lie) {
    return {
      version: 1,
      course: this.courseId,
      index: this.index,
      scores: this.scores,
      strokes: this.strokes,
      penalties: this.penalties,
      practice: this.practice,
      done: this.done,
      holed: this.holed,
      lie,
    };
  }
  restore(data) {
    if (
      data?.version !== 1 ||
      !courseById(data.course) ||
      !Number.isInteger(data.index) ||
      data.index < 0 ||
      data.index > 8 ||
      !Array.isArray(data.scores) ||
      data.scores.length !== 9 ||
      !Number.isFinite(data.lie?.x) ||
      !Number.isFinite(data.lie?.z)
    )
      return false;
    if (
      ["practice", "done", "holed"].some(
        (key) => typeof data[key] !== "boolean",
      )
    )
      return false;
    if (data.scores.slice(data.index + 1).some((s) => s !== null)) return false;
    if (
      data.holed &&
      (data.strokes !== data.scores[data.index]?.strokes ||
        data.penalties !== data.scores[data.index]?.penalties)
    )
      return false;
    const valid = (n) => Number.isInteger(n) && n >= 0 && n < 10000;
    if (
      !valid(data.strokes) ||
      !valid(data.penalties) ||
      data.penalties > data.strokes ||
      data.scores.some(
        (s) =>
          s !== null &&
          (!valid(s.strokes) ||
            !valid(s.penalties) ||
            s.strokes < 1 ||
            s.penalties > s.strokes),
      )
    )
      return false;
    if (!data.practice && data.scores.slice(0, data.index).some((s) => !s))
      return false;
    if (
      !!data.holed !== !!data.scores[data.index] ||
      !!data.done !== (!data.practice && data.index === 8 && data.holed)
    )
      return false;
    this.courseId = data.course;
    for (const key of [
      "index",
      "scores",
      "strokes",
      "penalties",
      "practice",
      "done",
      "holed",
    ])
      this[key] = structuredClone(data[key]);
    return true;
  }
}
export const scoreName = (strokes, par) =>
  strokes === 1
    ? "ACE!"
    : strokes - par === -2
      ? "EAGLE"
      : strokes - par === -1
        ? "BIRDIE"
        : strokes === par
          ? "PAR"
          : strokes - par === 1
            ? "BOGEY"
            : strokes - par === 2
              ? "DOUBLE BOGEY"
              : (strokes - par > 0 ? "+" : "") + (strokes - par);
