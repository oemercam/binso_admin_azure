import fs from "node:fs";
const shell=fs.readFileSync("components/shell.tsx","utf8");
if(shell.includes("setSearchLoading("))throw new Error("Search loading must be derived; do not synchronously set loading state inside the search effect.");
if(!shell.includes("const searchLoading=isProductionMode()"))throw new Error("Search loading must be derived from query and settled production-search state.");
if(!shell.includes("if(!isProductionMode()||normalized.length<2)return"))throw new Error("Search effect must return without synchronous state updates when production search is inactive.");
if(!shell.includes("if(!controller.signal.aborted)setProductionSearch"))throw new Error("Search responses must ignore aborted requests.");
console.log("Search effect self-check passed: loading is derived and aborted requests cannot overwrite current results.");
