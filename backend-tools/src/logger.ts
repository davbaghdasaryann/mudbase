import {Logger} from './tsback/logger';

global.log_ = new Logger({
    prettyLogTemplate: "{{logLevelName}}\t[{{filePathWithLine}}{{name}}]\t",
    argumentsArrayName: "argumentsArray",
});
