//
// Taken from tslog: https://github.com/fullstack-build/tslog
//
// Fixed bug that threw exception when logging ObjectId

import {ObjectId} from 'bson';
import os from 'os';
import path from 'path';
import util from 'util';

interface IMetaStatic {
    name?: string;
    parentNames?: string[];
    runtime: string;
    runtimeVersion: string;
    hostname: string;
}

interface IMeta extends IMetaStatic {
    date: Date;
    logLevelId: number;
    logLevelName: string;
    path?: IStackFrame;
}

const meta: IMetaStatic = {
    runtime: 'Nodejs',
    runtimeVersion: process.version,
    hostname: os.hostname(),
};

function getMeta(
    logLevelId: number,
    logLevelName: string,
    stackDepthLevel: number,
    hideLogPositionForPerformance: boolean,
    name?: string,
    parentNames?: string[]
): IMeta {
    // faster than spread operator
    return Object.assign({}, meta, {
        name,
        parentNames,
        date: new Date(),
        logLevelId,
        logLevelName,
        path: !hideLogPositionForPerformance ? getCallerStackFrame(stackDepthLevel) : undefined,
    }) as IMeta;
}

function getCallerStackFrame(stackDepthLevel: number, error: Error = Error()): IStackFrame {
    return stackLineToStackFrame(
        (error as Error | undefined)?.stack?.split('\n')?.filter((thisLine: string) => thisLine.includes('    at '))?.[
            stackDepthLevel
        ]
    );
}

function getErrorTrace(error: Error): IStackFrame[] {
    return (error as Error)?.stack?.split('\n')?.reduce((result: IStackFrame[], line: string) => {
        if (line.includes('    at ')) {
            result.push(stackLineToStackFrame(line));
        }
        return result;
    }, []) as IStackFrame[];
}

function stackLineToStackFrame(line?: string): IStackFrame {
    const pathResult: IStackFrame = {
        fullFilePath: undefined,
        fileName: undefined,
        fileNameWithLine: undefined,
        fileColumn: undefined,
        fileLine: undefined,
        filePath: undefined,
        filePathWithLine: undefined,
        method: undefined,
    };
    if (line != null && line.includes('    at ')) {
        line = line.replace(/^\s+at\s+/gm, '');
        const errorStackLine = line.split(' (');
        const fullFilePath = line?.slice(-1) === ')' ? line?.match(/\(([^)]+)\)/)?.[1] : line;
        const pathArray = fullFilePath?.includes(':')
            ? fullFilePath?.replace('file://', '')?.replace(process.cwd(), '')?.split(':')
            : undefined;
        // order plays a role, runs from the back: column, line, path
        const fileColumn = pathArray?.pop();
        const fileLine = pathArray?.pop();
        const filePath = pathArray?.pop();

        //const filePathWithLine = path.normalize(`${filePath}:${fileLine}`);
        //let filePathWithLine = path.resolve(filePath ?? '');
        let filePathWithLine = path.normalize(filePath ?? '');
        filePathWithLine += ':' + fileLine;

        //}:${fileLine}`);

        const fileName = filePath?.split('/')?.pop();
        const fileNameWithLine = `${fileName}:${fileLine}`;

        if (filePath != null && filePath.length > 0) {
            pathResult.fullFilePath = fullFilePath;
            pathResult.fileName = fileName;
            pathResult.fileNameWithLine = fileNameWithLine;
            pathResult.fileColumn = fileColumn;
            pathResult.fileLine = fileLine;
            pathResult.filePath = filePath;
            pathResult.filePathWithLine = filePathWithLine;
            pathResult.method = errorStackLine?.[1] != null ? errorStackLine?.[0] : undefined;
        }
    }
    return pathResult;
}

function isError(e: Error | unknown): boolean {
    // An error could be an instance of Error while not being a native error
    // or could be from a different realm and not be instance of Error but still
    // be a native error.
    return util.types?.isNativeError != null ? util.types.isNativeError(e) : e instanceof Error;
}

function prettyFormatLogObj<LogObj>(
    maskedArgs: unknown[],
    settings: ISettings<LogObj>
): {args: unknown[]; errors: string[]} {
    return maskedArgs.reduce(
        (result: {args: unknown[]; errors: string[]}, arg) => {
            isError(arg) ? result.errors.push(prettyFormatErrorObj(arg as Error, settings)) : result.args.push(arg);
            return result;
        },
        {args: [], errors: []}
    );
}

