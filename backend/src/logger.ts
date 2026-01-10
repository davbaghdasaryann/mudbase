import {Logger} from './tsback/logger';

export const logger = new Logger({
    prettyLogTemplate: "{{logLevelName}}\t[.{{filePathWithLine}}{{name}}]\t",
    argumentsArrayName: "argumentsArray",
    prettyLogStyles: {
        logLevelName: {
          "*": ["bold", "black", "bgWhiteBright", "dim"],
          SILLY: ["bold", "white"],
          TRACE: ["bold", "whiteBright"],
          DEBUG: ["bold", "green"],
          INFO: ["bold", "blue"],
          WARN: ["bold", "yellow"],
          ERROR: ["bold", "red"],
          FATAL: ["bold", "redBright"],
        },
        dateIsoStr: "white",
        filePathWithLine: "white",
        name: ["white", "bold"],
        nameWithDelimiterPrefix: ["white", "bold"],
        nameWithDelimiterSuffix: ["white", "bold"],
        errorName: ["bold", "bgRedBright", "whiteBright"],
        fileName: ["yellow"],
        // fileNameWithLine: "white",
      },
});

global.log_ = logger;
