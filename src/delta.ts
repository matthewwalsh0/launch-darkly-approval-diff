import type { Delta, AddedDelta, DeletedDelta, ModifiedDelta, MovedDelta, ArrayDelta, ObjectDelta } from 'jsondiffpatch';

export type { Delta, AddedDelta, DeletedDelta, ModifiedDelta, MovedDelta, ArrayDelta, ObjectDelta };

export const isAdded = (d: Delta): d is AddedDelta => Array.isArray(d) && d.length === 1;

export const isDeleted = (d: Delta): d is DeletedDelta => Array.isArray(d) && d.length === 3 && d[1] === 0 && d[2] === 0;

export const isModified = (d: Delta): d is ModifiedDelta => Array.isArray(d) && d.length === 2;

export const isMoved = (d: Delta): d is MovedDelta => Array.isArray(d) && d.length === 3 && d[2] === 3;

export const isArray = (d: Delta): d is ArrayDelta => typeof d === 'object' && d !== null && !Array.isArray(d) && (d as ArrayDelta)._t === 'a';

export const isObject = (d: Delta): d is ObjectDelta => typeof d === 'object' && d !== null && !Array.isArray(d) && (d as ArrayDelta)._t !== 'a';