function prettyFormatErrorObj<LogObj>(error: Error, settings: ISettings<LogObj>): string {
    const errorStackStr = getErrorTrace(error as Error).map((stackFrame) => {
        return formatTemplate(settings, settings.prettyErrorStackTemplate, {...stackFrame}, true);
    });

    const placeholderValuesError = {
        errorName: ` ${error.name} `,
        errorMessage: error.message,
        errorStack: errorStackStr.join('\n'),
    };
    return formatTemplate(settings, settings.prettyErrorTemplate, placeholderValuesError);
}

function transportFormatted<LogObj>(
    logMetaMarkup: string,
    logArgs: unknown[],
    logErrors: string[],
    settings: ISettings<LogObj>
): void {
    const logErrorsStr = (logErrors.length > 0 && logArgs.length > 0 ? '\n' : '') + logErrors.join('\n');
    settings.prettyInspectOptions.colors = settings.stylePrettyLogs;
    console.log(
        // ...logArgs
        logMetaMarkup + util.formatWithOptions(settings.prettyInspectOptions, ...logArgs) + logErrorsStr
        //logMetaMarkup + util.format(...logArgs) + logErrorsStr
    );
}

function transportJSON<LogObj>(json: LogObj & ILogObjMeta): void {
    console.log(jsonStringifyRecursive(json));

    function jsonStringifyRecursive(obj: unknown) {
        const cache = new Set();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    // Circular reference found, discard key
                    return '[Circular]';
                }
                // Store value in our collection
                cache.add(value);
            }
            return value;
        });
    }
}

function isBuffer(arg: unknown) {
    return Buffer.isBuffer(arg);
}

const prettyLogStyles: {[name: string]: [number, number]} = {
    // modifier
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],

    // color
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],

    // Bright color
    blackBright: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39],

    // background color
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],

    // Bright background color
    bgBlackBright: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49],
};

type TStyle =
    | null
    | string
    | string[]
    | {
          [value: string]: null | string | string[];
      };

interface ISettingsParam<LogObj> {
    type?: 'json' | 'pretty' | 'hidden';
    name?: string;
    parentNames?: string[];
    minLevel?: number;
    argumentsArrayName?: string;
    hideLogPositionForProduction?: boolean;
    prettyLogTemplate?: string;
    prettyErrorTemplate?: string;
    prettyErrorStackTemplate?: string;
    prettyErrorParentNamesSeparator?: string;
    prettyErrorLoggerNameDelimiter?: string;
    stylePrettyLogs?: boolean;
    prettyLogTimeZone?: 'UTC' | 'local';
    prettyLogStyles?: {
        yyyy?: TStyle;
        mm?: TStyle;
        dd?: TStyle;
        hh?: TStyle;
        MM?: TStyle;
        ss?: TStyle;
        ms?: TStyle;
        dateIsoStr?: TStyle;
        logLevelName?: TStyle;
        fileName?: TStyle;
        filePath?: TStyle;
        fileLine?: TStyle;
        filePathWithLine?: TStyle;
        name?: TStyle;
        nameWithDelimiterPrefix?: TStyle;
        nameWithDelimiterSuffix?: TStyle;
        errorName?: TStyle;
        errorMessage?: TStyle;
    };
    prettyInspectOptions?: util.InspectOptions;
    metaProperty?: string;
    maskPlaceholder?: string;
    maskValuesOfKeys?: string[];
    maskValuesOfKeysCaseInsensitive?: boolean;
    /** Mask all occurrences (case-sensitive) from values in logs (e.g. all secrets from ENVs etc.). Will be replaced with [***] */
    maskValuesRegEx?: RegExp[];
    /**  Prefix every log message of this logger. */
    prefix?: unknown[];
    /**  Array of attached Transports. Use Method `attachTransport` to attach transports. */
    attachedTransports?: ((transportLogger: LogObj & ILogObjMeta) => void)[];
    // overwrite?: {
    //     mask?: (args: unknown[]) => unknown[];
    //     toLogObj?: (args: unknown[], clonesLogObj?: LogObj) => LogObj;
    //     addMeta?: (
    //         logObj: LogObj,
    //         logLevelId: number,
    //         logLevelName: string
    //     ) => LogObj & ILogObjMeta;
    //     formatMeta?: (meta?: IMeta) => string;
    //     formatLogObj?: (
    //         maskedArgs: unknown[],
    //         settings: ISettings<LogObj>
    //     ) => {args: unknown[]; errors: string[]};
    //     transportFormatted?: (
    //         logMetaMarkup: string,
    //         logArgs: unknown[],
    //         logErrors: string[],
    //         settings: ISettings<LogObj>
    //     ) => void;
    //     transportJSON?: (json: unknown) => void;
    // };
}

