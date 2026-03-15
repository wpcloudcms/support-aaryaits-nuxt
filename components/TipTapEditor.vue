<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'

const props = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder ?? 'Add a description…' }),
    Image.configure({ inline: false, allowBase64: true }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'tiptap-link' } }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
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

// ── HTML source mode ──────────────────────────────────────────
const htmlMode = ref(false)
const rawHtml = ref('')

function toggleHtmlMode() {
  if (!htmlMode.value) {
    rawHtml.value = editor.value?.getHTML() ?? ''
    htmlMode.value = true
  } else {
    editor.value?.commands.setContent(rawHtml.value, false)
    emit('update:modelValue', rawHtml.value)
    htmlMode.value = false
  }
}

// ── Link dialog ───────────────────────────────────────────────
const showLinkDialog = ref(false)
const linkUrl = ref('')

function openLinkDialog() {
  const existing = editor.value?.getAttributes('link').href ?? ''
  linkUrl.value = existing
  showLinkDialog.value = true
}

function applyLink() {
  if (!linkUrl.value.trim()) {
    editor.value?.chain().focus().unsetLink().run()
  } else {
    editor.value?.chain().focus().setLink({ href: linkUrl.value.trim() }).run()
  }
  showLinkDialog.value = false
  linkUrl.value = ''
}

// ── Image dialog ──────────────────────────────────────────────
const showImageDialog = ref(false)
const imageUrl = ref('')
const imageUploading = ref(false)
const { uploadImage } = useWordPress()

function openImageDialog() {
  showImageDialog.value = true
  imageUrl.value = ''
}

function applyImageUrl() {
  if (imageUrl.value.trim()) {
    editor.value?.chain().focus().setImage({ src: imageUrl.value.trim() }).run()
  }
  showImageDialog.value = false
  imageUrl.value = ''
}

