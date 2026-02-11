export type LineType = 'added' | 'removed' | 'context';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
