import {
  createIntersectionObserver,
  createVisibilityObserver,
} from "@solid-primitives/intersection-observer";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  Show,
} from "solid-js";
import styles from "./Chords.module.css";
import check from "./helpers/check";

const Chord = (props) => {
  let input, element;
  let [up, setUp] = createSignal(0);
  let [down, setDown] = createSignal(0);

  let [initial] = createSignal(props.chord);

  let isSelected = createMemo(() => {
    if (props.mode === "full") return true;
    if (props.mode === "edit") return false;
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

  createEffect(() => {
    if (!element) return;

    if (
      props.playing &&
      props.index - props.focused_index === 4 /* ||
      props.index === props.focused_index */
    ) {
      if (isVisible()) return;
      element.scrollIntoView(false);
      element.parentElement.scrollTop -= 1;
    }
  });

  const [isVisible, { start, stop, instance }] = createVisibilityObserver(
    () => element
  );

  return (
    <>
      <div
        ref={element}
        classList={{
          [styles.chord]: true,
          [styles.selected]: isSelected(),
          [styles.focused]: props.focused,
        }}
        onmouseup={() => {
          if (performance.now() - down() < 500) {
            if (props.mode === "edit") {
              input.focus();
            }
            props.selectChord();
          }
          setUp(performance.now());
        }}
        onmousedown={() => setDown(performance.now())}
      >
        <input
          ref={input}
          class={styles.chord_inputs}
          value={initial()}
          type="text"
          spellcheck="false"
          placeholder="enter chord"
          onKeyUp={(e) => props.setChord(e.target.value)}
        />
        <Show when={props.mode === "edit"}>
          <button class={styles.chords_button} onClick={props.deleteChord}>
            ✕
          </button>
        </Show>
      </div>
    </>
  );
};

export default function Chords(props) {
  let new_chord;

  return (
    <div class={styles.chords}>
      <For each={props.chords}>
        {(chord, i) => (
          <Chord
            index={i()}
            chord={chord.value}
            selected={chord.selected}
            setChord={(value) => props.setChord(i(), value)}
            deleteChord={() => props.deleteChord(i())}
            selectChord={() => props.selectChord(i())}
            focused={props.focused_index === i()}
            focused_index={props.focused_index}
            mode={props.mode}
            comp_loop={props.comp_loop}
            observer={props.observer}
            playing={props.playing}
          />
        )}
      </For>
      <Show when={props.mode === "edit"}>
        <div class={styles.chord} onmouseup={() => new_chord.focus()}>
          <input
            ref={new_chord}
            class={styles.chord_inputs}
            placeholder="enter chord"
            type="text"
            spellcheck="false"
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                if (!new_chord.value) return;
                props.addChord(e.target.value);
                e.target.value = "";
                e.target.focus();
              }
            }}
          />
        </div>
      </Show>
    </div>
  );
}
