import Editor from "@toast-ui/editor";
import colorSyntax from "@toast-ui/editor-plugin-color-syntax";
import { renderDiagrams } from "../web/src/lib/mermaid-client.js";

window.toastui = { Editor, colorSyntax };
window.renderDiagrams = renderDiagrams;
