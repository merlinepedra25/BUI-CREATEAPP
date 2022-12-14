import { LitElement, html, css } from 'lit'

customElements.define('b-root-titlebar', class extends LitElement{

    static get properties(){return {
        title: {type: String},
    }}

    static get styles(){return css`
        :host {
            display: flex;
            align-items: center;
            gap: .35em;
            position:relative;
            padding-left: .35em;
            padding-right: 1em;
            /* margin-right: .5em; */
            align-self: stretch;
            /* border-right: solid 2px var(--theme-bgd-accent); */
        }

        b-text[lg] {
            margin-bottom: -.15em; /* make up for descenders */
        }

        b-btn {
            margin-left: -.5em;
        }

        [icon="down-open"] {
            width: 1.95rem;
            height: 1.85rem;
            flex-shrink: 0;
        }

        [icon="down-open"]::part(main) {
            padding-top: 0;
            padding-bottom: 0;
        }

        [icon="down-open"]::part(icon) {
            --size: 1.5rem;
        }
    `}

    firstUpdated(){
        if( this.slot ) return
        
        if( this.parentElement && this.parentElement.tagName == 'B-LIST' )
            this.slot = 'toolbar:before'
        else if( this.panel )
            this.slot = 'close-btn'
    }

    close(){
        this.panel&&this.panel.close()
    }

    get panel(){
        return this.getRootNode().host.panel
    }

    get titleVal(){
        return this.title || (this.panel&&this.panel.title) 
        || (this.parentElement && this.parentElement.host && this.parentElement.host.constructor.title)
    }

    render(){return html`

        ${this.panel?html`
            <b-btn text icon="down-open" part="close-btn" @click=${this.close}></b-btn>
        `:''}

        <slot name="left"></slot>

        <b-text md xbold>
            <slot name="title">
                <slot name="title:before"></slot>
                ${this.titleVal}
                <slot name="title:after"></slot>
            </slot>            
        </b-text>

        <slot></slot>
    `}

})


export default customElements.get('b-root-titlebar')