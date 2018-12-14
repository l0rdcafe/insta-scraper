const fs = require("fs");
const { exec } = require("child_process");
const ProgressBar = require("progress");
const chalk = require("chalk");
const Nightmare = require("nightmare");

function getImgUrls(account) {
  return new Promise((resolve, reject) => {
    const nightmare = Nightmare();
    const bar = new ProgressBar(":bar", { total: 10 });
    const timer = setInterval(() => {
      bar.tick();
      if (bar.complete) {
        clearInterval(timer);
      }
    }, 100);
    nightmare
      .goto(`https://www.instagram.com/${account}/`)
      .evaluate(() => {
        if (!document.querySelector("img")) {
          throw new Error("Account does not exist.");
        }
      })
      .wait("img")
      .evaluate(() => [...document.querySelectorAll("img")].map(img => img.getAttribute("src")))
      .end()
      .then(resolve)
      .catch(reject);
  });
}

function downloadImgs(imgs) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync("./imgs")) {
      fs.mkdirSync("./imgs", error => {
        if (error) {
          reject(error);
        }
      });
    }

    imgs.forEach(img => {
      exec(`cd imgs && curl -OL ${img} && cd ..`, (err, stdout, stderr) => {
        if (err || stderr) {
          reject(err || stderr);
        }
        const bar = new ProgressBar(":percent", { total: 10 });
        const timer = setInterval(() => {
          bar.tick();
          if (bar.complete) {
            console.log(`${chalk.green(img)} successfully downloaded.`);
            clearInterval(timer);
          }
        }, 100);
      });
    });
    resolve();
  });
}

async function main() {
  if (process.argv.length < 3) {
    console.log(chalk.cyan("Please provide an Instagram account to download images."));
    process.exit(1);
  }
  try {
    const account = process.argv[2];
    const imgUrls = await getImgUrls(account);
    await downloadImgs(imgUrls);
  } catch (e) {
    console.log(chalk.redBright(e));
    process.exit(1);
  }
}

main();
