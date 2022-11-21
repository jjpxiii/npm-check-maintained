const { exec } = require("child_process");
const { timeStamp } = require("console");
let fs = require("fs");

/** Load and validate package file and tests. */
const loadPackageFile = async () => {
  let pkg;
  let pkgFile;

  try {
    pkgFile = fs.readFileSync("package.json", "utf-8");
    pkg = JSON.parse(pkgFile);
  } catch (e) {
    console.error("Missing or invalid package.json");
    process.exit(1);
  }
  return { pkg, pkgFile };
};

const analyzeDep = async (dep) => {
  exec("npm repo --browser false " + dep, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    let re = JSON.stringify(
      stdout
        .replace(/\n/gi, "")
        .replace(dep + " repo available at the following URL:  ", "")
    );
    exec("npm view " + dep + " --json", (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }

      let j = JSON.parse(stdout);
      // let t = JSON.parse(j.time);
      if (j?.dependencies?.length === 0) {
        return;
      }
      let last = parseInt(
        (new Date() - new Date(j.time[j.version])) / (60 * 60 * 1000 * 24)
      );

      if (last > 100) {
        exec(
          "npm view " + dep + " dependencies --json",
          (error, stdout, stderr) => {
            if (stdout && Object.keys(JSON.parse(stdout)).length > 0) {
              // console.log(dep + " " + j?.bugs?.url);
              // console.log(j.time[j.version]);
              console.log(dep);
              console.log(last + " days since last publish ");
            }
          }
        );
      }
    });
  });
};

// /** Iteratively installs upgrades and runs tests to identify breaking upgrades. */
// // we have to pass run directly since it would be a circular require if doctor included this file
const analyze = async () => {
  let options = {
    packageManager: "npm",
  };
  const lockFileName =
    options.packageManager === "yarn" ? "yarn.lock" : "package-lock.json";
  const { pkg, pkgFile } = await loadPackageFile();

  console.log("Analyzing…");
  const allDependencies = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.optionalDependencies,
    ...pkg.bundleDependencies,
  };

  Object.keys(allDependencies).map(async (dep) => {
    analyzeDep(dep);
  });

  // check npm dependencies

  let lockFile = fs.readFileSync(lockFileName, "utf-8");
  let jl = JSON.parse(lockFile);
  Object.keys(jl.packages)
    .filter((n) => n)
    .map(async (dep) => {
      // console.log("ici " + dep);
      let sanitized = dep.replace("node_modules/", "");
      if (sanitized.indexOf("node_modules") > -1) return;
      analyzeDep(sanitized);
    });
};

// export default analyze;

analyze();
