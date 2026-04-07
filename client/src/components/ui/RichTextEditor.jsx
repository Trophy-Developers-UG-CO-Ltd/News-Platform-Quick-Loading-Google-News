/**
 * RichTextEditor — Tiptap-based premium rich text editor
 * Outputs HTML stored directly in MongoDB as a string.
 * @module components/ui/RichTextEditor
 */
import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  FiBold, FiItalic, FiList, FiLink, FiType, FiAlignLeft,
  FiAlignCenter, FiAlignRight, FiCode, FiMinus,
} from 'react-icons/fi';
import { Heading1, Heading2, Heading3, ListOrdered, Quote, Undo2, Redo2 } from 'lucide-react';

// ─── Toolbar button ────────────────────────────────────────────────────────────
const ToolBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={title}
    className={[
      'p-1.5 rounded transition-colors text-sm',
      active
        ? 'bg-primary-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      disabled ? 'opacity-40 cursor-not-allowed' : '',
    ].join(' ')}
  >
    {children}
  </button>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => <span className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;

// ─── Toolbar ─────────────────────────────────────────────────────────────────
const Toolbar = ({ editor }) => {
  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {/* History */}
      <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      {/* Headings */}
      <ToolBtn title="Heading 1" active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      {/* Inline formatting */}
      <ToolBtn title="Bold" active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}>
        <FiBold className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Italic" active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}>
        <FiItalic className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Code" active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}>
        <FiCode className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn title="Bullet list" active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <FiList className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Ordered list" active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Blockquote" active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Divider line"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <FiMinus className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn title="Align left" active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <FiAlignLeft className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Align center" active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <FiAlignCenter className="h-4 w-4" />
      </ToolBtn>
      <ToolBtn title="Align right" active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <FiAlignRight className="h-4 w-4" />
      </ToolBtn>

      <Divider />

      {/* Link */}
      <ToolBtn title="Insert / edit link" active={editor.isActive('link')} onClick={setLink}>
        <FiLink className="h-4 w-4" />
      </ToolBtn>
    </div>
  );
};

// ─── Main RichTextEditor ──────────────────────────────────────────────────────
/**
 * @param {string}   value        - HTML string (from state / DB)
 * @param {function} onChange     - called with new HTML string on every change
 * @param {string}   placeholder  - placeholder text (optional)
 * @param {number}   minHeight    - editor minimum height in px (default 220)
 * @param {boolean}  disabled     - disable editing
 */
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Write a detailed description…',
  minHeight = 220,
  disabled = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange?.(html);
    },
  });

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-shadow bg-white ${disabled ? 'opacity-60' : ''}`}>
      <Toolbar editor={editor} />

      <EditorContent
        editor={editor}
        className="rich-editor-content px-4 py-3 text-gray-700 text-sm"
        style={{ minHeight }}
      />
    </div>
  );
};

export default RichTextEditor;