interface ISettings<LogObj> extends ISettingsParam<LogObj> {
    type: 'json' | 'pretty' | 'hidden';
    name?: string;
    parentNames?: string[];
    minLevel: number;
    argumentsArrayName?: string;
    hideLogPositionForProduction: boolean;
    prettyLogTemplate: string;
    prettyErrorTemplate: string;
    prettyErrorStackTemplate: string;
    prettyErrorParentNamesSeparator: string;
    prettyErrorLoggerNameDelimiter: string;
    stylePrettyLogs: boolean;
    prettyLogTimeZone: 'UTC' | 'local';
    prettyLogStyles: {
        yyyy?: TStyle;
        mm?: TStyle;
        dd?: TStyle;
        hh?: TStyle;
        MM?: TStyle;
        ss?: TStyle;
        ms?: TStyle;
        dateIsoStr?: TStyle;
        logLevelName?: TStyle;
        fileName?: TStyle;
        fileNameWithLine?: TStyle;
        filePath?: TStyle;
        fileLine?: TStyle;
        filePathWithLine?: TStyle;
        name?: TStyle;
        nameWithDelimiterPrefix?: TStyle;
        nameWithDelimiterSuffix?: TStyle;
        errorName?: TStyle;
        errorMessage?: TStyle;
    };
    prettyInspectOptions: util.InspectOptions;
    metaProperty: string;
    maskPlaceholder: string;
    maskValuesOfKeys: string[];
    maskValuesOfKeysCaseInsensitive: boolean;
    prefix: unknown[];
    attachedTransports: ((transportLogger: LogObj & ILogObjMeta) => void)[];
}

export interface ILogObj {
    [name: string]: unknown;
}

interface ILogObjMeta {
    [name: string]: IMeta;
}

interface IStackFrame {
    fullFilePath?: string;
    fileName?: string;
    fileNameWithLine?: string;
    filePath?: string;
    fileLine?: string;
    fileColumn?: string;
    filePathWithLine?: string;
    method?: string;
}

/**
 * Object representing an error with a stack trace
 * @public
 */
interface IErrorObject {
    /** Name of the error*/
    name: string;
    /** Error message */
    message: string;
    /** native Error object */
    nativeError: Error;
    /** Stack trace of the error */
    stack: IStackFrame[];
}

/**
 * ErrorObject that can safely be "JSON.stringifed". All circular structures have been "util.inspected" into strings
 * @public
 */
interface IErrorObjectStringifiable extends IErrorObject {
    nativeError: never;
    errorString: string;
}

function formatTemplate<LogObj>(
    settings: ISettings<LogObj>,
    template: string,
    values: {[key: string]: string},
    hideUnsetPlaceholder = false
) {
    const templateString = String(template);
    const ansiColorWrap = (placeholderValue: string, code: [number, number]) =>
        `\u001b[${code[0]}m${placeholderValue}\u001b[${code[1]}m`;

    const styleWrap: (value: string, style: TStyle) => string = (value: string, style: TStyle) => {
        if (style != null && typeof style === 'string') {
            return ansiColorWrap(value, prettyLogStyles[style]);
        } else if (style != null && Array.isArray(style)) {
            return style.reduce((prevValue: string, thisStyle: string) => styleWrap(prevValue, thisStyle), value);
        } else {
            if (style != null && style[value.trim()] != null) {
                return styleWrap(value, style[value.trim()]);
            } else if (style != null && style['*'] != null) {
                return styleWrap(value, style['*']);
            } else {
                return value;
            }
        }
    };

    return templateString.replace(/{{(.+?)}}/g, (_, placeholder) => {
        const value = values[placeholder] != null ? values[placeholder] : hideUnsetPlaceholder ? '' : _;

        return settings.stylePrettyLogs
            ? styleWrap(value, (settings?.prettyLogStyles as any)?.[placeholder]) +
                  ansiColorWrap('', prettyLogStyles.reset)
            : value;
    });
}

