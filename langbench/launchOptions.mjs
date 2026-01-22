import {
  pipe,
  _,
  msgs,
  isSet,
  ALL,
  partial,
  every,
  autoCast,
  typeOf,
  isType,
  inRange,
  head,
  isEmpty,
  LBError,
} from "./utils.mjs";

const coreCount = () => (console.log("TODO CORE COUNT"), 4);

class LaunchOptions {
  constructor(vargs) {
    const options = { ...LaunchOptions.default };
    for (let i = 2; i < vargs.length; )
      if (vargs[i].startsWith("-")) {
        const flag = vargs[i].slice(1);
        if (!(flag in LaunchOptions.checks) || !flag.length)
          throw new LBError(msgs.undefinedFlag(flag));

        let values = [];
        while (vargs[++i] != null && !vargs[i].startsWith("-"))
          values.push(vargs[i]);

        if (Array.isArray(options[flag]) && Array.isArray(values))
          values = values.map(autoCast);
        else if (
          (!Array.isArray(options[flag]) && values.length == 0) ||
          values.length == 1
        )
          values = autoCast(values[0] ?? true);
        else throw new LBError(msgs.validArgFail(flag, values));

        if (!LaunchOptions.checks[flag](values))
          throw new LBError(msgs.validArgFail(flag, values));
        else options[flag] = values;
      } else throw new LBError(msgs.noFlag());

    return options;
  }

  static checks = {
    //log warnings
    lw: isType("boolean"),
    //log stages
    ls: isType("boolean"),
    //log debug
    ld: isType("boolean"),
    //log cmds
    lc: isType("boolean"),
    //attempts
    la: isType("boolean"),
    //log individual tests | выводит результаты каждого теста
    li: isType("boolean"),
    //tests
    t: tNames =>
      isSet(tNames) &&
      tNames.every(tName => Object.keys(tests).includes(tName)),
    //langs
    l: lNames =>
      isSet(lNames) &&
      lNames.every(lName => Object.keys(langs).includes(lName)),
    //dif
    d: isType("boolean"),
    //attemps count
    ac: every(isType("number"), Number.isInteger, n => n > 0),
    //fast mode
    fm: isType("boolean"),
    //sort by Time, maxMem averageMem buildSize buildTime
    sb: words =>
      isSet(words) &&
      words.every(w => ["t", "mm", "am", "bs", "bt"].includes(w)),
    //min cpu %
    mcp: every(isType("number"), Number.isInteger, inRange(1, 100)),
    //max cores
    mc: every(isType("number"), Number.isInteger, inRange(1, coreCount())),
  };

  static default = {
    lw: true,
    ls: true,
    lc: false,
    la: false,
    ld: false,
    li: true,
    t: [ALL],
    l: [ALL],
    d: false,
    ac: 3,
    fm: false,
    sb: ["t", "am", "mm", "bs", "bt"],
    mcp: 95,
    mc: 3,
  };
}

const launchOptions = new LaunchOptions(process.argv);;
export default launchOptions ;