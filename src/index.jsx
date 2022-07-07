/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { StyleRegistry } from "solid-styled";

render(
  () => (
    <StyleRegistry>
      <App />
    </StyleRegistry>
  ),
  document.getElementById("root")
);