function formatNumberAddZeros(value: number, digits = 2, addNumber = 0): string {
    if (value != null && isNaN(value)) {
        return '';
    }
    value = value != null ? value + addNumber : value;
    return digits === 2
        ? value == null
            ? '--'
            : value < 10
              ? '0' + value
              : value.toString()
        : value == null
          ? '---'
          : value < 10
            ? '00' + value
            : value < 100
              ? '0' + value
              : value.toString();
}

class BaseLogger<LogObj> {
    private readonly runtime: 'browser' | 'nodejs' | 'unknown';
    public settings: ISettings<LogObj>;
    // not needed yet
    //private subLoggers: BaseLogger<LogObj>[] = [];

    constructor(
        settings?: ISettingsParam<LogObj>,
        private logObj?: LogObj,
        private stackDepthLevel: number = 4
    ) {
        const isBrowser = false;
        const isNode = true;
        this.runtime = isBrowser ? 'browser' : isNode ? 'nodejs' : 'unknown';
        const isBrowserBlinkEngine = false;
        const isSafari = false;
        this.stackDepthLevel = isSafari ? 4 : this.stackDepthLevel;

        this.settings = {
            type: settings?.type ?? 'pretty',
            name: settings?.name,
            parentNames: settings?.parentNames,
            minLevel: settings?.minLevel ?? 0,
            argumentsArrayName: settings?.argumentsArrayName,
            hideLogPositionForProduction: settings?.hideLogPositionForProduction ?? false,
            prettyLogTemplate:
                settings?.prettyLogTemplate ??
                '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t{{filePathWithLine}}{{nameWithDelimiterPrefix}}\t',
            prettyErrorTemplate:
                settings?.prettyErrorTemplate ?? '\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}',
            prettyErrorStackTemplate:
                settings?.prettyErrorStackTemplate ?? '  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}',
            prettyErrorParentNamesSeparator: settings?.prettyErrorParentNamesSeparator ?? ':',
            prettyErrorLoggerNameDelimiter: settings?.prettyErrorLoggerNameDelimiter ?? '\t',
            stylePrettyLogs: settings?.stylePrettyLogs ?? true,
            prettyLogTimeZone: settings?.prettyLogTimeZone ?? 'UTC',
            prettyLogStyles: settings?.prettyLogStyles ?? {
                logLevelName: {
                    '*': ['bold', 'black', 'bgWhiteBright', 'dim'],
                    SILLY: ['bold', 'white'],
                    TRACE: ['bold', 'whiteBright'],
                    DEBUG: ['bold', 'green'],
                    INFO: ['bold', 'blue'],
                    WARN: ['bold', 'yellow'],
                    ERROR: ['bold', 'red'],
                    FATAL: ['bold', 'redBright'],
                },
                dateIsoStr: 'white',
                filePathWithLine: 'white',
                name: ['white', 'bold'],
                nameWithDelimiterPrefix: ['white', 'bold'],
                nameWithDelimiterSuffix: ['white', 'bold'],
                errorName: ['bold', 'bgRedBright', 'whiteBright'],
                fileName: ['yellow'],
                fileNameWithLine: 'white',
            },
            prettyInspectOptions: settings?.prettyInspectOptions ?? {
                colors: true,
                compact: false,
                depth: Infinity,
            },
            metaProperty: settings?.metaProperty ?? '_meta',
            maskPlaceholder: settings?.maskPlaceholder ?? '[***]',
            maskValuesOfKeys: settings?.maskValuesOfKeys ?? ['password'],
            maskValuesOfKeysCaseInsensitive: settings?.maskValuesOfKeysCaseInsensitive ?? false,
            maskValuesRegEx: settings?.maskValuesRegEx,
            prefix: [...(settings?.prefix ?? [])],
            attachedTransports: [...(settings?.attachedTransports ?? [])],
            // overwrite: {
            //     mask: settings?.overwrite?.mask,
            //     toLogObj: settings?.overwrite?.toLogObj,
            //     addMeta: settings?.overwrite?.addMeta,
            //     formatMeta: settings?.overwrite?.formatMeta,
            //     formatLogObj: settings?.overwrite?.formatLogObj,
            //     transportFormatted: settings?.overwrite?.transportFormatted,
            //     transportJSON: settings?.overwrite?.transportJSON,
            // },
        };

        // style only for server and blink browsers
        this.settings.stylePrettyLogs =
            this.settings.stylePrettyLogs && isBrowser && !isBrowserBlinkEngine ? false : this.settings.stylePrettyLogs;
    }

