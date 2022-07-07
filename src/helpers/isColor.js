const isColor = (s) =>
    typeof s === "string" &&
    (s.indexOf("#") != -1 || s.indexOf("rgb") != -1 || s.indexOf("hsl") != -1);

export default isColor;
