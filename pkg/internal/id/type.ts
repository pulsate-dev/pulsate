declare const snowflakeNominal: unique symbol;
export type ID<T> = string & { [snowflakeNominal]: T };