    /**
     * Logs a message with a custom log level.
     * @param logLevelId    - Log level ID e.g. 0
     * @param logLevelName  - Log level name e.g. silly
     * @param args          - Multiple log attributes that should be logged out.
     * @return LogObject with meta property, when log level is >= minLevel
     */
    public log(logLevelId: number, logLevelName: string, ...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        if (logLevelId < this.settings.minLevel) {
            return;
        }

        const logArgs = [...this.settings.prefix, ...args];

        const maskedArgs: unknown[] =
            this.settings.maskValuesOfKeys != null && this.settings.maskValuesOfKeys.length > 0
                ? this._mask(logArgs)
                : logArgs;

        // execute default LogObj functions for every log (e.g. requestId)

        const thisLogObj: LogObj | undefined =
            this.logObj != null ? this._recursiveCloneAndExecuteFunctions(this.logObj) : undefined;

        const logObj = this._toLogObj(maskedArgs, thisLogObj);
        const logObjWithMeta = this._addMetaToLogObj(logObj, logLevelId, logLevelName);

        // overwrite no matter what, should work for any type (pretty, json, ...)
        let logMetaMarkup;
        let logArgsAndErrorsMarkup: {args: unknown[]; errors: string[]} | undefined = undefined;

        if (this.settings.type === 'pretty') {
            logMetaMarkup = logMetaMarkup ?? this._prettyFormatLogObjMeta(logObjWithMeta?.[this.settings.metaProperty]);
            logArgsAndErrorsMarkup = logArgsAndErrorsMarkup ?? prettyFormatLogObj(maskedArgs, this.settings);
        }

        if (logMetaMarkup != null && logArgsAndErrorsMarkup != null) {
            transportFormatted(
                logMetaMarkup,
                logArgsAndErrorsMarkup.args,
                //args,
                logArgsAndErrorsMarkup.errors,
                this.settings
            );
        } else {
            // overwrite transport no matter what, hide only with default transport
            transportJSON(logObjWithMeta);
        }

        if (this.settings.attachedTransports != null && this.settings.attachedTransports.length > 0) {
            this.settings.attachedTransports.forEach((transportLogger) => {
                transportLogger(logObjWithMeta);
            });
        }

        return logObjWithMeta;
    }

    /**
     *  Attaches external Loggers, e.g. external log services, file system, database
     *
     * @param transportLogger - External logger to be attached. Must implement all log methods.
     */
    public attachTransport(transportLogger: (transportLogger: LogObj & ILogObjMeta) => void): void {
        this.settings.attachedTransports.push(transportLogger);
    }

    /**
     *  Returns a child logger based on the current instance with inherited settings
     *
     * @param settings - Overwrite settings inherited from parent logger
     * @param logObj - Overwrite logObj for sub-logger
     */
    public getSubLogger(settings?: ISettingsParam<LogObj>, logObj?: LogObj): BaseLogger<LogObj> {
        const subLoggerSettings: ISettings<LogObj> = {
            ...this.settings,
            ...settings,
            // collect parent names in Array
            parentNames:
                this.settings?.parentNames != null && this.settings?.name != null
                    ? [...this.settings.parentNames, this.settings.name]
                    : this.settings?.name != null
                      ? [this.settings.name]
                      : undefined,
            // merge all prefixes instead of overwriting them
            prefix: [...this.settings.prefix, ...(settings?.prefix ?? [])],
        };

        const subLogger: BaseLogger<LogObj> = new (this.constructor as new (
            subLoggerSettings?: ISettingsParam<LogObj>,
            logObj?: LogObj,
            stackDepthLevel?: number
        ) => this)(subLoggerSettings, logObj ?? this.logObj, this.stackDepthLevel);
        //this.subLoggers.push(subLogger);
        return subLogger;
    }

