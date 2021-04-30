import { LitElement, html, css } from 'lit-element'
import { Editor } from '@tiptap/core'
import { defaultExtensions } from '@tiptap/starter-kit'
import { SmartCharacterReplacer } from './smart-character-replacer'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import './menubar'
import style from './style'

customElements.define('text-editor', class extends LitElement{

    static get properties(){return {
        menubar: {type: Boolean},
        disabled: {type: Boolean, reflect: true},
        placeholder: {type: String}
    }}

    static get styles(){return [style, css`
        :host {
            display: block;
            position:relative;
        }

        :host([disabled]) b-text-editor-menubar {
            pointer-events: none;
        }

    `]}

    constructor(){
        super()
        // this.value = '<p>Testing content here</p>'
    }

    connectedCallback(){
        super.connectedCallback()

        clearTimeout(this._cleanupTimeout)
        if( this.editor ) return

        this.editor = new Editor({
            extensions: [
                ...defaultExtensions(),
                Placeholder,
                TextAlign,
                SmartCharacterReplacer
            ],
            editorProps: {
                attributes: {
                    part: 'content'
                }
            },
            editable: !this.disabled,
            injectCSS: false,
            content: this.value,
            onUpdate: this.onEditorUpdate.bind(this),
            onBlur: this.onBlur.bind(this)
        })

        setTimeout(()=>{
            this.shadowRoot.querySelector('main').prepend(this.editor.options.element)
        })

        this.toggleAttribute('empty', this.isEmpty)
    }

    disconnectedCallback(){
        super.disconnectedCallback()
        // delay cleanup in case quickly reconnected
        this._cleanupTimeout = setTimeout(()=>{
            this.editor.destroy()
            delete this.editor
        },10)
    }

    render(){return html`
        <main></main>
        ${this.menubar?html`
            <b-text-editor-menubar part="menubar" .editor=${this.editor} ?disabled=${this.disabled}>
                <slot name="menubar:left" slot="left"></slot>
                <slot name="menubar:right" slot="right"></slot>
            </b-text-editor-menubar>
        `:''}
    `}

    focus(){
        this.editor.commands.focus()
    }

    onBlur(){
         
        var event = new CustomEvent('change', {
			bubbles: true,
			composed: true,
			detail: {
				value: this.value,
			}
		});

        this.dispatchEvent(event)
    }

    get value(){
        return this.__val = this.editor ? this.editor.getHTML() : (this.__val||'')
    }

    set value(val){
        if( this.__val == val ) return
        this.__val = val
        if( this.editor )
            this.editor.commands.setContent(val)
        
        this.toggleAttribute('empty', this.isEmpty)
    }

    get isEmpty(){
        return !this.editor||this.editor.isEmpty
    }

    onEditorUpdate(){
        this.toggleAttribute('empty', this.isEmpty)

        this.dispatchEvent(new Event('text-change'))
    }

    set placeholder(val){
        let oldVal = this.placeholder
        this.__placeholder = val
        this.requestUpdate('placeholder', oldVal)
        if( val )
            this.style.setProperty('--placeholder', `'${val}'`)
        else
            this.style.removeProperty('--placeholder')
    }
    
    get placeholder(){ return this.__placeholder}

    set disabled(val){
        let oldVal = this.disabled
        this.__disabled = val
        this.requestUpdate('disabled', oldVal)
        this.editor&&this.editor.setEditable(!val)
    }
    
    get disabled(){ return this.__disabled}

})
