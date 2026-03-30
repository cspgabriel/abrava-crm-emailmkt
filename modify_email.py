import re

file_path = r'C:\Users\cspga\Downloads\abravacom-main\abravacom-main\crm\components\EmailMarketing.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove import
content = content.replace("import { TemplateSelectModal } from './TemplateSelectModal';", "")

# 2. Update state vars & ref
content = re.sub(
    r"const \[provider\] = useState<'gmail' \| 'outlook' \| 'workspace' \| 'exchange'>\('workspace'\);\s*const \[editorMode, setEditorMode\] = useState<'visual' \| 'code'>\('visual'\);\s*const \[previewTemplate, setPreviewTemplate\] = useState<any \| null>\(null\);\s*const \[isPreviewSidebarOpen, setIsPreviewSidebarOpen\] = useState\(false\);\s*// Bulk send progress tracking\s*const \[bulkProgress, setBulkProgress\] = useState\(\{ current: 0, total: 0, success: 0, failed: 0 \}\);\s*const \[isBulkSending, setIsBulkSending\] = useState\(false\);\s*const \[isTemplateModalOpen, setIsTemplateModalOpen\] = useState\(false\);\s*const \[serverAuth, setServerAuth\] = useState<\{ authenticated: boolean; account\?: string \} \| null>\(null\);\s*const visualEditorRef = React\.useRef<HTMLDivElement \| null>\(null\);",
    "const [provider] = useState<'gmail' | 'outlook' | 'workspace' | 'exchange'>('workspace');\n  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');\n  const [serverAuth, setServerAuth] = useState<{ authenticated: boolean; account?: string } | null>(null);\n\n  const visualEditorRef = React.useRef<HTMLIFrameElement | null>(null);",
    content
)

# 3. Update useEffect
content = re.sub(
    r"useEffect\(\(\) => \{\s*if \(editorMode === 'visual' && visualEditorRef\.current\) \{\s*if \(visualEditorRef\.current\.innerHTML !== message\) \{\s*visualEditorRef\.current\.innerHTML = message \|\| '<p><br></p>';\s*\}\s*\}\s*\}, \[message, editorMode\]\);",
    "useEffect(() => {\n    if (editorMode === 'visual' && visualEditorRef.current) {\n      const doc = visualEditorRef.current.contentDocument;\n      if (doc && doc.body.innerHTML !== message) {\n        doc.body.innerHTML = message || '<p><br></p>';\n      }\n    }\n  }, [message, editorMode]);",
    content
)

# 4. Remove handleSelectTemplate
content = re.sub(
    r"// Handle template selection(.*?)// Check server auth status on mount",
    "// Check server auth status on mount",
    content,
    flags=re.DOTALL
)

# 5. Remove handlePreview
content = re.sub(
    r"// preview handler from TemplateSelectModal(.*?)// Bulk send",
    "// Bulk send",
    content,
    flags=re.DOTALL
)

# 6. Remove Escolher Template button
content = re.sub(
    r"<button\s*onClick=\{\(\) => setIsTemplateModalOpen\(true\)\}\s*className=\"[^\"]*\"\s*>\s*<Package[^>]*/>\s*🎨 Escolher Template\s*</button>",
    "",
    content,
    flags=re.DOTALL
)

# 7. Update Toolbar & visual editor
toolbar_old = r"""              <div className="p-2 flex gap-2 border-b bg-slate-50">.*?</div>"""
toolbar_new = """              <div className="p-2 flex gap-2 border-b bg-slate-50">
                <button type="button" onClick={() => visualEditorRef.current?.contentDocument?.execCommand('bold')} className="px-2 py-1 bg-white rounded">B</button>
                <button type="button" onClick={() => visualEditorRef.current?.contentDocument?.execCommand('italic')} className="px-2 py-1 bg-white rounded">I</button>
                <button type="button" onClick={() => {
                  const url = prompt('Inserir link (https://...)');
                  if (url) visualEditorRef.current?.contentDocument?.execCommand('createLink', false, url);
                }} className="px-2 py-1 bg-white rounded">Link</button>
                <button type="button" onClick={() => visualEditorRef.current?.contentDocument?.execCommand('unlink')} className="px-2 py-1 bg-white rounded">Remover Link</button>
                <button type="button" onClick={() => {
                  setMessage('');
                  if (visualEditorRef.current?.contentDocument) visualEditorRef.current.contentDocument.body.innerHTML = '';
                }} className="px-2 py-1 bg-red-50 text-red-600 rounded">Limpar</button>
              </div>"""

content = re.sub(toolbar_old, toolbar_new, content, flags=re.DOTALL)

editor_old = r"""<div\s*ref=\{visualEditorRef\}\s*contentEditable\s*suppressContentEditableWarning\s*onInput=\{\(e\) => setMessage\(\(e\.target as HTMLDivElement\)\.innerHTML\)\}\s*className=\"p-4 min-h-\[240px\] max-h-\[60vh\] overflow-auto\"\s*dir=\"ltr\"\s*spellCheck=\{true\}\s*style=\{\{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left', whiteSpace: 'pre-wrap' \}\}\s*/>"""
editor_new = """<iframe
                ref={visualEditorRef}
                onLoad={(e) => {
                  const doc = (e.target as HTMLIFrameElement).contentDocument;
                  if (doc) {
                    doc.designMode = 'on';
                    doc.body.innerHTML = message;
                    doc.body.addEventListener('input', () => {
                      setMessage(doc.body.innerHTML);
                    });
                  }
                }}
                className="w-full min-h-[400px] border-0"
                style={{ backgroundColor: 'white' }}
              />"""

content = re.sub(editor_old, editor_new, content)

# 8. Update Plataforma Dropdown & button
button_old = r"""<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">\s*<div>\s*<label className="block text-sm font-medium text-slate-700 mb-2">Plataforma</label>\s*<select value=\{provider\}.*?</select>\s*</div>\s*<div className="flex items-end">\s*<button.*?📤 Enviar.*?</button>\s*</div>\s*</div>"""
button_new = """<div className="mb-4">
          <button
            onClick={handleSendUnified}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition disabled:opacity-50"
          >
            {loading ? '⏳ Enviando...' : '📤 Enviar Email'}
          </button>
        </div>"""

content = re.sub(button_old, button_new, content, flags=re.DOTALL)

# 9. Remove Modal at the end
modal_pattern = r"\{/\* Template Selection Modal \*/\}(.*?)</div>\s*\);\s*\};\s*$"
content = re.sub(modal_pattern, "</div>\n  );\n};\n", content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS')