    private _mask(args: unknown[]): unknown[] {
        const maskValuesOfKeys =
            this.settings.maskValuesOfKeysCaseInsensitive !== true
                ? this.settings.maskValuesOfKeys
                : this.settings.maskValuesOfKeys.map((key) => key.toLowerCase());
        return args?.map((arg) => {
            return this._recursiveCloneAndMaskValuesOfKeys(arg, maskValuesOfKeys);
        });
    }

    private _recursiveCloneAndMaskValuesOfKeys<T>(source: T, keys: (number | string)[], seen: unknown[] = []): T {
        if (seen.includes(source)) {
            return {...source};
        }
        if (typeof source === 'object') {
            seen.push(source);
        }

        if (isError(source)) return source;
        if (isBuffer(source)) return source;
        if (Array.isArray(source))
            return (source as any).map((item: any) => this._recursiveCloneAndMaskValuesOfKeys(item, keys, seen));
        if (source instanceof Date) return new Date(source.getTime()) as T;
        if (source instanceof ObjectId) return source;
        if (source != null && typeof source === 'object') {
            return Object.getOwnPropertyNames(source).reduce(
                (o, prop) => {
                    // mask
                    o[prop] = keys.includes(
                        this.settings?.maskValuesOfKeysCaseInsensitive !== true ? prop : prop.toLowerCase()
                    )
                        ? this.settings.maskPlaceholder
                        : this._recursiveCloneAndMaskValuesOfKeys(
                              (source as {[key: string]: unknown})[prop],
                              keys,
                              seen
                          );
                    return o;
                },
                Object.create(Object.getPrototypeOf(source))
            );
        }

        return ((source: T): T => {
            // mask regEx
            this.settings?.maskValuesRegEx?.forEach((regEx) => {
                source = (source as string)?.toString()?.replace(regEx, this.settings.maskPlaceholder) as T;
            });
            return source;
        })(source);

        /*
        return isError(source)
            ? source // dont copy Error
            : isBuffer(source)
            ? source // dont copy Buffer
            : Array.isArray(source)
            ? source.map((item) => this._recursiveCloneAndMaskValuesOfKeys(item, keys, seen))
            : source instanceof Date
            ? new Date(source.getTime())
            : source != null && typeof source === 'object'
            ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
                  // mask
                  o[prop] = keys.includes(
                      this.settings?.maskValuesOfKeysCaseInsensitive !== true
                          ? prop
                          : prop.toLowerCase()
                  )
                      ? this.settings.maskPlaceholder
                      : this._recursiveCloneAndMaskValuesOfKeys(
                            (source as {[key: string]: unknown})[prop],
                            keys,
                            seen
                        );
                  return o;
              }, Object.create(Object.getPrototypeOf(source)))
            : ((source: T): T => {
                  // mask regEx
                  this.settings?.maskValuesRegEx?.forEach((regEx) => {
                      source = (source as string)
                          ?.toString()
                          ?.replace(regEx, this.settings.maskPlaceholder) as T;
                  });
                  return source;
              })(source);
              */
    }

