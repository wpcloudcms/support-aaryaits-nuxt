<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder ?? 'Add a description…' }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'tiptap-editor-content outline-none min-h-[120px] text-sm',
    },
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="tiptap-editor rounded-lg border overflow-hidden" style="border-color: var(--border); background: var(--bg-app)">
    <!-- Toolbar -->
    <div class="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap" style="border-color: var(--border)">
      <button type="button" @click="editor?.chain().focus().toggleBold().run()"
        :class="editor?.isActive('bold') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs font-bold w-6 h-6 flex items-center justify-center" title="Bold">
        B
      </button>
      <button type="button" @click="editor?.chain().focus().toggleItalic().run()"
        :class="editor?.isActive('italic') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs italic w-6 h-6 flex items-center justify-center" title="Italic">
        I
      </button>
      <button type="button" @click="editor?.chain().focus().toggleStrike().run()"
        :class="editor?.isActive('strike') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs line-through w-6 h-6 flex items-center justify-center" title="Strikethrough">
        S
      </button>
      <button type="button" @click="editor?.chain().focus().toggleCode().run()"
        :class="editor?.isActive('code') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs font-mono w-6 h-6 flex items-center justify-center" title="Inline code">
        `
      </button>
      <span class="w-px h-4 mx-1" style="background: var(--border)" />
      <button type="button" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="editor?.isActive('heading', { level: 2 }) ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs w-6 h-6 flex items-center justify-center font-semibold" title="Heading">
        H
      </button>
      <button type="button" @click="editor?.chain().focus().toggleBulletList().run()"
        :class="editor?.isActive('bulletList') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs w-6 h-6 flex items-center justify-center" title="Bullet list">
        <Icon name="lucide:list" class="w-3.5 h-3.5" />
      </button>
      <button type="button" @click="editor?.chain().focus().toggleOrderedList().run()"
        :class="editor?.isActive('orderedList') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs w-6 h-6 flex items-center justify-center" title="Numbered list">
        <Icon name="lucide:list-ordered" class="w-3.5 h-3.5" />
      </button>
      <button type="button" @click="editor?.chain().focus().toggleBlockquote().run()"
        :class="editor?.isActive('blockquote') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs w-6 h-6 flex items-center justify-center" title="Blockquote">
        <Icon name="lucide:quote" class="w-3.5 h-3.5" />
      </button>
      <button type="button" @click="editor?.chain().focus().toggleCodeBlock().run()"
        :class="editor?.isActive('codeBlock') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs w-6 h-6 flex items-center justify-center font-mono" title="Code block">
        <Icon name="lucide:code-2" class="w-3.5 h-3.5" />
      </button>
      <span class="w-px h-4 mx-1" style="background: var(--border)" />
      <button type="button" @click="editor?.chain().focus().undo().run()"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs w-6 h-6 flex items-center justify-center" style="color: var(--text-3)" title="Undo">
        <Icon name="lucide:undo-2" class="w-3.5 h-3.5" />
      </button>
      <button type="button" @click="editor?.chain().focus().redo().run()"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs w-6 h-6 flex items-center justify-center" style="color: var(--text-3)" title="Redo">
        <Icon name="lucide:redo-2" class="w-3.5 h-3.5" />
      </button>
    </div>
    <!-- Editor area -->
    <div class="px-3 py-2.5">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style>
.tiptap-editor-content p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--text-3);
}
.tiptap-editor-content > * + * { margin-top: 0.5rem; }
.tiptap-editor-content h2 { font-size: 1rem; font-weight: 600; color: var(--text-1); }
.tiptap-editor-content ul { list-style: disc; padding-left: 1.25rem; color: var(--text-1); }
.tiptap-editor-content ol { list-style: decimal; padding-left: 1.25rem; color: var(--text-1); }
.tiptap-editor-content blockquote { border-left: 3px solid var(--accent); padding-left: 0.75rem; color: var(--text-2); font-style: italic; }
.tiptap-editor-content code { background: var(--bg-hover); padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8em; color: var(--accent); }
.tiptap-editor-content pre { background: var(--bg-hover); padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; }
.tiptap-editor-content pre code { background: none; padding: 0; color: var(--text-1); }
.tiptap-editor-content p { color: var(--text-1); }
.tiptap-editor-content strong { font-weight: 600; }
</style>
