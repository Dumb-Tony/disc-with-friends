import { course } from "./course.js";
import { playground } from "./playground.js";
export const courses = [course, playground];
export const courseById = (id) => courses.find((c) => c.id === id);
