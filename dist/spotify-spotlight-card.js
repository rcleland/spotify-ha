/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$2=globalThis,e$2=t$2.ShadowRoot&&(void 0===t$2.ShadyCSS||t$2.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$2=Symbol(),o$4=new WeakMap;let n$3 = class n{constructor(t,e,o){if(this._$cssResult$=true,o!==s$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$2&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$4.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$4.set(s,t));}return t}toString(){return this.cssText}};const r$3=t=>new n$3("string"==typeof t?t:t+"",void 0,s$2),i$3=(t,...e)=>{const o=1===t.length?t[0]:e.reduce((e,s,o)=>e+(t=>{if(true===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new n$3(o,t,s$2)},S$1=(s,o)=>{if(e$2)s.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of o){const o=document.createElement("style"),n=t$2.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$2=e$2?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$3(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$2,defineProperty:e$1,getOwnPropertyDescriptor:h$1,getOwnPropertyNames:r$2,getOwnPropertySymbols:o$3,getPrototypeOf:n$2}=Object,a$1=globalThis,c$1=a$1.trustedTypes,l$1=c$1?c$1.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$2(t,s),b$1={attribute:true,type:String,converter:u$1,reflect:false,useDefault:false,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let y$1 = class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b$1){if(s.state&&(s.attribute=false),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=true),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$1(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h$1(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)??b$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$2(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=true,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...r$2(t),...o$3(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$2(s));}else void 0!==s&&i.push(c$2(s));return i}static _$Eu(t,s){const i=s.attribute;return  false===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=false,this.hasUpdated=false,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(true),this._$EO?.forEach(t=>t.hostConnected?.());}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.());}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&true===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e;const r=h.fromAttribute(s,t.type);this[e]=r??this._$Ej?.get(e)??r,this._$Em=null;}}requestUpdate(t,s,i,e=false,h){if(void 0!==t){const r=this.constructor;if(false===e&&(h=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??f$1)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,s,i);} false===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),true!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),true===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=true;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];true!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=false;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(s)):this._$EM();}catch(s){throw t=false,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return  true}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM();}updated(t){}firstUpdated(t){}};y$1.elementStyles=[],y$1.shadowRootOptions={mode:"open"},y$1[d$1("elementProperties")]=new Map,y$1[d$1("finalized")]=new Map,p$1?.({ReactiveElement:y$1}),(a$1.reactiveElementVersions??=[]).push("2.1.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=globalThis,i$1=t=>t,s$1=t$1.trustedTypes,e=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,h="$lit$",o$2=`lit$${Math.random().toFixed(9).slice(2)}$`,n$1="?"+o$2,r$1=`<${n$1}>`,l=document,c=()=>l.createComment(""),a=t=>null===t||"object"!=typeof t&&"function"!=typeof t,u=Array.isArray,d=t=>u(t)||"function"==typeof t?.[Symbol.iterator],f="[ \t\n\f\r]",v=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,p=RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),g=/'/g,$=/"/g,y=/^(?:script|style|textarea|title)$/i,x=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),b=x(1),E=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),C=new WeakMap,P=l.createTreeWalker(l,129);function V(t,i){if(!u(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==e?e.createHTML(i):i}const N=(t,i)=>{const s=t.length-1,e=[];let n,l=2===i?"<svg>":3===i?"<math>":"",c=v;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,f=0;for(;f<s.length&&(c.lastIndex=f,u=c.exec(s),null!==u);)f=c.lastIndex,c===v?"!--"===u[1]?c=_:void 0!==u[1]?c=m:void 0!==u[2]?(y.test(u[2])&&(n=RegExp("</"+u[2],"g")),c=p):void 0!==u[3]&&(c=p):c===p?">"===u[0]?(c=n??v,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?p:'"'===u[3]?$:g):c===$||c===g?c=p:c===_||c===m?c=v:(c=p,n=void 0);const x=c===p&&t[i+1].startsWith("/>")?" ":"";l+=c===v?s+r$1:d>=0?(e.push(a),s.slice(0,d)+h+s.slice(d)+o$2+x):s+o$2+(-2===d?i:x);}return [V(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),e]};class S{constructor({strings:t,_$litType$:i},e){let r;this.parts=[];let l=0,a=0;const u=t.length-1,d=this.parts,[f,v]=N(t,i);if(this.el=S.createElement(f,e),P.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=P.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(h)){const i=v[a++],s=r.getAttribute(t).split(o$2),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:l,name:e[2],strings:s,ctor:"."===e[1]?I:"?"===e[1]?L:"@"===e[1]?z:H}),r.removeAttribute(t);}else t.startsWith(o$2)&&(d.push({type:6,index:l}),r.removeAttribute(t));if(y.test(r.tagName)){const t=r.textContent.split(o$2),i=t.length-1;if(i>0){r.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)r.append(t[s],c()),P.nextNode(),d.push({type:2,index:++l});r.append(t[i],c());}}}else if(8===r.nodeType)if(r.data===n$1)d.push({type:2,index:l});else {let t=-1;for(;-1!==(t=r.data.indexOf(o$2,t+1));)d.push({type:7,index:l}),t+=o$2.length-1;}l++;}}static createElement(t,i){const s=l.createElement("template");return s.innerHTML=t,s}}function M(t,i,s=t,e){if(i===E)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=a(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(false),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=M(t,h._$AS(t,i.values),h,e)),i}class R{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??l).importNode(i,true);P.currentNode=e;let h=P.nextNode(),o=0,n=0,r=s[0];for(;void 0!==r;){if(o===r.index){let i;2===r.type?i=new k(h,h.nextSibling,this,t):1===r.type?i=new r.ctor(h,r.name,r.strings,this,t):6===r.type&&(i=new Z(h,this,t)),this._$AV.push(i),r=s[++n];}o!==r?.index&&(h=P.nextNode(),o++);}return P.currentNode=l,e}p(t){let i=0;for(const s of this._$AV) void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class k{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??true;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=M(this,t,i),a(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==E&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):d(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==A&&a(this._$AH)?this._$AA.nextSibling.data=t:this.T(l.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=S.createElement(V(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new R(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=C.get(t.strings);return void 0===i&&C.set(t.strings,i=new S(t)),i}k(t){u(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new k(this.O(c()),this.O(c()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(false,true,s);t!==this._$AB;){const s=i$1(t).nextSibling;i$1(t).remove(),t=s;}}setConnected(t){ void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class H{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=A;}_$AI(t,i=this,s,e){const h=this.strings;let o=false;if(void 0===h)t=M(this,t,i,0),o=!a(t)||t!==this._$AH&&t!==E,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=M(this,e[s+n],i,n),r===E&&(r=this._$AH[n]),o||=!a(r)||r!==this._$AH[n],r===A?t=A:t!==A&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class I extends H{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===A?void 0:t;}}class L extends H{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==A);}}class z extends H{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=M(this,t,i,0)??A)===E)return;const s=this._$AH,e=t===A&&s!==A||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==A&&(s===A||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class Z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){M(this,t);}}const B=t$1.litHtmlPolyfillSupport;B?.(S,k),(t$1.litHtmlVersions??=[]).push("3.3.2");const D=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new k(i.insertBefore(c(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const s=globalThis;class i extends y$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const r=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=D(r,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(true);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(false);}render(){return E}}i._$litElement$=true,i["finalized"]=true,s.litElementHydrateSupport?.({LitElement:i});const o$1=s.litElementPolyfillSupport;o$1?.({LitElement:i});(s.litElementVersions??=[]).push("4.2.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=t=>(e,o)=>{ void 0!==o?o.addInitializer(()=>{customElements.define(t,e);}):customElements.define(t,e);};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o={attribute:true,type:String,converter:u$1,reflect:false,hasChanged:f$1},r=(t=o,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===n&&((t=Object.create(t)).wrapped=true),s.set(r.name,t),"accessor"===n){const{name:o}=r;return {set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t,true,r);},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t,true,r);}}throw Error("Unsupported decorator location: "+n)};function n(t){return (e,o)=>"object"==typeof o?r(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}

const COVER_OPTIONS = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
];
const META_V_OPTIONS = [
    { value: "top", label: "Top — beside art: align to top; centered: under cover" },
    { value: "center", label: "Center (default)" },
    {
        value: "bottom",
        label: "Bottom — beside art: align to bottom; centered: toward controls",
    },
];
const TEMP_UNIT_OPTIONS = [
    { value: "auto", label: "Auto (match Home Assistant)" },
    { value: "celsius", label: "Celsius (°C)" },
    { value: "fahrenheit", label: "Fahrenheit (°F)" },
];
let SpotifySpotlightCardEditor = class SpotifySpotlightCardEditor extends i {
    constructor() {
        super(...arguments);
        this._config = {};
    }
    static { this.styles = i$3 `
    .card-config {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    ha-formfield {
      display: flex;
      align-items: center;
      --ha-formfield-row-gap: 8px;
    }
    ha-textfield {
      width: 100%;
    }
    select.field {
      width: 100%;
      padding: 12px 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    .hint {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      margin: -8px 0 0;
    }
    .field-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color);
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 8px 0 0;
      color: var(--primary-text-color);
    }
    .warn {
      font-size: 0.85rem;
      color: var(--warning-color, #d89614);
      margin: 0;
    }
  `; }
    setConfig(config) {
        this._config = { ...config };
        this.requestUpdate();
    }
    render() {
        const hassForPickers = (this.hass ?? { states: {} });
        const poll = typeof this._config.poll_interval_seconds === "number" &&
            Number.isFinite(this._config.poll_interval_seconds)
            ? String(this._config.poll_interval_seconds)
            : "5";
        const align = this._config.cover_align ?? "center";
        const metaV = this._config.meta_vertical_align === "top" ||
            this._config.meta_vertical_align === "bottom"
            ? this._config.meta_vertical_align
            : "center";
        const tempUnit = this._config.corner_temperature_unit === "celsius" ||
            this._config.corner_temperature_unit === "fahrenheit"
            ? this._config.corner_temperature_unit
            : "auto";
        const showTemp = this._config.show_corner_temperature === true;
        const textScale = typeof this._config.text_scale_percent === "number" &&
            Number.isFinite(this._config.text_scale_percent)
            ? String(Math.round(this._config.text_scale_percent))
            : "200";
        const coverScale = typeof this._config.cover_scale_percent === "number" &&
            Number.isFinite(this._config.cover_scale_percent)
            ? String(Math.round(this._config.cover_scale_percent))
            : "100";
        const upNextScale = typeof this._config.up_next_scale_percent === "number" &&
            Number.isFinite(this._config.up_next_scale_percent)
            ? String(Math.round(this._config.up_next_scale_percent))
            : "100";
        const cornerClimateScale = typeof this._config.corner_climate_scale_percent === "number" &&
            Number.isFinite(this._config.corner_climate_scale_percent)
            ? String(Math.round(this._config.corner_climate_scale_percent))
            : "100";
        return b `
      <div class="card-config">
        ${!this.hass
            ? b `<p class="warn">
              Home Assistant state is not attached yet — entity lists may be empty
              until the editor finishes loading.
            </p>`
            : A}

        <div class="section-title">Spotify player</div>
        <div class="field-label">Media player entity</div>
        <ha-entity-picker
          .hass=${hassForPickers}
          .value=${this._config.entity ?? ""}
          .label=${"Spotify media_player"}
          .includeDomains=${["media_player"]}
          allow-custom-entity
          @value-changed=${this._entityChanged}
        ></ha-entity-picker>
        <p class="hint">
          Choose the Spotify Connect <strong>media_player</strong>. You can also type
          an entity ID if it does not appear in the list.
        </p>

        <ha-textfield
          label="Card title (optional)"
          .value=${this._config.name ?? ""}
          @input=${this._nameChanged}
        ></ha-textfield>

        <div>
          <div class="field-label">Album cover position</div>
          <select
            class="field"
            .value=${align}
            @change=${this._coverAlignChanged}
          >
            ${COVER_OPTIONS.map((o) => b `<option value=${o.value} .selected=${align === o.value}>
                  ${o.label}
                </option>`)}
          </select>
        </div>

        <ha-textfield
          label="Album cover size (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${coverScale}
          @input=${this._coverScaleChanged}
        ></ha-textfield>
        <p class="hint">
          100 = default art size; larger values grow the square cover (capped by card
          width). Same scale in tall layout (larger base art there).
        </p>

        <div>
          <div class="field-label">Now playing text vs album art</div>
          <select
            class="field"
            .value=${metaV}
            @change=${this._metaVerticalChanged}
          >
            ${META_V_OPTIONS.map((o) => b `<option value=${o.value} .selected=${metaV === o.value}>
                  ${o.label}
                </option>`)}
          </select>
        </div>

        <ha-textfield
          label="Title & artist scale (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${textScale}
          @input=${this._textScaleChanged}
        ></ha-textfield>
        <p class="hint">
          Scales the “Now playing” label, title, artist, and progress row (100 = default
          card size, 200 ≈ double).
        </p>

        <ha-textfield
          label="Refresh interval (seconds)"
          type="number"
          inputMode="numeric"
          min="2"
          max="120"
          .value=${poll}
          @input=${this._pollChanged}
        ></ha-textfield>
        <p class="hint">
          How often to ask Home Assistant to refresh this player (position, title, …).
        </p>

        <ha-formfield label="Tall layout (fill panel height)">
          <ha-switch
            .checked=${this._config.tall !== false}
            @change=${this._tallChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield
          label="Show “Media library” button (opens HA Media panel for this player)"
        >
          <ha-switch
            .checked=${this._config.show_browse_media_button !== false}
            @change=${this._browseButtonChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Tablet mode (larger source list touch targets)">
          <ha-switch
            .checked=${this._config.source_tablet_mode === true}
            @change=${this._tabletSourceChanged}
          ></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show “Up next” (custom integration queue attributes)">
          <ha-switch
            .checked=${this._config.show_up_next !== false}
            @change=${this._upNextChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-textfield
          label="“Up next” pane scale (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${upNextScale}
          @input=${this._upNextScaleChanged}
        ></ha-textfield>
        <p class="hint">
          100 = default size for the overlay text, thumbnail, padding, and corner
          position (50–300).
        </p>

        <div class="section-title">Time &amp; temperature (top-left)</div>
        <ha-textfield
          label="Time &amp; temperature pane scale (%)"
          type="number"
          inputMode="numeric"
          min="50"
          max="300"
          .value=${cornerClimateScale}
          @input=${this._cornerClimateScaleChanged}
        ></ha-textfield>
        <p class="hint">
          100 = default for the clock, temperature line, padding, and glass panel
          size (50–300).
        </p>

        <ha-formfield label="Show time">
          <ha-switch
            .checked=${this._config.show_corner_time === true}
            @change=${this._cornerTimeChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield label="Show temperature">
          <ha-switch
            .checked=${showTemp}
            @change=${this._cornerTempEnabledChanged}
          ></ha-switch>
        </ha-formfield>
        <div class="field-label">Temperature entity</div>
        <ha-entity-picker
          .hass=${hassForPickers}
          .value=${this._config.corner_temperature_entity ?? ""}
          .label=${"Weather, sensor, or input_number"}
          .includeDomains=${["weather", "sensor", "input_number"]}
          allow-custom-entity
          .disabled=${!showTemp}
          @value-changed=${this._cornerTempEntityChanged}
        ></ha-entity-picker>
        <p class="hint">
          <strong>weather</strong> uses the <code>temperature</code> attribute;
          <strong>sensor</strong> / <strong>input_number</strong> use the numeric state.
        </p>
        <div>
          <div class="field-label">Temperature display unit</div>
          <select
            class="field"
            .value=${tempUnit}
            .disabled=${!showTemp}
            @change=${this._cornerTempUnitChanged}
          >
            ${TEMP_UNIT_OPTIONS.map((o) => b `<option value=${o.value} .selected=${tempUnit === o.value}>
                  ${o.label}
                </option>`)}
          </select>
        </div>
      </div>
    `;
    }
    _fire(config) {
        this.dispatchEvent(new CustomEvent("config-changed", {
            bubbles: true,
            composed: true,
            detail: { config },
        }));
    }
    _normalized() {
        const c = this._config;
        const pollRaw = c.poll_interval_seconds;
        let poll_interval_seconds = 5;
        if (typeof pollRaw === "number" &&
            Number.isFinite(pollRaw) &&
            pollRaw >= 2 &&
            pollRaw <= 120) {
            poll_interval_seconds = Math.floor(pollRaw);
        }
        const corner_temperature_unit = c.corner_temperature_unit === "celsius" ||
            c.corner_temperature_unit === "fahrenheit"
            ? c.corner_temperature_unit
            : "auto";
        const meta_vertical_align = c.meta_vertical_align === "top" || c.meta_vertical_align === "bottom"
            ? c.meta_vertical_align
            : "center";
        let text_scale_percent = 200;
        const tsp = c.text_scale_percent;
        if (typeof tsp === "number" && Number.isFinite(tsp)) {
            text_scale_percent = Math.min(300, Math.max(50, Math.round(tsp)));
        }
        let cover_scale_percent = 100;
        const csp = c.cover_scale_percent;
        if (typeof csp === "number" && Number.isFinite(csp)) {
            cover_scale_percent = Math.min(300, Math.max(50, Math.round(csp)));
        }
        let up_next_scale_percent = 100;
        const unsp = c.up_next_scale_percent;
        if (typeof unsp === "number" && Number.isFinite(unsp)) {
            up_next_scale_percent = Math.min(300, Math.max(50, Math.round(unsp)));
        }
        let corner_climate_scale_percent = 100;
        const ccsp = c.corner_climate_scale_percent;
        if (typeof ccsp === "number" && Number.isFinite(ccsp)) {
            corner_climate_scale_percent = Math.min(300, Math.max(50, Math.round(ccsp)));
        }
        return {
            type: "custom:spotify-spotlight-card",
            entity: typeof c.entity === "string" ? c.entity : "",
            tall: c.tall !== false,
            name: typeof c.name === "string" && c.name.trim() ? c.name.trim() : undefined,
            show_up_next: c.show_up_next !== false,
            show_browse_media_button: c.show_browse_media_button !== false,
            cover_align: c.cover_align === "left" ||
                c.cover_align === "center" ||
                c.cover_align === "right"
                ? c.cover_align
                : "center",
            cover_scale_percent,
            poll_interval_seconds,
            show_corner_time: c.show_corner_time === true,
            show_corner_temperature: c.show_corner_temperature === true,
            corner_temperature_entity: typeof c.corner_temperature_entity === "string"
                ? c.corner_temperature_entity.trim()
                : undefined,
            corner_temperature_unit,
            meta_vertical_align,
            text_scale_percent,
            source_tablet_mode: c.source_tablet_mode === true,
            up_next_scale_percent,
            corner_climate_scale_percent,
        };
    }
    _merge(partial) {
        this._config = { ...this._config, ...partial };
        const full = this._normalized();
        this._config = full;
        this._fire(full);
    }
    _entityChanged(ev) {
        ev.stopPropagation();
        const raw = ev.detail?.value;
        const entity = typeof raw === "string" ? raw : "";
        this._merge({ entity });
    }
    _nameChanged(ev) {
        const t = ev.target;
        const name = t.value.trim();
        this._merge({ name: name.length ? name : undefined });
    }
    _coverAlignChanged(ev) {
        const t = ev.target;
        const v = t.value;
        this._merge({
            cover_align: v === "left" || v === "center" || v === "right" ? v : "center",
        });
    }
    _coverScaleChanged(ev) {
        const t = ev.target;
        const n = parseInt(t.value, 10);
        if (!Number.isFinite(n)) {
            this._merge({ cover_scale_percent: 100 });
            return;
        }
        this._merge({ cover_scale_percent: Math.min(300, Math.max(50, n)) });
    }
    _metaVerticalChanged(ev) {
        const t = ev.target;
        const v = t.value;
        this._merge({
            meta_vertical_align: v === "top" || v === "bottom" || v === "center" ? v : "center",
        });
    }
    _textScaleChanged(ev) {
        const t = ev.target;
        const n = parseInt(t.value, 10);
        if (!Number.isFinite(n)) {
            this._merge({ text_scale_percent: 200 });
            return;
        }
        this._merge({ text_scale_percent: Math.min(300, Math.max(50, n)) });
    }
    _pollChanged(ev) {
        const t = ev.target;
        const n = parseInt(t.value, 10);
        if (!Number.isFinite(n) || n < 2) {
            this._merge({ poll_interval_seconds: 5 });
            return;
        }
        this._merge({ poll_interval_seconds: Math.min(120, n) });
    }
    _tallChanged(ev) {
        const el = ev.currentTarget;
        this._merge({ tall: el.checked });
    }
    _browseButtonChanged(ev) {
        const el = ev.currentTarget;
        this._merge({ show_browse_media_button: el.checked });
    }
    _tabletSourceChanged(ev) {
        const el = ev.currentTarget;
        this._merge({ source_tablet_mode: el.checked });
    }
    _upNextChanged(ev) {
        const el = ev.currentTarget;
        this._merge({ show_up_next: el.checked });
    }
    _upNextScaleChanged(ev) {
        const t = ev.target;
        const n = parseInt(t.value, 10);
        if (!Number.isFinite(n)) {
            this._merge({ up_next_scale_percent: 100 });
            return;
        }
        this._merge({ up_next_scale_percent: Math.min(300, Math.max(50, n)) });
    }
    _cornerClimateScaleChanged(ev) {
        const t = ev.target;
        const n = parseInt(t.value, 10);
        if (!Number.isFinite(n)) {
            this._merge({ corner_climate_scale_percent: 100 });
            return;
        }
        this._merge({ corner_climate_scale_percent: Math.min(300, Math.max(50, n)) });
    }
    _cornerTimeChanged(ev) {
        const el = ev.currentTarget;
        this._merge({ show_corner_time: el.checked });
    }
    _cornerTempEnabledChanged(ev) {
        const el = ev.currentTarget;
        this._merge({ show_corner_temperature: el.checked });
    }
    _cornerTempEntityChanged(ev) {
        ev.stopPropagation();
        const raw = ev.detail?.value;
        const corner_temperature_entity = typeof raw === "string" ? raw.trim() : "";
        this._merge({
            corner_temperature_entity: corner_temperature_entity.length
                ? corner_temperature_entity
                : undefined,
        });
    }
    _cornerTempUnitChanged(ev) {
        const t = ev.target;
        const v = t.value;
        this._merge({
            corner_temperature_unit: v === "celsius" || v === "fahrenheit" || v === "auto" ? v : "auto",
        });
    }
};
__decorate([
    n({ attribute: false, type: Object })
], SpotifySpotlightCardEditor.prototype, "hass", void 0);
__decorate([
    n({ type: Object })
], SpotifySpotlightCardEditor.prototype, "_config", void 0);
SpotifySpotlightCardEditor = __decorate([
    t("spotify-spotlight-card-editor")
], SpotifySpotlightCardEditor);

/** Same as Home Assistant `MediaPlayerEntityFeature.BROWSE_MEDIA` */
const MEDIA_PLAYER_FEATURE_BROWSE_MEDIA = 1 << 17;
window.customCards = window.customCards ?? [];
window.customCards.push({
    type: "spotify-spotlight-card",
    name: "Spotify Spotlight",
    description: "Spotify controls with blurred artwork, volume, up next, and Media panel link",
    preview: true,
});
let SpotifySpotlightCard = class SpotifySpotlightCard extends i {
    static getStubConfig() {
        return {
            type: "custom:spotify-spotlight-card",
            entity: "",
            tall: true,
            show_up_next: true,
            show_browse_media_button: true,
            cover_align: "center",
            cover_scale_percent: 100,
            poll_interval_seconds: 5,
            show_corner_time: false,
            show_corner_temperature: false,
            corner_temperature_unit: "auto",
            meta_vertical_align: "center",
            text_scale_percent: 200,
            source_tablet_mode: false,
            up_next_scale_percent: 100,
            corner_climate_scale_percent: 100,
        };
    }
    static getConfigElement() {
        return document.createElement("spotify-spotlight-card-editor");
    }
    /** Home Assistant invokes this — not Lit's @property setter. */
    setConfig(config) {
        if (!config || typeof config !== "object") {
            throw new Error("Invalid configuration");
        }
        const raw = config;
        const entityRaw = raw.entity;
        if (entityRaw !== undefined &&
            entityRaw !== null &&
            typeof entityRaw !== "string") {
            throw new Error("entity must be a string");
        }
        const entity = typeof entityRaw === "string" ? entityRaw.trim() : "";
        const pollRaw = raw.poll_interval_seconds;
        const poll_interval_seconds = typeof pollRaw === "number" &&
            Number.isFinite(pollRaw) &&
            pollRaw >= 2 &&
            pollRaw <= 120
            ? Math.floor(pollRaw)
            : 5;
        const ca = raw.cover_align;
        const cover_align = ca === "left" || ca === "center" || ca === "right" ? ca : "center";
        const ctu = raw.corner_temperature_unit;
        const corner_temperature_unit = ctu === "celsius" || ctu === "fahrenheit" || ctu === "auto" ? ctu : "auto";
        const cteRaw = raw.corner_temperature_entity;
        const corner_temperature_entity = typeof cteRaw === "string" ? cteRaw.trim() : undefined;
        const mva = raw.meta_vertical_align;
        const meta_vertical_align = mva === "top" || mva === "bottom" || mva === "center" ? mva : "center";
        const tspRaw = raw.text_scale_percent;
        let text_scale_percent = 200;
        if (typeof tspRaw === "number" &&
            Number.isFinite(tspRaw)) {
            text_scale_percent = Math.min(300, Math.max(50, Math.round(tspRaw)));
        }
        const cspRaw = raw.cover_scale_percent;
        let cover_scale_percent = 100;
        if (typeof cspRaw === "number" && Number.isFinite(cspRaw)) {
            cover_scale_percent = Math.min(300, Math.max(50, Math.round(cspRaw)));
        }
        const unspRaw = raw.up_next_scale_percent;
        let up_next_scale_percent = 100;
        if (typeof unspRaw === "number" && Number.isFinite(unspRaw)) {
            up_next_scale_percent = Math.min(300, Math.max(50, Math.round(unspRaw)));
        }
        const ccspRaw = raw.corner_climate_scale_percent;
        let corner_climate_scale_percent = 100;
        if (typeof ccspRaw === "number" && Number.isFinite(ccspRaw)) {
            corner_climate_scale_percent = Math.min(300, Math.max(50, Math.round(ccspRaw)));
        }
        this.config = {
            type: "custom:spotify-spotlight-card",
            entity,
            tall: raw.tall !== false,
            name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : undefined,
            show_up_next: raw.show_up_next !== false,
            show_browse_media_button: raw.show_browse_media_button !== false,
            cover_align,
            cover_scale_percent,
            poll_interval_seconds,
            show_corner_time: raw.show_corner_time === true,
            show_corner_temperature: raw.show_corner_temperature === true,
            corner_temperature_entity: corner_temperature_entity?.length ? corner_temperature_entity : undefined,
            corner_temperature_unit,
            meta_vertical_align,
            text_scale_percent,
            source_tablet_mode: raw.source_tablet_mode === true,
            up_next_scale_percent,
            corner_climate_scale_percent,
        };
    }
    static { this.styles = i$3 `
    :host {
      display: block;
      height: 100%;
      min-height: 420px;
      --spot-radius: 20px;
      --spot-gap: 16px;
      --spot-text: rgba(255, 255, 255, 0.96);
      --spot-muted: rgba(255, 255, 255, 0.62);
      --spot-glass: rgba(12, 12, 18, 0.38);
      --spot-glass-strong: rgba(12, 12, 18, 0.58);
      --spot-meta-scale: 2;
      --spot-cover-scale: 1;
      --spot-up-next-scale: 1;
      --spot-corner-climate-scale: 1;
      color: var(--spot-text);
      font-family: var(--ha-font-family-body, ui-sans-serif, system-ui);
      -webkit-font-smoothing: antialiased;
    }

    :host([data-tall]) {
      min-height: calc(100vh - 140px);
      height: 100%;
    }

    .card-shell {
      position: relative;
      display: block;
      height: 100%;
      min-height: inherit;
    }

    :host([data-tall]) .card-shell {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .wrap {
      position: relative;
      border-radius: var(--spot-radius);
      overflow: hidden;
      min-height: inherit;
      box-sizing: border-box;
      isolation: isolate;
    }

    :host([data-tall]) .wrap {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .backdrop {
      position: absolute;
      inset: -24px;
      background-size: cover;
      background-position: center;
      filter: blur(36px) saturate(1.15);
      transform: scale(1.06);
      z-index: 0;
    }

    :host([data-tall]) .backdrop {
      inset: 0;
      border-radius: inherit;
      transform: scale(1.12);
      background-position: center top;
    }

    .backdrop-fallback {
      background: linear-gradient(
        145deg,
        rgb(29, 185, 84) 0%,
        rgb(18, 18, 24) 55%,
        rgb(10, 10, 14) 100%
      );
    }

    .scrim {
      position: absolute;
      inset: 0;
      background: radial-gradient(
          ellipse 120% 80% at 50% 0%,
          rgba(0, 0, 0, 0.25) 0%,
          rgba(0, 0, 0, 0.72) 70%
        ),
        linear-gradient(to bottom, rgba(8, 8, 12, 0.2), rgba(8, 8, 14, 0.92));
      z-index: 1;
    }

    .body {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: var(--spot-gap);
      padding: 24px;
      height: 100%;
      min-height: inherit;
      box-sizing: border-box;
    }

    :host([data-tall]) .body {
      flex: 1 1 auto;
      min-height: 0;
      height: auto;
    }

    .bottom-stack {
      display: flex;
      flex-direction: column;
      gap: var(--spot-gap);
      width: 100%;
    }

    :host([data-tall]) .bottom-stack {
      flex-shrink: 0;
      margin-top: auto;
      padding-top: 4px;
    }

    /** Pinned inside .wrap — does not participate in meta/center layout. */
    .up-next {
      position: absolute;
      top: calc(16px * var(--spot-up-next-scale, 1));
      right: calc(16px * var(--spot-up-next-scale, 1));
      left: auto;
      bottom: auto;
      display: flex;
      align-items: center;
      gap: calc(12px * var(--spot-up-next-scale, 1));
      padding: calc(10px * var(--spot-up-next-scale, 1))
        calc(14px * var(--spot-up-next-scale, 1))
        calc(10px * var(--spot-up-next-scale, 1))
        calc(10px * var(--spot-up-next-scale, 1));
      margin: 0;
      max-width: min(
        calc(300px * var(--spot-up-next-scale, 1)),
        calc(100% - 32px)
      );
      box-sizing: border-box;
      z-index: 8;
      background: var(--spot-glass-strong);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border-radius: calc(16px * min(var(--spot-up-next-scale, 1), 1.35));
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 calc(8px * var(--spot-up-next-scale, 1))
        calc(28px * var(--spot-up-next-scale, 1)) rgba(0, 0, 0, 0.35);
      text-align: left;
    }

    .up-next-cover {
      width: calc(56px * var(--spot-up-next-scale, 1));
      height: calc(56px * var(--spot-up-next-scale, 1));
      border-radius: calc(10px * min(var(--spot-up-next-scale, 1), 1.35));
      object-fit: cover;
      flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      background: rgba(0, 0, 0, 0.35);
    }

    .up-next-copy {
      min-width: 0;
      flex: 1;
    }

    .up-next-label {
      font-size: calc(0.68rem * var(--spot-up-next-scale, 1));
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--spot-muted);
      margin: 0 0 calc(4px * var(--spot-up-next-scale, 1));
    }

    .up-next-title {
      margin: 0;
      font-size: calc(0.95rem * var(--spot-up-next-scale, 1));
      font-weight: 600;
      line-height: 1.25;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .up-next-artist {
      margin: calc(4px * var(--spot-up-next-scale, 1)) 0 0;
      font-size: calc(0.82rem * var(--spot-up-next-scale, 1));
      color: var(--spot-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .corner-climate {
      position: absolute;
      top: calc(16px * var(--spot-corner-climate-scale, 1));
      left: calc(16px * var(--spot-corner-climate-scale, 1));
      z-index: 8;
      max-width: min(
        calc(220px * var(--spot-corner-climate-scale, 1)),
        calc(100% - 32px)
      );
      box-sizing: border-box;
      padding: calc(10px * var(--spot-corner-climate-scale, 1))
        calc(14px * var(--spot-corner-climate-scale, 1));
      background: var(--spot-glass-strong);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border-radius: calc(16px * min(var(--spot-corner-climate-scale, 1), 1.35));
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 calc(8px * var(--spot-corner-climate-scale, 1))
        calc(28px * var(--spot-corner-climate-scale, 1)) rgba(0, 0, 0, 0.35);
      text-align: left;
      pointer-events: none;
    }

    .corner-time {
      margin: 0;
      font-size: calc(1.25rem * var(--spot-corner-climate-scale, 1));
      font-weight: 650;
      line-height: 1.2;
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
      text-shadow: 0 1px 12px rgba(0, 0, 0, 0.45);
    }

    .corner-temp {
      margin: calc(4px * var(--spot-corner-climate-scale, 1)) 0 0;
      font-size: calc(0.95rem * var(--spot-corner-climate-scale, 1));
      font-weight: 550;
      color: var(--spot-muted);
      text-shadow: 0 1px 10px rgba(0, 0, 0, 0.4);
    }

    .corner-climate .corner-temp:first-child {
      margin-top: 0;
    }

    .top {
      display: flex;
      gap: 20px;
      align-items: stretch;
      flex-wrap: wrap;
    }

    .top.cover-left,
    .top.cover-right {
      flex-direction: row;
      justify-content: flex-start;
      align-items: stretch;
    }

    .top.cover-right {
      flex-direction: row-reverse;
    }

    .top.cover-left .meta-region,
    .top.cover-right .meta-region {
      flex: 1 1 200px;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .top.cover-left.meta-v-top .meta-region,
    .top.cover-right.meta-v-top .meta-region {
      justify-content: flex-start;
    }

    .top.cover-left.meta-v-center .meta-region,
    .top.cover-right.meta-v-center .meta-region {
      justify-content: center;
    }

    .top.cover-left.meta-v-bottom .meta-region,
    .top.cover-right.meta-v-bottom .meta-region {
      justify-content: flex-end;
    }

    .top.cover-center {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .top.cover-center .meta-region {
      width: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      justify-content: flex-start;
    }

    .top.cover-center.meta-v-top .meta-region {
      justify-content: flex-start;
      margin-top: 0;
    }

    .top.cover-center.meta-v-center .meta-region {
      justify-content: center;
      margin-top: 0;
    }

    .top.cover-center.meta-v-bottom .meta-region {
      justify-content: flex-end;
      margin-top: auto;
    }

    .top.cover-center .meta {
      align-items: center;
      width: 100%;
      text-align: center;
    }

    .top.cover-center .progress-wrap {
      width: 100%;
      max-width: 420px;
    }

    :host([data-tall]) .top {
      flex: 0 1 auto;
      min-height: 0;
    }

    :host([data-tall]) .top.cover-center {
      flex: 1 1 auto;
      min-height: 0;
      justify-content: flex-start;
      align-items: center;
    }

    :host([data-tall]) .top.cover-center .meta-region {
      flex: 1 1 auto;
      min-height: 0;
    }

    :host([data-tall]) .top.cover-center .progress-wrap {
      max-width: min(520px, 100%);
    }

    :host([data-tall]) .art {
      width: min(
        calc(340px * var(--spot-cover-scale, 1)),
        calc(86vw * var(--spot-cover-scale, 1))
      );
      max-width: 100%;
    }

    .art {
      flex: 0 0 auto;
      width: min(
        calc(240px * var(--spot-cover-scale, 1)),
        calc(42vw * var(--spot-cover-scale, 1))
      );
      aspect-ratio: 1;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      background: rgba(0, 0, 0, 0.35);
    }

    .art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .meta {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: calc(8px * min(var(--spot-meta-scale, 2), 2.5));
      min-width: 0;
    }

    .top.cover-left .meta,
    .top.cover-right .meta {
      flex: 0 0 auto;
    }

    .label {
      font-size: calc(0.78rem * var(--spot-meta-scale, 2));
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--spot-muted);
    }

    h2 {
      margin: 0;
      font-weight: 650;
      font-size: calc(clamp(1.35rem, 3vw, 1.85rem) * var(--spot-meta-scale, 2));
      line-height: 1.15;
      text-shadow: 0 2px 24px rgba(0, 0, 0, 0.55);
      word-break: break-word;
    }

    .artist {
      margin: 0;
      font-size: calc(1.05rem * var(--spot-meta-scale, 2));
      color: var(--spot-muted);
      font-weight: 450;
    }

    .progress-wrap {
      margin-top: calc(8px * min(var(--spot-meta-scale, 2), 2.5));
    }

    .progress-bar {
      display: block;
      height: calc(4px * var(--spot-meta-scale, 2));
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.14);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: rgb(29, 185, 84);
      border-radius: 4px;
      transition: width 0.12s linear;
    }

    .time-row {
      display: flex;
      justify-content: space-between;
      font-size: calc(0.75rem * var(--spot-meta-scale, 2));
      color: var(--spot-muted);
      margin-top: 6px;
    }

    .source-tablet select.source-select {
      min-height: 52px;
      font-size: 1.2rem;
      padding: 16px 14px;
      line-height: 1.4;
    }

    .source-tablet select.source-select option {
      font-size: 1.15rem;
      padding: 14px 10px;
      min-height: 3.25rem;
      line-height: 1.5;
    }

    .glass-panel {
      background: var(--spot-glass);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border-radius: 16px;
      padding: 14px 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .controls-main {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
      column-gap: 12px;
    }

    .transport-side-left {
      justify-self: start;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      min-width: 0;
    }

    .transport-cluster {
      justify-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .transport-side-right {
      justify-self: end;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
    }

    .browse-icon-btn {
      flex: 0 0 auto;
      width: 44px;
      height: 44px;
    }

    .ctrl-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.1);
      color: var(--spot-text);
      transition: transform 0.12s ease, background 0.15s ease;
    }

    .ctrl-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      transform: scale(1.04);
    }

    .ctrl-btn.primary {
      width: 68px;
      height: 68px;
      background: rgb(29, 185, 84);
      color: #05140a;
    }

    .ctrl-btn.primary:hover {
      background: rgb(42, 201, 96);
    }

    .ctrl-btn.active {
      color: rgb(29, 185, 84);
    }

    .vol-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .vol-row ha-slider {
      flex: 1;
      min-width: 0;
    }

    .vol-row input[type="range"] {
      flex: 1;
      accent-color: rgb(29, 185, 84);
    }

    .source-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }

    .source-row label {
      font-size: 0.8rem;
      color: var(--spot-muted);
      margin-right: 8px;
    }

    select.source-select {
      flex: 1;
      min-width: 160px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: var(--spot-glass-strong);
      color: var(--spot-text);
      font: inherit;
    }

    .section-title {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--spot-muted);
      letter-spacing: 0.04em;
    }

    .subtle {
      font-size: 0.85rem;
      color: var(--spot-muted);
    }
  `; }
    connectedCallback() {
        super.connectedCallback();
        this._startTimers();
    }
    disconnectedCallback() {
        this._stopTimers();
        super.disconnectedCallback();
    }
    /**
     * Opens HA’s full-screen media browser for this entity (same route as the sidebar Media panel).
     * Uses `history.pushState` + `location-changed` like HA’s `navigate()` so **browser / OS back**
     * returns to the dashboard.
     */
    _navigateToHaMediaBrowser() {
        const id = this.config?.entity;
        if (!id || typeof window === "undefined") {
            return;
        }
        const path = `/media-browser/${encodeURIComponent(id)}`;
        let pathForHistory = this.hass?.hassUrl?.(path) ?? path;
        if (pathForHistory.startsWith("http://") ||
            pathForHistory.startsWith("https://")) {
            try {
                const url = new URL(pathForHistory);
                pathForHistory = url.pathname + url.search + url.hash;
            }
            catch {
                pathForHistory = path;
            }
        }
        else if (!pathForHistory.startsWith("/")) {
            pathForHistory = `/${pathForHistory}`;
        }
        try {
            window.history.pushState(null, "", pathForHistory);
            const ev = new CustomEvent("location-changed", {
                bubbles: true,
                composed: true,
                detail: { replace: false },
            });
            // Defer so the history entry is committed before HA’s router handles the event.
            queueMicrotask(() => {
                window.dispatchEvent(ev);
            });
        }
        catch {
            window.location.assign(this.hass?.hassUrl?.(path) ??
                new URL(path, window.location.origin).href);
        }
    }
    updated(changed) {
        super.updated(changed);
        if (this.config?.tall) {
            this.dataset.tall = "";
        }
        else {
            delete this.dataset.tall;
        }
        const id = this.config?.entity;
        if (changed.has("config")) {
            this._stopTimers();
            this._startTimers();
        }
        else if (changed.has("hass")) {
            if (!this.hass) {
                this._stopTimers();
            }
            else if (id && this._pollTimer === undefined) {
                this._startTimers();
            }
        }
        this._syncLayoutCssVars();
    }
    _syncLayoutCssVars() {
        const p = this.config?.text_scale_percent;
        let metaScale = 2;
        if (typeof p === "number" && Number.isFinite(p)) {
            metaScale = Math.min(3, Math.max(0.5, p / 100));
        }
        this.style.setProperty("--spot-meta-scale", String(metaScale));
        const c = this.config?.cover_scale_percent;
        let coverScale = 1;
        if (typeof c === "number" && Number.isFinite(c)) {
            coverScale = Math.min(3, Math.max(0.5, c / 100));
        }
        this.style.setProperty("--spot-cover-scale", String(coverScale));
        const u = this.config?.up_next_scale_percent;
        let upNextScale = 1;
        if (typeof u === "number" && Number.isFinite(u)) {
            upNextScale = Math.min(3, Math.max(0.5, u / 100));
        }
        this.style.setProperty("--spot-up-next-scale", String(upNextScale));
        const cc = this.config?.corner_climate_scale_percent;
        let cornerScale = 1;
        if (typeof cc === "number" && Number.isFinite(cc)) {
            cornerScale = Math.min(3, Math.max(0.5, cc / 100));
        }
        this.style.setProperty("--spot-corner-climate-scale", String(cornerScale));
    }
    _stopTimers() {
        if (this._tickTimer !== undefined) {
            clearInterval(this._tickTimer);
            this._tickTimer = undefined;
        }
        if (this._pollTimer !== undefined) {
            clearInterval(this._pollTimer);
            this._pollTimer = undefined;
        }
    }
    _startTimers() {
        if (typeof window === "undefined") {
            return;
        }
        this._stopTimers();
        const id = this.config?.entity;
        if (!this.hass || !id) {
            return;
        }
        const pollSecConfig = this.config?.poll_interval_seconds ?? 5;
        const pollMs = Math.min(120_000, Math.max(2000, pollSecConfig * 1000));
        const tickClock = this.config?.show_corner_time === true;
        this._tickTimer = window.setInterval(() => {
            const st = this.hass?.states[id];
            if (st?.state === "playing" || tickClock) {
                this.requestUpdate();
            }
        }, 1000);
        void this.hass.callService("homeassistant", "update_entity", {
            entity_id: id,
        });
        this._pollTimer = window.setInterval(() => {
            void this.hass?.callService("homeassistant", "update_entity", {
                entity_id: id,
            });
        }, pollMs);
    }
    get _entity() {
        const id = this.config?.entity;
        if (!this.hass || !id) {
            return undefined;
        }
        return this.hass.states[id];
    }
    _pic() {
        const a = this._entity?.attributes;
        if (!a) {
            return undefined;
        }
        const p = a.entity_picture;
        return p?.length ? p : undefined;
    }
    async _callService(service, data = {}) {
        const eid = this.config?.entity;
        if (!this.hass || !eid) {
            return;
        }
        await this.hass.callService("media_player", service, {
            entity_id: eid,
            ...data,
        });
    }
    /** Delta is absolute change on 0–1 scale (e.g. 0.05 = five percentage points). */
    _adjustVolumeLevel(delta) {
        const ent = this._entity;
        if (!ent) {
            return;
        }
        const cur = ent.attributes.volume_level ?? 0;
        const next = Math.min(1, Math.max(0, cur + delta));
        void this._callService("volume_set", { volume_level: next });
    }
    _fmtTime(sec) {
        const s = Math.max(0, Math.floor(sec));
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r.toString().padStart(2, "0")}`;
    }
    _hassSystemUsesFahrenheit() {
        const t = this.hass?.config?.unit_system?.temperature;
        if (t === undefined || t === null) {
            return false;
        }
        return String(t).toUpperCase().includes("F");
    }
    _parseTemperatureNative(entityId) {
        const st = this.hass?.states[entityId];
        if (!st) {
            return undefined;
        }
        const domain = entityId.split(".")[0];
        if (domain === "weather") {
            const raw = st.attributes?.temperature;
            if (typeof raw !== "number" || Number.isNaN(raw)) {
                return undefined;
            }
            return {
                value: raw,
                unit: this._hassSystemUsesFahrenheit() ? "F" : "C",
            };
        }
        const raw = Number.parseFloat(String(st.state));
        if (!Number.isFinite(raw)) {
            return undefined;
        }
        const uom = String(st.attributes?.unit_of_measurement ?? "").toUpperCase();
        if (/\bF\b|°F|ºF/.test(uom) || uom.includes("FAHRENHEIT")) {
            return { value: raw, unit: "F" };
        }
        if (/\bC\b|°C|ºC/.test(uom) || uom.includes("CELSIUS")) {
            return { value: raw, unit: "C" };
        }
        return {
            value: raw,
            unit: this._hassSystemUsesFahrenheit() ? "F" : "C",
        };
    }
    _toCelsius(value, unit) {
        return unit === "F" ? ((value - 32) * 5) / 9 : value;
    }
    _formatCornerTemperature() {
        const eid = this.config?.corner_temperature_entity?.trim();
        if (!eid || !this.hass) {
            return null;
        }
        const parsed = this._parseTemperatureNative(eid);
        if (!parsed) {
            return null;
        }
        const celsius = this._toCelsius(parsed.value, parsed.unit);
        const pref = this.config?.corner_temperature_unit ?? "auto";
        const showF = pref === "fahrenheit" ||
            (pref === "auto" && this._hassSystemUsesFahrenheit());
        if (showF) {
            const fahr = (celsius * 9) / 5 + 32;
            return `${Math.round(fahr)}°F`;
        }
        return `${Math.round(celsius)}°C`;
    }
    _cornerTimeLabel() {
        const lang = this.hass?.locale?.language ??
            (typeof navigator !== "undefined" ? navigator.language : undefined);
        try {
            return new Date().toLocaleTimeString(lang, {
                hour: "numeric",
                minute: "2-digit",
            });
        }
        catch {
            return new Date().toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
            });
        }
    }
    render() {
        if (!this.config?.entity || !this.hass) {
            return b `<div class="body subtle">Configure entity</div>`;
        }
        const ent = this._entity;
        if (!ent) {
            return b `<div class="body subtle">Entity not found</div>`;
        }
        const a = ent.attributes;
        const pic = this._pic();
        const title = a.media_title ?? "Nothing playing";
        const artist = a.media_artist ??
            a.media_album_name ??
            "";
        const src = a.source ?? "";
        const srcList = a.source_list ?? [];
        const vol = a.volume_level ?? 0;
        const shuffle = Boolean(a.shuffle);
        const repeat = a.repeat ?? "off";
        const dur = a.media_duration ?? 0;
        const rawPos = a.media_position ?? 0;
        const updatedAt = a.media_position_updated_at;
        let pos = rawPos;
        const playing = ent.state === "playing";
        if (playing && dur > 0 && updatedAt) {
            const t = Date.parse(updatedAt);
            if (!Number.isNaN(t)) {
                pos = Math.min(dur, rawPos + (Date.now() - t) / 1000);
            }
        }
        const pct = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0;
        const align = this.config.cover_align ?? "center";
        const coverClass = align === "left"
            ? "cover-left"
            : align === "right"
                ? "cover-right"
                : "cover-center";
        const metaV = this.config.meta_vertical_align === "top" ||
            this.config.meta_vertical_align === "bottom"
            ? this.config.meta_vertical_align
            : "center";
        const showUpNext = this.config.show_up_next !== false;
        const nextTitle = String(a.media_next_title ?? "").trim() || "";
        const nextArtist = String(a.media_next_artist ?? "").trim() || "";
        const nextThumb = String(a.media_next_thumbnail ?? "").trim() || "";
        const hasUpNext = showUpNext && nextTitle.length > 0;
        const supportedFeat = Number(a.supported_features ?? 0);
        const showBrowseBtn = this.config.show_browse_media_button !== false &&
            (supportedFeat === 0 ||
                (supportedFeat & MEDIA_PLAYER_FEATURE_BROWSE_MEDIA) !== 0);
        const showCornerTime = this.config.show_corner_time === true;
        const showCornerTemperature = this.config.show_corner_temperature === true;
        const showCornerClimate = showCornerTime || showCornerTemperature;
        return b `
      <div class="card-shell">
        <div class="wrap">
          <div
            class="backdrop ${pic ? "" : "backdrop-fallback"}"
            style=${pic ? `background-image:url("${pic}")` : ""}
          ></div>
          <div class="scrim"></div>
          ${showCornerClimate
            ? b `
                <div class="corner-climate" aria-label="Time and temperature">
                  ${showCornerTime
                ? b `<div class="corner-time">${this._cornerTimeLabel()}</div>`
                : A}
                  ${showCornerTemperature
                ? b `<div class="corner-temp">
                        ${this._formatCornerTemperature() ?? "—"}
                      </div>`
                : A}
                </div>
              `
            : A}
          <div class="body">
            <div class="top ${coverClass} meta-v-${metaV}">
              <div class="art">
                ${pic
            ? b `<img src=${pic} alt="" />`
            : b `<div
                      style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;opacity:.35"
                    >
                      ♪
                    </div>`}
              </div>
              <div class="meta-region">
                <div class="meta">
                  ${this.config.name
            ? b `<span class="label">${this.config.name}</span>`
            : b `<span class="label">Now playing</span>`}
                  <h2>${title}</h2>
                  ${artist ? b `<p class="artist">${artist}</p>` : A}
                  ${dur > 0
            ? b `
                        <div class="progress-wrap">
                          <div class="progress-bar">
                            <div
                              class="progress-fill"
                              style="width:${pct}%"
                            ></div>
                          </div>
                          <div class="time-row">
                            <span>${this._fmtTime(pos)}</span>
                            <span>${this._fmtTime(dur)}</span>
                          </div>
                        </div>
                      `
            : A}
                </div>
              </div>
            </div>

            <div class="bottom-stack">
            <div class="glass-panel controls-main">
              <div class="transport-side-left">
                <button
                  class="ctrl-btn ${repeat !== "off" ? "active" : ""}"
                  @click=${() => {
            const next = repeat === "off"
                ? "all"
                : repeat === "all"
                    ? "one"
                    : "off";
            return this._callService("repeat_set", { repeat: next });
        }}
                  title="Repeat"
                >
                  <ha-icon
                    icon=${repeat === "one"
            ? "mdi:repeat-once"
            : "mdi:repeat"}
                  ></ha-icon>
                </button>
                <button
                  class="ctrl-btn ${shuffle ? "active" : ""}"
                  @click=${() => this._callService("shuffle_set", { shuffle: !shuffle })}
                  title="Shuffle"
                >
                  <ha-icon icon="mdi:shuffle"></ha-icon>
                </button>
              </div>
              <div class="transport-cluster">
                <button
                  class="ctrl-btn"
                  @click=${() => this._callService("media_previous_track")}
                  title="Previous"
                >
                  <ha-icon icon="mdi:skip-previous"></ha-icon>
                </button>
                <button
                  class="ctrl-btn primary"
                  @click=${() => this._callService("media_play_pause")}
                  title=${playing ? "Pause" : "Play"}
                >
                  <ha-icon
                    icon=${playing ? "mdi:pause" : "mdi:play"}
                    style="font-size:28px"
                  ></ha-icon>
                </button>
                <button
                  class="ctrl-btn"
                  @click=${() => this._callService("media_next_track")}
                  title="Next"
                >
                  <ha-icon icon="mdi:skip-next"></ha-icon>
                </button>
              </div>
              <div class="transport-side-right">
                ${showBrowseBtn
            ? b `
                      <button
                        type="button"
                        class="ctrl-btn browse-icon-btn"
                        title="Media library"
                        @click=${() => this._navigateToHaMediaBrowser()}
                      >
                        <ha-icon
                          icon="mdi:play-box-multiple-outline"
                        ></ha-icon>
                      </button>
                    `
            : A}
              </div>
            </div>

          <div class="glass-panel vol-row">
            <button
              class="ctrl-btn"
              style="width:44px;height:44px;flex-shrink:0"
              title="Volume down 5%"
              @click=${() => this._adjustVolumeLevel(-0.05)}
            >
              <ha-icon icon="mdi:volume-minus"></ha-icon>
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${String(Math.round(vol * 100))}
              @input=${(ev) => {
            const v = Number(ev.target.value) / 100;
            void this._callService("volume_set", { volume_level: v });
        }}
            />
            <button
              class="ctrl-btn"
              style="width:44px;height:44px;flex-shrink:0"
              title="Volume up 5%"
              @click=${() => this._adjustVolumeLevel(0.05)}
            >
              <ha-icon icon="mdi:volume-plus"></ha-icon>
            </button>
          </div>

          <div
            class="glass-panel ${this.config.source_tablet_mode === true
            ? "source-tablet"
            : ""}"
          >
            <div class="source-row">
              <div>
                <label>Source</label>
                <span class="subtle">${src || "—"}</span>
              </div>
              ${srcList.length
            ? b `
                    <select
                      class="source-select"
                      .value=${src}
                      @change=${(ev) => {
                const v = ev.target.value;
                void this._callService("select_source", {
                    source: v,
                });
            }}
                    >
                      ${srcList.map((s) => b `<option value=${s} .selected=${s === src}>
                            ${s}
                          </option>`)}
                    </select>
                  `
            : A}
            </div>
          </div>

            </div>
          </div>
          ${hasUpNext
            ? b `
                <aside class="up-next" aria-label="Up next">
                  ${nextThumb
                ? b `<img
                          class="up-next-cover"
                          src=${nextThumb}
                          alt=""
                          loading="lazy"
                        />`
                : b `<div
                        class="up-next-cover"
                        style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;opacity:.5"
                      >
                        <ha-icon icon="mdi:music-note"></ha-icon>
                      </div>`}
                  <div class="up-next-copy">
                    <p class="up-next-label">Up next</p>
                    <p class="up-next-title">${nextTitle}</p>
                    ${nextArtist
                ? b `<p class="up-next-artist">${nextArtist}</p>`
                : A}
                  </div>
                </aside>
              `
            : A}
        </div>
      </div>
    `;
    }
};
__decorate([
    n({ attribute: false })
], SpotifySpotlightCard.prototype, "hass", void 0);
__decorate([
    n({ type: Object })
], SpotifySpotlightCard.prototype, "config", void 0);
SpotifySpotlightCard = __decorate([
    t("spotify-spotlight-card")
], SpotifySpotlightCard);

export { SpotifySpotlightCard };
//# sourceMappingURL=spotify-spotlight-card.js.map
