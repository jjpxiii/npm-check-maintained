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

      console.log(dep + " " + j?.bugs?.url);
      // console.log(j.time[j.version]);
      console.log(
        parseInt(
          (new Date() - new Date(j.time[j.version])) / (60 * 60 * 1000 * 24)
        )
      );
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

  const allDependencies = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.optionalDependencies,
    ...pkg.bundleDependencies,
  };

  Object.keys(allDependencies).map(async (dep) => {
    analyzeDep(dep);
  });

  // let lockFile = "";
  // try {
  //   lockFile = fs.readFileSync(lockFileName, "utf-8");
  // } catch (e) {}
};

// export default analyze;

analyze();