    private _recursiveCloneAndExecuteFunctions<T>(source: T, seen: unknown[] = []): T {
        if (seen.includes(source)) {
            return {...source};
        }
        if (typeof source === 'object') {
            seen.push(source);
        }

        let result: unknown;

        if (Array.isArray(source)) {
            // Clone each item
            result = source.map((item) => this._recursiveCloneAndExecuteFunctions(item, seen));
        } else if (source instanceof Date) {
            // Clone Date
            result = new Date(source.getTime());
        } else if (source && typeof source === 'object') {
            // Clone object (including property descriptors), then execute funcs or recurse
            const obj = Object.create(Object.getPrototypeOf(source));
            for (const key of Object.getOwnPropertyNames(source)) {
                const desc = Object.getOwnPropertyDescriptor(source, key)!;
                Object.defineProperty(obj, key, desc);

                const val = (source as any)[key];
                obj[key] = typeof val === 'function' ? val() : this._recursiveCloneAndExecuteFunctions(val, seen);
            }
            result = obj;
        } else {
            // Primitives just pass through
            result = source;
        }

        // Single assertion to T
        return result as T;
        /*
        return Array.isArray(source)
            ? source.map((item) => this._recursiveCloneAndExecuteFunctions(item, seen))
            : source instanceof Date
            ? new Date(source.getTime())
            : source && typeof source === 'object'
            ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
                  Object.defineProperty(
                      o,
                      prop,
                      Object.getOwnPropertyDescriptor(source, prop) as PropertyDescriptor
                  );
                  // execute functions or clone
                  o[prop] =
                      typeof (source as any)[prop] === 'function'
                          ? (source as any)[prop]()
                          : this._recursiveCloneAndExecuteFunctions(
                                (source as {[key: string]: unknown})[prop],
                                seen
                            );
                  return o;
              }, Object.create(Object.getPrototypeOf(source)))
            : (source as T);
            */
    }

    private _toLogObj(args: unknown[], clonedLogObj: LogObj = {} as LogObj): LogObj {
        args = args?.map((arg) => (isError(arg) ? this._toErrorObject(arg as Error) : arg));
        if (this.settings.argumentsArrayName == null) {
            if (
                args.length === 1 &&
                !Array.isArray(args[0]) &&
                isBuffer(args[0]) !== true &&
                !(args[0] instanceof Date)
            ) {
                clonedLogObj =
                    typeof args[0] === 'object' && args[0] != null
                        ? {...args[0], ...clonedLogObj}
                        : {0: args[0], ...clonedLogObj};
            } else {
                clonedLogObj = {...clonedLogObj, ...args};
            }
        } else {
            clonedLogObj = {
                ...clonedLogObj,
                [this.settings.argumentsArrayName]: args,
            };
        }
        return clonedLogObj;
    }

    private _toErrorObject(error: Error): IErrorObject {
        return {
            nativeError: error,
            name: error.name ?? 'Error',
            message: error.message,
            stack: getErrorTrace(error),
        };
    }

    private _addMetaToLogObj(logObj: LogObj, logLevelId: number, logLevelName: string): LogObj & ILogObjMeta & ILogObj {
        return {
            ...logObj,
            [this.settings.metaProperty]: getMeta(
                logLevelId,
                logLevelName,
                this.stackDepthLevel,
                this.settings.hideLogPositionForProduction,
                this.settings.name,
                this.settings.parentNames
            ),
        };
    }

