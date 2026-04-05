import {Plugin} from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Extension } from "@tiptap/core";

export function yCursorPlugin(awareness, cursorBuilder) {
  return new Plugin({
    props: {
      decorations(state) {
        const decorations = []

        awareness.getStates().forEach((awState, clientID) => {
          if (!awState.selection || !awState.user) return

          const { anchor, head } = awState.selection
          const { color, name } = awState.user

          if (anchor === head) {
            decorations.push(
              Decoration.widget(anchor, () =>
                cursorBuilder({ color, name })
              )
            )
          } else {
            decorations.push(
              Decoration.inline(
                Math.min(anchor, head),
                Math.max(anchor, head),
                {
                  style: `background-color: ${color}33`
                }
              )
            )
          }
        })

        return DecorationSet.create(state.doc, decorations)
      }
    }
  })
}