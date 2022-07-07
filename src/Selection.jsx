import { createMemo, createSignal, For } from "solid-js";
import check from "./helpers/check";
import styles from "./Selection.module.css";

const SelectionChord = function (props) {
  const isSelected = createMemo(() => {
    if (props.mode !== "part") return true;
    if (
      check(props.comp_loop.start) &&
      !check(props.comp_loop.end) &&
      props.index === props.comp_loop.start
    ) {
      return true;
    }
    if (
      check(props.comp_loop.start) &&
      check(props.comp_loop.end) &&
      props.index >= props.comp_loop.start &&
      props.index <= props.comp_loop.end
    ) {
      return true;
    }
    return false;
  });

  return (
    <div
      class={styles.chord}
      style={{
        width: `${100 / props.chords_length}%`,
      }}
      classList={{
        [styles.chord]: true,
        [styles.selected]: isSelected(),
        [styles.focused]: props.focused,
      }}
    >
      <span>{props.chord.value}</span>
    </div>
  );
};

export default function Selection(props) {
  let selection;

  let [isMouseDown, setIsMouseDown] = createSignal(false);
  let [side, setSide] = createSignal();
  let [previous, setPrevious] = createSignal();

  /*   let [left, setLeft] = createSignal(0);
  let [right, setRight] = createSignal(0); */

  let mouseMove = (e) => {
    if (!isMouseDown()) return;

    let delta =
      ((e.clientX - previous()) / selection.parentElement.offsetWidth) * 100;

    if (side() === "left") {
      props.setSelection("start", (start) => start + delta);
    } else if (side() === "right") {
      props.setSelection("end", (end) => end + delta);
    } else if (side() === "center") {
      props.setSelection("start", (start) => start + delta);
      props.setSelection("end", (end) => end + delta);
    }
    setPrevious(e.clientX);
  };

  let resetEvents = () => {
    window.removeEventListener("mousemove", mouseMove, true);
    window.removeEventListener("mouseup", resetEvents, true);
  };

  let mouseDown = (e) => {
    if (!props.editable) return;

    let offset_left =
      (props.zoom.offset / 100) * e.target.parentElement.offsetWidth +
      e.clientX -
      e.target.offsetLeft -
      props.offset_left;

    if (Math.abs(offset_left) < 50) setSide("left");
    else if (Math.abs(offset_left - e.target.offsetWidth) < 50)
      setSide("right");
    else setSide("center");

    console.log(offset_left, side(), props.offset_left);

    setIsMouseDown(true);
    setPrevious(e.clientX);

    window.addEventListener("mousemove", mouseMove, true);
    window.addEventListener("mouseup", resetEvents, true);
  };

  return (
    <>
      <div
        class={styles.selection}
        style={{
          right: 100 - props.audio_loop.end + "%",
          left: props.audio_loop.start + "%",
        }}
        onMouseDown={mouseDown}
        onMouseUp={() => setIsMouseDown(false)}
        ref={selection}
      >
        <For each={props.chords}>
          {(chord, i) => (
            <SelectionChord
              index={i()}
              chord={chord}
              chords_length={props.chords.length}
              mode={props.mode}
              comp_loop={props.comp_loop}
              focused={props.focused_index === i()}
            />
          )}
        </For>
      </div>
    </>
  );
}