    private _prettyFormatLogObjMeta(logObjMeta?: IMeta): string {
        if (logObjMeta == null) {
            return '';
        }

        let template = this.settings.prettyLogTemplate;

        const placeholderValues: any = {};

        // date and time performance fix
        if (template.includes('{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}')) {
            template = template.replace('{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}', '{{dateIsoStr}}');
        } else {
            if (this.settings.prettyLogTimeZone === 'UTC') {
                placeholderValues['yyyy'] = logObjMeta?.date?.getUTCFullYear() ?? '----';
                placeholderValues['mm'] = formatNumberAddZeros(logObjMeta?.date?.getUTCMonth(), 2, 1);
                placeholderValues['dd'] = formatNumberAddZeros(logObjMeta?.date?.getUTCDate(), 2);
                placeholderValues['hh'] = formatNumberAddZeros(logObjMeta?.date?.getUTCHours(), 2);
                placeholderValues['MM'] = formatNumberAddZeros(logObjMeta?.date?.getUTCMinutes(), 2);
                placeholderValues['ss'] = formatNumberAddZeros(logObjMeta?.date?.getUTCSeconds(), 2);
                placeholderValues['ms'] = formatNumberAddZeros(logObjMeta?.date?.getUTCMilliseconds(), 3);
            } else {
                placeholderValues['yyyy'] = logObjMeta?.date?.getFullYear() ?? '----';
                placeholderValues['mm'] = formatNumberAddZeros(logObjMeta?.date?.getMonth(), 2, 1);
                placeholderValues['dd'] = formatNumberAddZeros(logObjMeta?.date?.getDate(), 2);
                placeholderValues['hh'] = formatNumberAddZeros(logObjMeta?.date?.getHours(), 2);
                placeholderValues['MM'] = formatNumberAddZeros(logObjMeta?.date?.getMinutes(), 2);
                placeholderValues['ss'] = formatNumberAddZeros(logObjMeta?.date?.getSeconds(), 2);
                placeholderValues['ms'] = formatNumberAddZeros(logObjMeta?.date?.getMilliseconds(), 3);
            }
        }
        const dateInSettingsTimeZone =
            this.settings.prettyLogTimeZone === 'UTC'
                ? logObjMeta?.date
                : new Date(logObjMeta?.date?.getTime() - logObjMeta?.date?.getTimezoneOffset() * 60000);
        placeholderValues['rawIsoStr'] = dateInSettingsTimeZone?.toISOString();
        placeholderValues['dateIsoStr'] = dateInSettingsTimeZone?.toISOString().replace('T', ' ').replace('Z', '');
        placeholderValues['logLevelName'] = logObjMeta?.logLevelName;
        placeholderValues['fileNameWithLine'] = logObjMeta?.path?.fileNameWithLine ?? '';
        placeholderValues['filePathWithLine'] = logObjMeta?.path?.filePathWithLine ?? '';
        placeholderValues['fullFilePath'] = logObjMeta?.path?.fullFilePath ?? '';
        // name
        let parentNamesString = this.settings.parentNames?.join(this.settings.prettyErrorParentNamesSeparator);
        parentNamesString =
            parentNamesString != null && logObjMeta?.name != null
                ? parentNamesString + this.settings.prettyErrorParentNamesSeparator
                : undefined;
        placeholderValues['name'] =
            logObjMeta?.name != null || parentNamesString != null ? (parentNamesString ?? '') + logObjMeta?.name : '';
        placeholderValues['nameWithDelimiterPrefix'] =
            placeholderValues['name'].length > 0
                ? this.settings.prettyErrorLoggerNameDelimiter + placeholderValues['name']
                : '';
        placeholderValues['nameWithDelimiterSuffix'] =
            placeholderValues['name'].length > 0
                ? placeholderValues['name'] + this.settings.prettyErrorLoggerNameDelimiter
                : '';

        return formatTemplate(this.settings, template, placeholderValues);
    }
}

export class Logger<LogObj = ILogObj> extends BaseLogger<LogObj> {
    constructor(settings?: ISettingsParam<LogObj>, logObj?: LogObj) {
        super(settings, logObj, 5);
    }

    /**
     * Logs a message with a custom log level.
     * @param logLevelId    - Log level ID e.g. 0
     * @param logLevelName  - Log level name e.g. silly
     * @param args          - Multiple log attributes that should be logged out.
     */
    public log(
        logLevelId: number,
        logLevelName: string,
        ...args: unknown[]
    ): (LogObj & ILogObjMeta & ILogObj) | undefined {
        return super.log(logLevelId, logLevelName, ...args);
    }

    /**
     * Logs a silly message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public silly(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        return super.log(0, 'SILLY', ...args);
    }

    /**
     * Logs a trace message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public trace(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        return super.log(1, 'TRACE', ...args);
    }

    /**
     * Logs a debug message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public debug(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        return super.log(2, 'DEBUG', ...args);
    }

    /**
     * Logs an info message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public info(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        return super.log(3, 'INFO', ...args);
    }

    /**
     * Logs a warn message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public warn(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        return super.log(4, 'WARN', ...args);
    }

    /**
     * Logs an error message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public error(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        return super.log(5, 'ERROR', ...args);
    }

    /**
     * Logs a fatal message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public fatal(...args: unknown[]): (LogObj & ILogObjMeta) | undefined {
        return super.log(6, 'FATAL', ...args);
    }

    /**
     *  Returns a child logger based on the current instance with inherited settings
     *
     * @param settings - Overwrite settings inherited from parent logger
     * @param logObj - Overwrite logObj for sub-logger
     */
    public getSubLogger(settings?: ISettingsParam<LogObj>, logObj?: LogObj): Logger<LogObj> {
        return super.getSubLogger(settings, logObj) as Logger<LogObj>;
    }
}
