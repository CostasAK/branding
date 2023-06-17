const { optimize } = require("svgo");
const { readFileSync, writeFileSync, mkdirSync } = require("fs");
var convertXmlJs = require("xml-js");
const { convertFile } = require("convert-svg-to-png");

const known_shapes = ["circle", "square"];

const variants = JSON.parse(readFileSync("./variants.json", "utf8"));
const svgString = readFileSync("./template.svg", "utf8");

function eliminateOtherShapes(svgString, shape) {
  let svgJs = convertXmlJs.xml2js(svgString);

  const bg_index = svgJs.elements[0].elements.findIndex(
    (el) => el.attributes.id === "BG"
  );

  const shape_index = svgJs.elements[0].elements[bg_index].elements.findIndex(
    (el) => el.attributes.id == shape
  );

  svgJs.elements[0].elements[bg_index].elements = [
    svgJs.elements[0].elements[bg_index].elements[shape_index],
  ];

  return convertXmlJs.js2xml(svgJs);
}

for (variant of variants) {
  const newSvgString = svgString
    .replace(/fill="#000001"/gi, `fill="#${variant.fg || '000" opacity="0'}"`)
    .replace(
      /fill="#ff?ff?ff?"/gi,
      `fill="#${variant.bg || 'fff" opacity="0'}"`
    );

  for (shape of known_shapes) {
    const { data } = optimize(eliminateOtherShapes(newSvgString, shape), {
      plugins: [{ name: "preset-default" }],
    });

    mkdirSync("./svg", { recursive: true });
    writeFileSync(`./svg/${variant.name} ${shape}.svg`, data);

    mkdirSync("./png", { recursive: true });
    convertFile(`./svg/${variant.name} ${shape}.svg`, {
      outputFilePath: `./png/${variant.name} ${shape}.png`,
      width: 400,
      height: 400,
    });
  }
}
