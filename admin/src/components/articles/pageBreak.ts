/**
 * admin/src/components/articles/pageBreak.ts
 * Custom TipTap node: penanda batas halaman untuk pagination artikel di frontend.
 */
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /** Sisipkan penanda batas halaman pada posisi kursor. */
      setPageBreak: () => ReturnType;
    };
  }
}

/** Node atom level-blok; serialisasi sebagai { type: 'pageBreak' } di JSON dokumen. */
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'hr[data-page-break]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-page-break': 'true', class: 'page-break' }),
      ['span', {}, 'Batas Halaman'],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },
});