async function onImageFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageUploading.value = true
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const res = await uploadImage(reader.result as string)
      editor.value?.chain().focus().setImage({ src: res.url }).run()
    } catch {
      // fallback: embed as base64 if upload fails
      editor.value?.chain().focus().setImage({ src: reader.result as string }).run()
    }
    imageUploading.value = false
    showImageDialog.value = false
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="tiptap-editor rounded-lg border overflow-hidden" style="border-color: var(--border); background: var(--bg-app)">
    <!-- Toolbar -->
    <div class="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap" style="border-color: var(--border)">
      <button type="button" @click="editor?.chain().focus().toggleBold().run()"
        :class="editor?.isActive('bold') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs font-bold w-6 h-6 flex items-center justify-center" title="Bold">B</button>
      <button type="button" @click="editor?.chain().focus().toggleItalic().run()"
        :class="editor?.isActive('italic') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs italic w-6 h-6 flex items-center justify-center" title="Italic">I</button>
      <button type="button" @click="editor?.chain().focus().toggleStrike().run()"
        :class="editor?.isActive('strike') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs line-through w-6 h-6 flex items-center justify-center" title="Strikethrough">S</button>
      <button type="button" @click="editor?.chain().focus().toggleCode().run()"
        :class="editor?.isActive('code') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs font-mono w-6 h-6 flex items-center justify-center" title="Inline code">`</button>
      <span class="w-px h-4 mx-1" style="background: var(--border)" />
      <button type="button" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="editor?.isActive('heading', { level: 2 }) ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs font-semibold w-7 h-6 flex items-center justify-center" title="Heading 2">H2</button>
      <button type="button" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="editor?.isActive('heading', { level: 3 }) ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs font-semibold w-7 h-6 flex items-center justify-center" title="Heading 3">H3</button>
      <button type="button" @click="editor?.chain().focus().toggleBulletList().run()"
        :class="editor?.isActive('bulletList') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Bullet list">
        <Icon name="lucide:list" class="w-3.5 h-3.5" /></button>
      <button type="button" @click="editor?.chain().focus().toggleOrderedList().run()"
        :class="editor?.isActive('orderedList') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Numbered list">
        <Icon name="lucide:list-ordered" class="w-3.5 h-3.5" /></button>
      <button type="button" @click="editor?.chain().focus().toggleBlockquote().run()"
        :class="editor?.isActive('blockquote') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Blockquote">
        <Icon name="lucide:quote" class="w-3.5 h-3.5" /></button>
      <button type="button" @click="editor?.chain().focus().toggleCodeBlock().run()"
        :class="editor?.isActive('codeBlock') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Code block">
        <Icon name="lucide:code-2" class="w-3.5 h-3.5" /></button>
      <span class="w-px h-4 mx-1" style="background: var(--border)" />
      <!-- Alignment -->
      <button type="button" @click="editor?.chain().focus().setTextAlign('left').run()"
        :class="editor?.isActive({ textAlign: 'left' }) ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Align left">
        <Icon name="lucide:align-left" class="w-3.5 h-3.5" /></button>
      <button type="button" @click="editor?.chain().focus().setTextAlign('center').run()"
        :class="editor?.isActive({ textAlign: 'center' }) ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Align center">
        <Icon name="lucide:align-center" class="w-3.5 h-3.5" /></button>
      <button type="button" @click="editor?.chain().focus().setTextAlign('right').run()"
        :class="editor?.isActive({ textAlign: 'right' }) ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Align right">
        <Icon name="lucide:align-right" class="w-3.5 h-3.5" /></button>
      <button type="button" @click="editor?.chain().focus().setTextAlign('justify').run()"
        :class="editor?.isActive({ textAlign: 'justify' }) ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Align justify">
        <Icon name="lucide:align-justify" class="w-3.5 h-3.5" /></button>
      <span class="w-px h-4 mx-1" style="background: var(--border)" />
      <!-- Link -->
      <button type="button" @click="openLinkDialog"
        :class="editor?.isActive('link') ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" title="Insert link">
        <Icon name="lucide:link" class="w-3.5 h-3.5" /></button>
      <!-- Image -->
      <button type="button" @click="openImageDialog"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" style="color: var(--text-2)" title="Insert image">
        <Icon name="lucide:image" class="w-3.5 h-3.5" /></button>
      <span class="w-px h-4 mx-1" style="background: var(--border)" />
      <button type="button" @click="editor?.chain().focus().undo().run()"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" style="color: var(--text-3)" title="Undo">
        <Icon name="lucide:undo-2" class="w-3.5 h-3.5" /></button>
      <button type="button" @click="editor?.chain().focus().redo().run()"
        class="p-1 rounded hover:bg-[var(--bg-hover)] w-6 h-6 flex items-center justify-center" style="color: var(--text-3)" title="Redo">
        <Icon name="lucide:redo-2" class="w-3.5 h-3.5" /></button>
      <span class="w-px h-4 mx-1" style="background: var(--border)" />
      <!-- HTML source toggle -->
      <button type="button" @click="toggleHtmlMode"
        :class="htmlMode ? 'bg-[var(--bg-active)] text-[var(--accent)]' : 'text-[var(--text-2)]'"
        class="p-1 rounded hover:bg-[var(--bg-hover)] text-xs font-mono px-1.5 h-6 flex items-center justify-center" title="View/Edit HTML">&lt;/&gt;</button>
    </div>

    <!-- Editor area -->
    <div class="px-3 py-2.5" style="background: var(--bg-card)">
      <EditorContent v-if="!htmlMode" :editor="editor" />
      <textarea v-else v-model="rawHtml"
        class="w-full outline-none resize-y font-mono text-xs min-h-[120px]"
        style="background: var(--bg-card); color: var(--text-1); line-height: 1.6"
        spellcheck="false" />
    </div>

    <!-- Link dialog -->
    <div v-if="showLinkDialog" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      @click.self="showLinkDialog = false">
      <div class="rounded-xl p-4 w-80 shadow-xl" style="background: var(--bg-card); border: 1px solid var(--border)">
        <p class="text-xs font-semibold mb-3" style="color: var(--text-1)">Insert Link</p>
        <input v-model="linkUrl" type="url" placeholder="https://example.com" autofocus
          class="w-full px-3 py-1.5 rounded-lg border text-xs outline-none focus:border-[var(--accent)] mb-3"
          style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)"
          @keydown.enter="applyLink" @keydown.esc="showLinkDialog = false" />
        <div class="flex justify-end gap-2">
          <button @click="showLinkDialog = false" class="px-3 py-1 rounded text-xs border"
            style="border-color: var(--border); color: var(--text-2)">Cancel</button>
          <button @click="applyLink" class="px-3 py-1 rounded text-xs text-white"
            style="background: var(--accent)">Apply</button>
        </div>
      </div>
    </div>

    <!-- Image dialog -->
    <div v-if="showImageDialog" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      @click.self="showImageDialog = false">
      <div class="rounded-xl p-4 w-80 shadow-xl" style="background: var(--bg-card); border: 1px solid var(--border)">
        <p class="text-xs font-semibold mb-3" style="color: var(--text-1)">Insert Image</p>
        <p class="text-xs mb-1.5" style="color: var(--text-3)">Paste a URL</p>
        <input v-model="imageUrl" type="url" placeholder="https://example.com/image.png"
          class="w-full px-3 py-1.5 rounded-lg border text-xs outline-none focus:border-[var(--accent)] mb-3"
          style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)"
          @keydown.enter="applyImageUrl" @keydown.esc="showImageDialog = false" />
        <p class="text-xs mb-1.5" style="color: var(--text-3)">Or upload a file <span v-if="imageUploading" style="color:var(--accent)">(uploading…)</span></p>
        <input ref="imageFileInput" type="file" accept="image/*" class="w-full text-xs mb-3" :disabled="imageUploading"
          style="color: var(--text-2)" @change="onImageFileChange" />
        <div class="flex justify-end gap-2">
          <button @click="showImageDialog = false" class="px-3 py-1 rounded text-xs border"
            style="border-color: var(--border); color: var(--text-2)">Cancel</button>
          <button @click="applyImageUrl" :disabled="!imageUrl.trim()" class="px-3 py-1 rounded text-xs text-white disabled:opacity-50"
            style="background: var(--accent)">Insert URL</button>
        </div>
      </div>
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
.tiptap-editor-content h3 { font-size: 0.875rem; font-weight: 600; color: var(--text-1); }
.tiptap-editor-content ul { list-style: disc; padding-left: 1.25rem; color: var(--text-1); }
.tiptap-editor-content ol { list-style: decimal; padding-left: 1.25rem; color: var(--text-1); }
.tiptap-editor-content blockquote { border-left: 3px solid var(--accent); padding-left: 0.75rem; color: var(--text-2); font-style: italic; }
.tiptap-editor-content code { background: var(--bg-hover); padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8em; color: var(--accent); }
.tiptap-editor-content pre { background: var(--bg-hover); padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; }
.tiptap-editor-content pre code { background: none; padding: 0; color: var(--text-1); }
.tiptap-editor-content p { color: var(--text-1); }
.tiptap-editor-content strong { font-weight: 600; }
.tiptap-editor-content img { max-width: 100%; border-radius: 0.5rem; margin: 0.25rem 0; }
.tiptap-link { color: var(--accent); text-decoration: underline; cursor: pointer; }
</style>
