import{b as mt,c as pt,d as ht}from"./chunk-G4HTMZVL.js";import{a as Te}from"./chunk-KO2F3HLI.js";import{a as Mt,b as wt,c as Et,d as It,e as Dt,f as Tt,g as At}from"./chunk-QSLP4XKD.js";import{a as xe,b as st}from"./chunk-RRXRO24P.js";import{a as Nt,b as Ft}from"./chunk-4KGHPK4M.js";import{A as Se,E as P,F as X,G as Me,a as ve,b as ye,c as ft,d as G,f as K,g as _t,i as Q,k as xt,l as kt,m as Ce,n as vt,o as yt,q as Ct,r as St,s as Y,t as Ot,v as Rt,z as Z}from"./chunk-EZZT5SDG.js";import{a as gt}from"./chunk-ELRVADAR.js";import{a as lt,b as dt,c as ut,e as bt,f as W,h as ke}from"./chunk-EERINNJX.js";import{A as _e,E as De,Ea as at,Fa as ct,Z as ot,g as Xe,h as ge,ha as rt,i as Je,j as et,k as tt,m as fe,v as nt,y as it,z as q}from"./chunk-F3EBUNGJ.js";import{$ as V,Aa as R,Ab as F,B as Ve,Bc as ue,Dc as Ze,Eb as d,Fb as o,G as He,Gb as r,H as ze,Hb as h,Hc as be,Kc as O,Lc as U,Nb as se,Ob as D,Pb as We,Q as Be,R as we,S as T,Sb as u,U as Ee,Ub as p,Va as l,Vb as z,Wb as A,X as ae,Xb as Ge,Yb as B,Z as j,Zb as E,_b as I,ba as M,cb as b,cc as $,dc as le,ec as _,fc as de,ga as v,gc as a,h as Ne,ha as y,hc as x,i as Fe,ia as te,ib as k,ic as w,ja as ce,jb as H,jc as me,kb as Ie,o as Pe,oa as ne,ob as g,pa as $e,pc as pe,s as re,sc as Ke,t as Le,ta as S,uc as Qe,vc as Ye,wa as Ue,xa as qe,xc as he,y as je,yb as C,zb as N}from"./chunk-IXRD3AB4.js";var Pt=(()=>{class i{get vertical(){return this._vertical}set vertical(e){this._vertical=De(e)}_vertical=!1;get inset(){return this._inset}set inset(e){this._inset=De(e)}_inset=!1;static \u0275fac=function(t){return new(t||i)};static \u0275cmp=k({type:i,selectors:[["mat-divider"]],hostAttrs:["role","separator",1,"mat-divider"],hostVars:7,hostBindings:function(t,n){t&2&&(C("aria-orientation",n.vertical?"vertical":"horizontal"),_("mat-divider-vertical",n.vertical)("mat-divider-horizontal",!n.vertical)("mat-divider-inset",n.inset))},inputs:{vertical:"vertical",inset:"inset"},decls:0,vars:0,template:function(t,n){},styles:[`.mat-divider {
  display: block;
  margin: 0;
  border-top-style: solid;
  border-top-color: var(--mat-divider-color, var(--mat-sys-outline-variant));
  border-top-width: var(--mat-divider-width, 1px);
}
.mat-divider.mat-divider-vertical {
  border-top: 0;
  border-right-style: solid;
  border-right-color: var(--mat-divider-color, var(--mat-sys-outline-variant));
  border-right-width: var(--mat-divider-width, 1px);
}
.mat-divider.mat-divider-inset {
  margin-left: 80px;
}
[dir=rtl] .mat-divider.mat-divider-inset {
  margin-left: auto;
  margin-right: 80px;
}
`],encapsulation:2,changeDetection:0})}return i})(),Gn=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275mod=H({type:i});static \u0275inj=j({imports:[it]})}return i})();function Xt(i,c){if(i&1&&(o(0,"mat-option",20),a(1),r()),i&2){let e=c.$implicit;d("value",e.codigo),l(),me(" ",e.descripcion," (",e.codigo,") ")}}var ie=class i{constructor(c,e,t,n){this.fb=c;this.accesosSvc=e;this.dialogRef=t;this.data=n;this.form=this.fb.group({codigo:["",[G.required,G.pattern(/^[A-Z0-9_]+$/)]],etiqueta:["",G.required],tipo:[this.data.fixedType||"OBJETO",G.required],icono:[""],ruta:[""],slug:[""],orden:[0],activo:["S",G.required]}),this.data.fixedType&&this.form.get("tipo")?.disable(),this.form.get("codigo")?.valueChanges.subscribe(s=>{if(s){let m=this.normalizeText(s);s!==m&&this.form.get("codigo")?.setValue(m,{emitEvent:!1})}})}form;tipos=S([]);normalizeText(c){return c.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"_").replace(/[^A-Z0-9_]/g,"")}ngOnInit(){this.loadTipos(),this.data.nodo&&(this.form.patchValue({codigo:this.data.nodo.codigo_tecnico,etiqueta:this.data.nodo.etiqueta,tipo:this.data.nodo.tipo_nodo||"OBJETO",icono:this.data.nodo.icono,ruta:this.data.nodo.url_ruta,slug:this.data.nodo.slug,orden:this.data.nodo.orden_visual,activo:this.data.nodo.activo?"S":"N"}),this.data.fixedType&&this.form.get("tipo")?.disable())}loadTipos(){this.accesosSvc.getTiposNodo().subscribe(c=>{let e=c;this.data.allowedTypes&&(e=c.filter(t=>this.data.allowedTypes.includes(t.codigo))),this.tipos.set(e)})}onSave(){this.form.valid&&this.dialogRef.close(this.form.getRawValue())}onCancel(){this.dialogRef.close()}static \u0275fac=function(e){return new(e||i)(b(Ct),b(ke),b(Mt),b(wt))};static \u0275cmp=k({type:i,selectors:[["app-nodo-dialog"]],decls:67,vars:6,consts:[[1,"p-6"],["mat-dialog-title","",1,"!flex","items-center","gap-2","!text-2xl","font-bold","text-gray-800","mb-4"],[1,"text-indigo-500"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-4","pt-2",3,"formGroup"],["appearance","outline"],["matInput","","formControlName","codigo","placeholder","Ej: MENU_FINANZAS",3,"readonly"],["matPrefix","",1,"mr-2","text-gray-400"],["matInput","","formControlName","etiqueta","placeholder","Ej: Gesti\xF3n de Finanzas"],["formControlName","tipo"],[3,"value",4,"ngFor","ngForOf"],["formControlName","activo"],["value","S"],["value","N"],["matInput","","formControlName","ruta","placeholder","/ruta/del/recurso"],["matInput","","formControlName","slug"],["matInput","","formControlName","icono","placeholder","Ej: dashboard"],["matInput","","type","number","formControlName","orden"],["align","end",1,"mt-6","gap-2"],["mat-stroked-button","",1,"!rounded-xl",3,"click"],["mat-flat-button","","color","primary",1,"!rounded-xl","px-8",3,"click","disabled"],[3,"value"]],template:function(e,t){e&1&&(o(0,"div",0)(1,"h2",1)(2,"mat-icon",2),a(3),r(),a(4),r(),o(5,"mat-dialog-content")(6,"form",3)(7,"mat-form-field",4)(8,"mat-label"),a(9,"C\xF3digo T\xE9cnico"),r(),h(10,"input",5),o(11,"mat-icon",6),a(12,"terminal"),r()(),o(13,"mat-form-field",4)(14,"mat-label"),a(15,"Etiqueta"),r(),h(16,"input",7),o(17,"mat-icon",6),a(18,"label"),r()(),o(19,"mat-form-field",4)(20,"mat-label"),a(21,"Tipo de Nodo"),r(),o(22,"mat-select",8),g(23,Xt,2,3,"mat-option",9),r(),o(24,"mat-icon",6),a(25,"category"),r()(),o(26,"mat-form-field",4)(27,"mat-label"),a(28,"Estado"),r(),o(29,"mat-select",10)(30,"mat-option",11),a(31,"Activo"),r(),o(32,"mat-option",12),a(33,"Inactivo"),r()(),o(34,"mat-icon",6),a(35,"toggle_on"),r()(),o(36,"mat-form-field",4)(37,"mat-label"),a(38,"Ruta / URL"),r(),h(39,"input",13),o(40,"mat-icon",6),a(41,"link"),r()(),o(42,"mat-form-field",4)(43,"mat-label"),a(44,"Slug (Opcional)"),r(),h(45,"input",14),o(46,"mat-icon",6),a(47,"tag"),r()(),o(48,"mat-form-field",4)(49,"mat-label"),a(50,"\xCDcono (Material)"),r(),h(51,"input",15),o(52,"mat-icon",6),a(53,"face"),r()(),o(54,"mat-form-field",4)(55,"mat-label"),a(56,"Orden Visual"),r(),h(57,"input",16),o(58,"mat-icon",6),a(59,"reorder"),r()()()(),o(60,"mat-dialog-actions",17)(61,"button",18),u("click",function(){return t.onCancel()}),a(62,"Cancelar"),r(),o(63,"button",19),u("click",function(){return t.onSave()}),o(64,"mat-icon"),a(65,"save"),r(),a(66," Guardar Cambios "),r()()()),e&2&&(l(3),x(t.data.nodo?"edit":"add_circle"),l(),w(" ",t.data.nodo?"Editar":"Nuevo"," Nodo "),l(2),d("formGroup",t.form),l(4),d("readonly",!!t.data.nodo),l(13),d("ngForOf",t.tipos()),l(40),d("disabled",t.form.invalid))},dependencies:[fe,ge,Y,xt,ye,kt,K,_t,yt,vt,At,It,Tt,Dt,W,bt,Se,Z,Ot,Rt,Ft,Nt,Me,X,P,_e,q],encapsulation:2})};var Jt=["mat-internal-form-field",""],en=["*"],jt=(()=>{class i{labelPosition="after";static \u0275fac=function(t){return new(t||i)};static \u0275cmp=k({type:i,selectors:[["div","mat-internal-form-field",""]],hostAttrs:[1,"mdc-form-field","mat-internal-form-field"],hostVars:2,hostBindings:function(t,n){t&2&&_("mdc-form-field--align-end",n.labelPosition==="before")},inputs:{labelPosition:"labelPosition"},attrs:Jt,ngContentSelectors:en,decls:1,vars:0,template:function(t,n){t&1&&(z(),A(0))},styles:[`.mat-internal-form-field {
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.mat-internal-form-field > label {
  margin-left: 0;
  margin-right: auto;
  padding-left: 4px;
  padding-right: 0;
  order: 0;
}
[dir=rtl] .mat-internal-form-field > label {
  margin-left: auto;
  margin-right: 0;
  padding-left: 0;
  padding-right: 4px;
}

.mdc-form-field--align-end > label {
  margin-left: auto;
  margin-right: 0;
  padding-left: 0;
  padding-right: 4px;
  order: -1;
}
[dir=rtl] .mdc-form-field--align-end .mdc-form-field--align-end label {
  margin-left: 0;
  margin-right: auto;
  padding-left: 4px;
  padding-right: 0;
}
`],encapsulation:2,changeDetection:0})}return i})();var tn=["input"],nn=["label"],on=["*"],Ae={color:"accent",clickAction:"check-indeterminate",disabledInteractive:!1},rn=new V("mat-checkbox-default-options",{providedIn:"root",factory:()=>Ae}),f=(function(i){return i[i.Init=0]="Init",i[i.Checked=1]="Checked",i[i.Unchecked=2]="Unchecked",i[i.Indeterminate=3]="Indeterminate",i})(f||{}),Oe=class{source;checked},Vt=(()=>{class i{_elementRef=M(R);_changeDetectorRef=M(be);_ngZone=M($e);_animationsDisabled=ct();_options=M(rn,{optional:!0});focus(){this._inputElement.nativeElement.focus()}_createChangeEvent(e){let t=new Oe;return t.source=this,t.checked=e,t}_getAnimationTargetElement(){return this._inputElement?.nativeElement}_animationClasses={uncheckedToChecked:"mdc-checkbox--anim-unchecked-checked",uncheckedToIndeterminate:"mdc-checkbox--anim-unchecked-indeterminate",checkedToUnchecked:"mdc-checkbox--anim-checked-unchecked",checkedToIndeterminate:"mdc-checkbox--anim-checked-indeterminate",indeterminateToChecked:"mdc-checkbox--anim-indeterminate-checked",indeterminateToUnchecked:"mdc-checkbox--anim-indeterminate-unchecked"};ariaLabel="";ariaLabelledby=null;ariaDescribedby;ariaExpanded;ariaControls;ariaOwns;_uniqueId;id;get inputId(){return`${this.id||this._uniqueId}-input`}required=!1;labelPosition="after";name=null;change=new ne;indeterminateChange=new ne;value;disableRipple=!1;_inputElement;_labelElement;tabIndex;color;disabledInteractive;_onTouched=()=>{};_currentAnimationClass="";_currentCheckState=f.Init;_controlValueAccessorChangeFn=()=>{};_validatorChangeFn=()=>{};constructor(){M(nt).load(lt);let e=M(new Ze("tabindex"),{optional:!0});this._options=this._options||Ae,this.color=this._options.color||Ae.color,this.tabIndex=e==null?0:parseInt(e)||0,this.id=this._uniqueId=M(ot).getId("mat-mdc-checkbox-"),this.disabledInteractive=this._options?.disabledInteractive??!1}ngOnChanges(e){e.required&&this._validatorChangeFn()}ngAfterViewInit(){this._syncIndeterminate(this.indeterminate)}get checked(){return this._checked}set checked(e){e!=this.checked&&(this._checked=e,this._changeDetectorRef.markForCheck())}_checked=!1;get disabled(){return this._disabled}set disabled(e){e!==this.disabled&&(this._disabled=e,this._changeDetectorRef.markForCheck())}_disabled=!1;get indeterminate(){return this._indeterminate()}set indeterminate(e){let t=e!=this._indeterminate();this._indeterminate.set(e),t&&(e?this._transitionCheckState(f.Indeterminate):this._transitionCheckState(this.checked?f.Checked:f.Unchecked),this.indeterminateChange.emit(e)),this._syncIndeterminate(e)}_indeterminate=S(!1);_isRippleDisabled(){return this.disableRipple||this.disabled}_onLabelTextChange(){this._changeDetectorRef.detectChanges()}writeValue(e){this.checked=!!e}registerOnChange(e){this._controlValueAccessorChangeFn=e}registerOnTouched(e){this._onTouched=e}setDisabledState(e){this.disabled=e}validate(e){return this.required&&e.value!==!0?{required:!0}:null}registerOnValidatorChange(e){this._validatorChangeFn=e}_transitionCheckState(e){let t=this._currentCheckState,n=this._getAnimationTargetElement();if(!(t===e||!n)&&(this._currentAnimationClass&&n.classList.remove(this._currentAnimationClass),this._currentAnimationClass=this._getAnimationClassForCheckStateTransition(t,e),this._currentCheckState=e,this._currentAnimationClass.length>0)){n.classList.add(this._currentAnimationClass);let s=this._currentAnimationClass;this._ngZone.runOutsideAngular(()=>{setTimeout(()=>{n.classList.remove(s)},1e3)})}}_emitChangeEvent(){this._controlValueAccessorChangeFn(this.checked),this.change.emit(this._createChangeEvent(this.checked)),this._inputElement&&(this._inputElement.nativeElement.checked=this.checked)}toggle(){this.checked=!this.checked,this._controlValueAccessorChangeFn(this.checked)}_handleInputClick(){let e=this._options?.clickAction;!this.disabled&&e!=="noop"?(this.indeterminate&&e!=="check"&&Promise.resolve().then(()=>{this._indeterminate.set(!1),this.indeterminateChange.emit(!1)}),this._checked=!this._checked,this._transitionCheckState(this._checked?f.Checked:f.Unchecked),this._emitChangeEvent()):(this.disabled&&this.disabledInteractive||!this.disabled&&e==="noop")&&(this._inputElement.nativeElement.checked=this.checked,this._inputElement.nativeElement.indeterminate=this.indeterminate)}_onInteractionEvent(e){e.stopPropagation()}_onBlur(){Promise.resolve().then(()=>{this._onTouched(),this._changeDetectorRef.markForCheck()})}_getAnimationClassForCheckStateTransition(e,t){if(this._animationsDisabled)return"";switch(e){case f.Init:if(t===f.Checked)return this._animationClasses.uncheckedToChecked;if(t==f.Indeterminate)return this._checked?this._animationClasses.checkedToIndeterminate:this._animationClasses.uncheckedToIndeterminate;break;case f.Unchecked:return t===f.Checked?this._animationClasses.uncheckedToChecked:this._animationClasses.uncheckedToIndeterminate;case f.Checked:return t===f.Unchecked?this._animationClasses.checkedToUnchecked:this._animationClasses.checkedToIndeterminate;case f.Indeterminate:return t===f.Checked?this._animationClasses.indeterminateToChecked:this._animationClasses.indeterminateToUnchecked}return""}_syncIndeterminate(e){let t=this._inputElement;t&&(t.nativeElement.indeterminate=e)}_onInputClick(){this._handleInputClick()}_onTouchTargetClick(){this._handleInputClick(),this.disabled||this._inputElement.nativeElement.focus()}_preventBubblingFromLabel(e){e.target&&this._labelElement.nativeElement.contains(e.target)&&e.stopPropagation()}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=k({type:i,selectors:[["mat-checkbox"]],viewQuery:function(t,n){if(t&1&&B(tn,5)(nn,5),t&2){let s;E(s=I())&&(n._inputElement=s.first),E(s=I())&&(n._labelElement=s.first)}},hostAttrs:[1,"mat-mdc-checkbox"],hostVars:16,hostBindings:function(t,n){t&2&&(We("id",n.id),C("tabindex",null)("aria-label",null)("aria-labelledby",null),de(n.color?"mat-"+n.color:"mat-accent"),_("_mat-animation-noopable",n._animationsDisabled)("mdc-checkbox--disabled",n.disabled)("mat-mdc-checkbox-disabled",n.disabled)("mat-mdc-checkbox-checked",n.checked)("mat-mdc-checkbox-disabled-interactive",n.disabledInteractive))},inputs:{ariaLabel:[0,"aria-label","ariaLabel"],ariaLabelledby:[0,"aria-labelledby","ariaLabelledby"],ariaDescribedby:[0,"aria-describedby","ariaDescribedby"],ariaExpanded:[2,"aria-expanded","ariaExpanded",O],ariaControls:[0,"aria-controls","ariaControls"],ariaOwns:[0,"aria-owns","ariaOwns"],id:"id",required:[2,"required","required",O],labelPosition:"labelPosition",name:"name",value:"value",disableRipple:[2,"disableRipple","disableRipple",O],tabIndex:[2,"tabIndex","tabIndex",e=>e==null?void 0:U(e)],color:"color",disabledInteractive:[2,"disabledInteractive","disabledInteractive",O],checked:[2,"checked","checked",O],disabled:[2,"disabled","disabled",O],indeterminate:[2,"indeterminate","indeterminate",O]},outputs:{change:"change",indeterminateChange:"indeterminateChange"},exportAs:["matCheckbox"],features:[pe([{provide:ve,useExisting:ae(()=>i),multi:!0},{provide:ft,useExisting:i,multi:!0}]),qe],ngContentSelectors:on,decls:15,vars:23,consts:[["checkbox",""],["input",""],["label",""],["mat-internal-form-field","",3,"click","labelPosition"],[1,"mdc-checkbox"],["aria-hidden","true",1,"mat-mdc-checkbox-touch-target",3,"click"],["type","checkbox",1,"mdc-checkbox__native-control",3,"blur","click","change","checked","indeterminate","disabled","id","required","tabIndex"],["aria-hidden","true",1,"mdc-checkbox__ripple"],["aria-hidden","true",1,"mdc-checkbox__background"],["focusable","false","viewBox","0 0 24 24",1,"mdc-checkbox__checkmark"],["fill","none","d","M1.73,12.91 8.1,19.28 22.79,4.59",1,"mdc-checkbox__checkmark-path"],[1,"mdc-checkbox__mixedmark"],["mat-ripple","","aria-hidden","true",1,"mat-mdc-checkbox-ripple","mat-focus-indicator",3,"matRippleTrigger","matRippleDisabled","matRippleCentered"],[1,"mdc-label",3,"for"]],template:function(t,n){if(t&1&&(z(),o(0,"div",3),u("click",function(m){return n._preventBubblingFromLabel(m)}),o(1,"div",4,0)(3,"div",5),u("click",function(){return n._onTouchTargetClick()}),r(),o(4,"input",6,1),u("blur",function(){return n._onBlur()})("click",function(){return n._onInputClick()})("change",function(m){return n._onInteractionEvent(m)}),r(),h(6,"div",7),o(7,"div",8),te(),o(8,"svg",9),h(9,"path",10),r(),ce(),h(10,"div",11),r(),h(11,"div",12),r(),o(12,"label",13,2),A(14),r()()),t&2){let s=$(2);d("labelPosition",n.labelPosition),l(4),_("mdc-checkbox--selected",n.checked),d("checked",n.checked)("indeterminate",n.indeterminate)("disabled",n.disabled&&!n.disabledInteractive)("id",n.inputId)("required",n.required)("tabIndex",n.disabled&&!n.disabledInteractive?-1:n.tabIndex),C("aria-label",n.ariaLabel||null)("aria-labelledby",n.ariaLabelledby)("aria-describedby",n.ariaDescribedby)("aria-checked",n.indeterminate?"mixed":null)("aria-controls",n.ariaControls)("aria-disabled",n.disabled&&n.disabledInteractive?!0:null)("aria-expanded",n.ariaExpanded)("aria-owns",n.ariaOwns)("name",n.name)("value",n.value),l(7),d("matRippleTrigger",s)("matRippleDisabled",n.disableRipple||n.disabled)("matRippleCentered",!0),l(),d("for",n.inputId)}},dependencies:[dt,jt],styles:[`.mdc-checkbox {
  display: inline-block;
  position: relative;
  flex: 0 0 18px;
  box-sizing: content-box;
  width: 18px;
  height: 18px;
  line-height: 0;
  white-space: nowrap;
  cursor: pointer;
  vertical-align: bottom;
  padding: calc((var(--mat-checkbox-state-layer-size, 40px) - 18px) / 2);
  margin: calc((var(--mat-checkbox-state-layer-size, 40px) - var(--mat-checkbox-state-layer-size, 40px)) / 2);
}
.mdc-checkbox:hover > .mdc-checkbox__ripple {
  opacity: var(--mat-checkbox-unselected-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity));
  background-color: var(--mat-checkbox-unselected-hover-state-layer-color, var(--mat-sys-on-surface));
}
.mdc-checkbox:hover > .mat-mdc-checkbox-ripple > .mat-ripple-element {
  background-color: var(--mat-checkbox-unselected-hover-state-layer-color, var(--mat-sys-on-surface));
}
.mdc-checkbox .mdc-checkbox__native-control:focus + .mdc-checkbox__ripple {
  opacity: var(--mat-checkbox-unselected-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity));
  background-color: var(--mat-checkbox-unselected-focus-state-layer-color, var(--mat-sys-on-surface));
}
.mdc-checkbox .mdc-checkbox__native-control:focus ~ .mat-mdc-checkbox-ripple .mat-ripple-element {
  background-color: var(--mat-checkbox-unselected-focus-state-layer-color, var(--mat-sys-on-surface));
}
.mdc-checkbox:active > .mdc-checkbox__native-control + .mdc-checkbox__ripple {
  opacity: var(--mat-checkbox-unselected-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity));
  background-color: var(--mat-checkbox-unselected-pressed-state-layer-color, var(--mat-sys-primary));
}
.mdc-checkbox:active > .mdc-checkbox__native-control ~ .mat-mdc-checkbox-ripple .mat-ripple-element {
  background-color: var(--mat-checkbox-unselected-pressed-state-layer-color, var(--mat-sys-primary));
}
.mdc-checkbox:hover > .mdc-checkbox__native-control:checked + .mdc-checkbox__ripple {
  opacity: var(--mat-checkbox-selected-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity));
  background-color: var(--mat-checkbox-selected-hover-state-layer-color, var(--mat-sys-primary));
}
.mdc-checkbox:hover > .mdc-checkbox__native-control:checked ~ .mat-mdc-checkbox-ripple .mat-ripple-element {
  background-color: var(--mat-checkbox-selected-hover-state-layer-color, var(--mat-sys-primary));
}
.mdc-checkbox .mdc-checkbox__native-control:focus:checked + .mdc-checkbox__ripple {
  opacity: var(--mat-checkbox-selected-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity));
  background-color: var(--mat-checkbox-selected-focus-state-layer-color, var(--mat-sys-primary));
}
.mdc-checkbox .mdc-checkbox__native-control:focus:checked ~ .mat-mdc-checkbox-ripple .mat-ripple-element {
  background-color: var(--mat-checkbox-selected-focus-state-layer-color, var(--mat-sys-primary));
}
.mdc-checkbox:active > .mdc-checkbox__native-control:checked + .mdc-checkbox__ripple {
  opacity: var(--mat-checkbox-selected-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity));
  background-color: var(--mat-checkbox-selected-pressed-state-layer-color, var(--mat-sys-on-surface));
}
.mdc-checkbox:active > .mdc-checkbox__native-control:checked ~ .mat-mdc-checkbox-ripple .mat-ripple-element {
  background-color: var(--mat-checkbox-selected-pressed-state-layer-color, var(--mat-sys-on-surface));
}
.mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox .mdc-checkbox__native-control ~ .mat-mdc-checkbox-ripple .mat-ripple-element,
.mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox .mdc-checkbox__native-control + .mdc-checkbox__ripple {
  background-color: var(--mat-checkbox-unselected-hover-state-layer-color, var(--mat-sys-on-surface));
}
.mdc-checkbox .mdc-checkbox__native-control {
  position: absolute;
  margin: 0;
  padding: 0;
  opacity: 0;
  cursor: inherit;
  z-index: 1;
  width: var(--mat-checkbox-state-layer-size, 40px);
  height: var(--mat-checkbox-state-layer-size, 40px);
  top: calc((var(--mat-checkbox-state-layer-size, 40px) - var(--mat-checkbox-state-layer-size, 40px)) / 2);
  right: calc((var(--mat-checkbox-state-layer-size, 40px) - var(--mat-checkbox-state-layer-size, 40px)) / 2);
  left: calc((var(--mat-checkbox-state-layer-size, 40px) - var(--mat-checkbox-state-layer-size, 40px)) / 2);
}

.mdc-checkbox--disabled {
  cursor: default;
  pointer-events: none;
}

.mdc-checkbox__background {
  display: inline-flex;
  position: absolute;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-radius: 2px;
  background-color: transparent;
  pointer-events: none;
  will-change: background-color, border-color;
  transition: background-color 90ms cubic-bezier(0.4, 0, 0.6, 1), border-color 90ms cubic-bezier(0.4, 0, 0.6, 1);
  -webkit-print-color-adjust: exact;
  color-adjust: exact;
  border-color: var(--mat-checkbox-unselected-icon-color, var(--mat-sys-on-surface-variant));
  top: calc((var(--mat-checkbox-state-layer-size, 40px) - 18px) / 2);
  left: calc((var(--mat-checkbox-state-layer-size, 40px) - 18px) / 2);
}

.mdc-checkbox__native-control:enabled:checked ~ .mdc-checkbox__background,
.mdc-checkbox__native-control:enabled:indeterminate ~ .mdc-checkbox__background {
  border-color: var(--mat-checkbox-selected-icon-color, var(--mat-sys-primary));
  background-color: var(--mat-checkbox-selected-icon-color, var(--mat-sys-primary));
}

.mdc-checkbox--disabled .mdc-checkbox__background {
  border-color: var(--mat-checkbox-disabled-unselected-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
}
@media (forced-colors: active) {
  .mdc-checkbox--disabled .mdc-checkbox__background {
    border-color: GrayText;
  }
}

.mdc-checkbox__native-control:disabled:checked ~ .mdc-checkbox__background,
.mdc-checkbox__native-control:disabled:indeterminate ~ .mdc-checkbox__background {
  background-color: var(--mat-checkbox-disabled-selected-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
  border-color: transparent;
}
@media (forced-colors: active) {
  .mdc-checkbox__native-control:disabled:checked ~ .mdc-checkbox__background,
  .mdc-checkbox__native-control:disabled:indeterminate ~ .mdc-checkbox__background {
    border-color: GrayText;
  }
}

.mdc-checkbox:hover > .mdc-checkbox__native-control:not(:checked) ~ .mdc-checkbox__background,
.mdc-checkbox:hover > .mdc-checkbox__native-control:not(:indeterminate) ~ .mdc-checkbox__background {
  border-color: var(--mat-checkbox-unselected-hover-icon-color, var(--mat-sys-on-surface));
  background-color: transparent;
}

.mdc-checkbox:hover > .mdc-checkbox__native-control:checked ~ .mdc-checkbox__background,
.mdc-checkbox:hover > .mdc-checkbox__native-control:indeterminate ~ .mdc-checkbox__background {
  border-color: var(--mat-checkbox-selected-hover-icon-color, var(--mat-sys-primary));
  background-color: var(--mat-checkbox-selected-hover-icon-color, var(--mat-sys-primary));
}

.mdc-checkbox__native-control:focus:focus:not(:checked) ~ .mdc-checkbox__background,
.mdc-checkbox__native-control:focus:focus:not(:indeterminate) ~ .mdc-checkbox__background {
  border-color: var(--mat-checkbox-unselected-focus-icon-color, var(--mat-sys-on-surface));
}

.mdc-checkbox__native-control:focus:focus:checked ~ .mdc-checkbox__background,
.mdc-checkbox__native-control:focus:focus:indeterminate ~ .mdc-checkbox__background {
  border-color: var(--mat-checkbox-selected-focus-icon-color, var(--mat-sys-primary));
  background-color: var(--mat-checkbox-selected-focus-icon-color, var(--mat-sys-primary));
}

.mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox:hover > .mdc-checkbox__native-control ~ .mdc-checkbox__background,
.mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox .mdc-checkbox__native-control:focus ~ .mdc-checkbox__background,
.mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__background {
  border-color: var(--mat-checkbox-disabled-unselected-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
}
@media (forced-colors: active) {
  .mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox:hover > .mdc-checkbox__native-control ~ .mdc-checkbox__background,
  .mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox .mdc-checkbox__native-control:focus ~ .mdc-checkbox__background,
  .mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__background {
    border-color: GrayText;
  }
}
.mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__native-control:checked ~ .mdc-checkbox__background,
.mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__native-control:indeterminate ~ .mdc-checkbox__background {
  background-color: var(--mat-checkbox-disabled-selected-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
  border-color: transparent;
}

.mdc-checkbox__checkmark {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transition: opacity 180ms cubic-bezier(0.4, 0, 0.6, 1);
  color: var(--mat-checkbox-selected-checkmark-color, var(--mat-sys-on-primary));
}
@media (forced-colors: active) {
  .mdc-checkbox__checkmark {
    color: CanvasText;
  }
}

.mdc-checkbox--disabled .mdc-checkbox__checkmark, .mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__checkmark {
  color: var(--mat-checkbox-disabled-selected-checkmark-color, var(--mat-sys-surface));
}
@media (forced-colors: active) {
  .mdc-checkbox--disabled .mdc-checkbox__checkmark, .mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__checkmark {
    color: GrayText;
  }
}

.mdc-checkbox__checkmark-path {
  transition: stroke-dashoffset 180ms cubic-bezier(0.4, 0, 0.6, 1);
  stroke: currentColor;
  stroke-width: 3.12px;
  stroke-dashoffset: 29.7833385;
  stroke-dasharray: 29.7833385;
}

.mdc-checkbox__mixedmark {
  width: 100%;
  height: 0;
  transform: scaleX(0) rotate(0deg);
  border-width: 1px;
  border-style: solid;
  opacity: 0;
  transition: opacity 90ms cubic-bezier(0.4, 0, 0.6, 1), transform 90ms cubic-bezier(0.4, 0, 0.6, 1);
  border-color: var(--mat-checkbox-selected-checkmark-color, var(--mat-sys-on-primary));
}
@media (forced-colors: active) {
  .mdc-checkbox__mixedmark {
    margin: 0 1px;
  }
}

.mdc-checkbox--disabled .mdc-checkbox__mixedmark, .mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__mixedmark {
  border-color: var(--mat-checkbox-disabled-selected-checkmark-color, var(--mat-sys-surface));
}
@media (forced-colors: active) {
  .mdc-checkbox--disabled .mdc-checkbox__mixedmark, .mdc-checkbox--disabled.mat-mdc-checkbox-disabled-interactive .mdc-checkbox__mixedmark {
    border-color: GrayText;
  }
}

.mdc-checkbox--anim-unchecked-checked .mdc-checkbox__background,
.mdc-checkbox--anim-unchecked-indeterminate .mdc-checkbox__background,
.mdc-checkbox--anim-checked-unchecked .mdc-checkbox__background,
.mdc-checkbox--anim-indeterminate-unchecked .mdc-checkbox__background {
  animation-duration: 180ms;
  animation-timing-function: linear;
}

.mdc-checkbox--anim-unchecked-checked .mdc-checkbox__checkmark-path {
  animation: mdc-checkbox-unchecked-checked-checkmark-path 180ms linear;
  transition: none;
}

.mdc-checkbox--anim-unchecked-indeterminate .mdc-checkbox__mixedmark {
  animation: mdc-checkbox-unchecked-indeterminate-mixedmark 90ms linear;
  transition: none;
}

.mdc-checkbox--anim-checked-unchecked .mdc-checkbox__checkmark-path {
  animation: mdc-checkbox-checked-unchecked-checkmark-path 90ms linear;
  transition: none;
}

.mdc-checkbox--anim-checked-indeterminate .mdc-checkbox__checkmark {
  animation: mdc-checkbox-checked-indeterminate-checkmark 90ms linear;
  transition: none;
}
.mdc-checkbox--anim-checked-indeterminate .mdc-checkbox__mixedmark {
  animation: mdc-checkbox-checked-indeterminate-mixedmark 90ms linear;
  transition: none;
}

.mdc-checkbox--anim-indeterminate-checked .mdc-checkbox__checkmark {
  animation: mdc-checkbox-indeterminate-checked-checkmark 500ms linear;
  transition: none;
}
.mdc-checkbox--anim-indeterminate-checked .mdc-checkbox__mixedmark {
  animation: mdc-checkbox-indeterminate-checked-mixedmark 500ms linear;
  transition: none;
}

.mdc-checkbox--anim-indeterminate-unchecked .mdc-checkbox__mixedmark {
  animation: mdc-checkbox-indeterminate-unchecked-mixedmark 300ms linear;
  transition: none;
}

.mdc-checkbox__native-control:checked ~ .mdc-checkbox__background,
.mdc-checkbox__native-control:indeterminate ~ .mdc-checkbox__background {
  transition: border-color 90ms cubic-bezier(0, 0, 0.2, 1), background-color 90ms cubic-bezier(0, 0, 0.2, 1);
}
.mdc-checkbox__native-control:checked ~ .mdc-checkbox__background > .mdc-checkbox__checkmark > .mdc-checkbox__checkmark-path,
.mdc-checkbox__native-control:indeterminate ~ .mdc-checkbox__background > .mdc-checkbox__checkmark > .mdc-checkbox__checkmark-path {
  stroke-dashoffset: 0;
}

.mdc-checkbox__native-control:checked ~ .mdc-checkbox__background > .mdc-checkbox__checkmark {
  transition: opacity 180ms cubic-bezier(0, 0, 0.2, 1), transform 180ms cubic-bezier(0, 0, 0.2, 1);
  opacity: 1;
}
.mdc-checkbox__native-control:checked ~ .mdc-checkbox__background > .mdc-checkbox__mixedmark {
  transform: scaleX(1) rotate(-45deg);
}

.mdc-checkbox__native-control:indeterminate ~ .mdc-checkbox__background > .mdc-checkbox__checkmark {
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity 90ms cubic-bezier(0.4, 0, 0.6, 1), transform 90ms cubic-bezier(0.4, 0, 0.6, 1);
}
.mdc-checkbox__native-control:indeterminate ~ .mdc-checkbox__background > .mdc-checkbox__mixedmark {
  transform: scaleX(1) rotate(0deg);
  opacity: 1;
}

@keyframes mdc-checkbox-unchecked-checked-checkmark-path {
  0%, 50% {
    stroke-dashoffset: 29.7833385;
  }
  50% {
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes mdc-checkbox-unchecked-indeterminate-mixedmark {
  0%, 68.2% {
    transform: scaleX(0);
  }
  68.2% {
    animation-timing-function: cubic-bezier(0, 0, 0, 1);
  }
  100% {
    transform: scaleX(1);
  }
}
@keyframes mdc-checkbox-checked-unchecked-checkmark-path {
  from {
    animation-timing-function: cubic-bezier(0.4, 0, 1, 1);
    opacity: 1;
    stroke-dashoffset: 0;
  }
  to {
    opacity: 0;
    stroke-dashoffset: -29.7833385;
  }
}
@keyframes mdc-checkbox-checked-indeterminate-checkmark {
  from {
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    transform: rotate(0deg);
    opacity: 1;
  }
  to {
    transform: rotate(45deg);
    opacity: 0;
  }
}
@keyframes mdc-checkbox-indeterminate-checked-checkmark {
  from {
    animation-timing-function: cubic-bezier(0.14, 0, 0, 1);
    transform: rotate(45deg);
    opacity: 0;
  }
  to {
    transform: rotate(360deg);
    opacity: 1;
  }
}
@keyframes mdc-checkbox-checked-indeterminate-mixedmark {
  from {
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    transform: rotate(-45deg);
    opacity: 0;
  }
  to {
    transform: rotate(0deg);
    opacity: 1;
  }
}
@keyframes mdc-checkbox-indeterminate-checked-mixedmark {
  from {
    animation-timing-function: cubic-bezier(0.14, 0, 0, 1);
    transform: rotate(0deg);
    opacity: 1;
  }
  to {
    transform: rotate(315deg);
    opacity: 0;
  }
}
@keyframes mdc-checkbox-indeterminate-unchecked-mixedmark {
  0% {
    animation-timing-function: linear;
    transform: scaleX(1);
    opacity: 1;
  }
  32.8%, 100% {
    transform: scaleX(0);
    opacity: 0;
  }
}
.mat-mdc-checkbox {
  display: inline-block;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mat-mdc-checkbox-touch-target,
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mdc-checkbox__native-control,
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mdc-checkbox__ripple,
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mat-mdc-checkbox-ripple::before,
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mdc-checkbox__background,
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mdc-checkbox__background > .mdc-checkbox__checkmark,
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mdc-checkbox__background > .mdc-checkbox__checkmark > .mdc-checkbox__checkmark-path,
.mat-mdc-checkbox._mat-animation-noopable > .mat-internal-form-field > .mdc-checkbox > .mdc-checkbox__background > .mdc-checkbox__mixedmark {
  transition: none !important;
  animation: none !important;
}
.mat-mdc-checkbox label {
  cursor: pointer;
}
.mat-mdc-checkbox .mat-internal-form-field {
  color: var(--mat-checkbox-label-text-color, var(--mat-sys-on-surface));
  font-family: var(--mat-checkbox-label-text-font, var(--mat-sys-body-medium-font));
  line-height: var(--mat-checkbox-label-text-line-height, var(--mat-sys-body-medium-line-height));
  font-size: var(--mat-checkbox-label-text-size, var(--mat-sys-body-medium-size));
  letter-spacing: var(--mat-checkbox-label-text-tracking, var(--mat-sys-body-medium-tracking));
  font-weight: var(--mat-checkbox-label-text-weight, var(--mat-sys-body-medium-weight));
}
.mat-mdc-checkbox.mat-mdc-checkbox-disabled.mat-mdc-checkbox-disabled-interactive {
  pointer-events: auto;
}
.mat-mdc-checkbox.mat-mdc-checkbox-disabled.mat-mdc-checkbox-disabled-interactive input {
  cursor: default;
}
.mat-mdc-checkbox.mat-mdc-checkbox-disabled label {
  cursor: default;
  color: var(--mat-checkbox-disabled-label-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
}
@media (forced-colors: active) {
  .mat-mdc-checkbox.mat-mdc-checkbox-disabled label {
    color: GrayText;
  }
}
.mat-mdc-checkbox label:empty {
  display: none;
}
.mat-mdc-checkbox .mdc-checkbox__ripple {
  opacity: 0;
}

.mat-mdc-checkbox .mat-mdc-checkbox-ripple,
.mdc-checkbox__ripple {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.mat-mdc-checkbox .mat-mdc-checkbox-ripple:not(:empty),
.mdc-checkbox__ripple:not(:empty) {
  transform: translateZ(0);
}

.mat-mdc-checkbox-ripple .mat-ripple-element {
  opacity: 0.1;
}

.mat-mdc-checkbox-touch-target {
  position: absolute;
  top: 50%;
  left: 50%;
  height: var(--mat-checkbox-touch-target-size, 48px);
  width: var(--mat-checkbox-touch-target-size, 48px);
  transform: translate(-50%, -50%);
  display: var(--mat-checkbox-touch-target-display, block);
}

.mat-mdc-checkbox .mat-mdc-checkbox-ripple::before {
  border-radius: 50%;
}

.mdc-checkbox__native-control:focus-visible ~ .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2,changeDetection:0})}return i})();var an=["determinateSpinner"];function cn(i,c){if(i&1&&(te(),o(0,"svg",11),h(1,"circle",12),r()),i&2){let e=p();C("viewBox",e._viewBox()),l(),le("stroke-dasharray",e._strokeCircumference(),"px")("stroke-dashoffset",e._strokeCircumference()/2,"px")("stroke-width",e._circleStrokeWidth(),"%"),C("r",e._circleRadius())}}var sn=new V("mat-progress-spinner-default-options",{providedIn:"root",factory:()=>({diameter:Ht})}),Ht=100,ln=10,zt=(()=>{class i{_elementRef=M(R);_noopAnimations;get color(){return this._color||this._defaultColor}set color(e){this._color=e}_color;_defaultColor="primary";_determinateCircle;constructor(){let e=M(sn),t=at(),n=this._elementRef.nativeElement;this._noopAnimations=t==="di-disabled"&&!!e&&!e._forceAnimations,this.mode=n.nodeName.toLowerCase()==="mat-spinner"?"indeterminate":"determinate",!this._noopAnimations&&t==="reduced-motion"&&n.classList.add("mat-progress-spinner-reduced-motion"),e&&(e.color&&(this.color=this._defaultColor=e.color),e.diameter&&(this.diameter=e.diameter),e.strokeWidth&&(this.strokeWidth=e.strokeWidth))}mode;get value(){return this.mode==="determinate"?this._value:0}set value(e){this._value=Math.max(0,Math.min(100,e||0))}_value=0;get diameter(){return this._diameter}set diameter(e){this._diameter=e||0}_diameter=Ht;get strokeWidth(){return this._strokeWidth??this.diameter/10}set strokeWidth(e){this._strokeWidth=e||0}_strokeWidth;_circleRadius(){return(this.diameter-ln)/2}_viewBox(){let e=this._circleRadius()*2+this.strokeWidth;return`0 0 ${e} ${e}`}_strokeCircumference(){return 2*Math.PI*this._circleRadius()}_strokeDashOffset(){return this.mode==="determinate"?this._strokeCircumference()*(100-this._value)/100:null}_circleStrokeWidth(){return this.strokeWidth/this.diameter*100}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=k({type:i,selectors:[["mat-progress-spinner"],["mat-spinner"]],viewQuery:function(t,n){if(t&1&&B(an,5),t&2){let s;E(s=I())&&(n._determinateCircle=s.first)}},hostAttrs:["role","progressbar","tabindex","-1",1,"mat-mdc-progress-spinner","mdc-circular-progress"],hostVars:18,hostBindings:function(t,n){t&2&&(C("aria-valuemin",0)("aria-valuemax",100)("aria-valuenow",n.mode==="determinate"?n.value:null)("mode",n.mode),de("mat-"+n.color),le("width",n.diameter,"px")("height",n.diameter,"px")("--mat-progress-spinner-size",n.diameter+"px")("--mat-progress-spinner-active-indicator-width",n.diameter+"px"),_("_mat-animation-noopable",n._noopAnimations)("mdc-circular-progress--indeterminate",n.mode==="indeterminate"))},inputs:{color:"color",mode:"mode",value:[2,"value","value",U],diameter:[2,"diameter","diameter",U],strokeWidth:[2,"strokeWidth","strokeWidth",U]},exportAs:["matProgressSpinner"],decls:14,vars:11,consts:[["circle",""],["determinateSpinner",""],["aria-hidden","true",1,"mdc-circular-progress__determinate-container"],["xmlns","http://www.w3.org/2000/svg","focusable","false",1,"mdc-circular-progress__determinate-circle-graphic"],["cx","50%","cy","50%",1,"mdc-circular-progress__determinate-circle"],["aria-hidden","true",1,"mdc-circular-progress__indeterminate-container"],[1,"mdc-circular-progress__spinner-layer"],[1,"mdc-circular-progress__circle-clipper","mdc-circular-progress__circle-left"],[3,"ngTemplateOutlet"],[1,"mdc-circular-progress__gap-patch"],[1,"mdc-circular-progress__circle-clipper","mdc-circular-progress__circle-right"],["xmlns","http://www.w3.org/2000/svg","focusable","false",1,"mdc-circular-progress__indeterminate-circle-graphic"],["cx","50%","cy","50%"]],template:function(t,n){if(t&1&&(g(0,cn,2,8,"ng-template",null,0,he),o(2,"div",2,1),te(),o(4,"svg",3),h(5,"circle",4),r()(),ce(),o(6,"div",5)(7,"div",6)(8,"div",7),se(9,8),r(),o(10,"div",9),se(11,8),r(),o(12,"div",10),se(13,8),r()()()),t&2){let s=$(1);l(4),C("viewBox",n._viewBox()),l(),le("stroke-dasharray",n._strokeCircumference(),"px")("stroke-dashoffset",n._strokeDashOffset(),"px")("stroke-width",n._circleStrokeWidth(),"%"),C("r",n._circleRadius()),l(4),d("ngTemplateOutlet",s),l(2),d("ngTemplateOutlet",s),l(2),d("ngTemplateOutlet",s)}},dependencies:[et],styles:[`.mat-mdc-progress-spinner {
  --mat-progress-spinner-animation-multiplier: 1;
  display: block;
  overflow: hidden;
  line-height: 0;
  position: relative;
  direction: ltr;
  transition: opacity 250ms cubic-bezier(0.4, 0, 0.6, 1);
}
.mat-mdc-progress-spinner circle {
  stroke-width: var(--mat-progress-spinner-active-indicator-width, 4px);
}
.mat-mdc-progress-spinner._mat-animation-noopable, .mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__determinate-circle {
  transition: none !important;
}
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-circle-graphic,
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__spinner-layer,
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-container {
  animation: none !important;
}
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-container circle {
  stroke-dasharray: 0 !important;
}
@media (forced-colors: active) {
  .mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic,
  .mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle {
    stroke: currentColor;
    stroke: CanvasText;
  }
}

.mat-progress-spinner-reduced-motion {
  --mat-progress-spinner-animation-multiplier: 1.25;
}

.mdc-circular-progress__determinate-container,
.mdc-circular-progress__indeterminate-circle-graphic,
.mdc-circular-progress__indeterminate-container,
.mdc-circular-progress__spinner-layer {
  position: absolute;
  width: 100%;
  height: 100%;
}

.mdc-circular-progress__determinate-container {
  transform: rotate(-90deg);
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__determinate-container {
  opacity: 0;
}

.mdc-circular-progress__indeterminate-container {
  font-size: 0;
  letter-spacing: 0;
  white-space: nowrap;
  opacity: 0;
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__indeterminate-container {
  opacity: 1;
  animation: mdc-circular-progress-container-rotate calc(1568.2352941176ms * var(--mat-progress-spinner-animation-multiplier)) linear infinite;
}

.mdc-circular-progress__determinate-circle-graphic,
.mdc-circular-progress__indeterminate-circle-graphic {
  fill: transparent;
}

.mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,
.mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic {
  stroke: var(--mat-progress-spinner-active-indicator-color, var(--mat-sys-primary));
}
@media (forced-colors: active) {
  .mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,
  .mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic {
    stroke: CanvasText;
  }
}

.mdc-circular-progress__determinate-circle {
  transition: stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);
}

.mdc-circular-progress__gap-patch {
  position: absolute;
  top: 0;
  left: 47.5%;
  box-sizing: border-box;
  width: 5%;
  height: 100%;
  overflow: hidden;
}

.mdc-circular-progress__gap-patch .mdc-circular-progress__indeterminate-circle-graphic {
  left: -900%;
  width: 2000%;
  transform: rotate(180deg);
}
.mdc-circular-progress__circle-clipper .mdc-circular-progress__indeterminate-circle-graphic {
  width: 200%;
}
.mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic {
  left: -100%;
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-left .mdc-circular-progress__indeterminate-circle-graphic {
  animation: mdc-circular-progress-left-spin calc(1333ms * var(--mat-progress-spinner-animation-multiplier)) cubic-bezier(0.4, 0, 0.2, 1) infinite both;
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic {
  animation: mdc-circular-progress-right-spin calc(1333ms * var(--mat-progress-spinner-animation-multiplier)) cubic-bezier(0.4, 0, 0.2, 1) infinite both;
}

.mdc-circular-progress__circle-clipper {
  display: inline-flex;
  position: relative;
  width: 50%;
  height: 100%;
  overflow: hidden;
}

.mdc-circular-progress--indeterminate .mdc-circular-progress__spinner-layer {
  animation: mdc-circular-progress-spinner-layer-rotate calc(5332ms * var(--mat-progress-spinner-animation-multiplier)) cubic-bezier(0.4, 0, 0.2, 1) infinite both;
}

@keyframes mdc-circular-progress-container-rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes mdc-circular-progress-spinner-layer-rotate {
  12.5% {
    transform: rotate(135deg);
  }
  25% {
    transform: rotate(270deg);
  }
  37.5% {
    transform: rotate(405deg);
  }
  50% {
    transform: rotate(540deg);
  }
  62.5% {
    transform: rotate(675deg);
  }
  75% {
    transform: rotate(810deg);
  }
  87.5% {
    transform: rotate(945deg);
  }
  100% {
    transform: rotate(1080deg);
  }
}
@keyframes mdc-circular-progress-left-spin {
  from {
    transform: rotate(265deg);
  }
  50% {
    transform: rotate(130deg);
  }
  to {
    transform: rotate(265deg);
  }
}
@keyframes mdc-circular-progress-right-spin {
  from {
    transform: rotate(-265deg);
  }
  50% {
    transform: rotate(-130deg);
  }
  to {
    transform: rotate(-265deg);
  }
}
`],encapsulation:2,changeDetection:0})}return i})();var dn=["searchSelectInput"],mn=["innerSelectSearch"],pn=[[["",8,"mat-select-search-custom-header-content"]],[["","ngxMatSelectSearchClear",""]],[["","ngxMatSelectNoEntriesFound",""]]],hn=[".mat-select-search-custom-header-content","[ngxMatSelectSearchClear]","[ngxMatSelectNoEntriesFound]"];function un(i,c){if(i&1){let e=D();o(0,"mat-checkbox",10),u("change",function(n){v(e);let s=p();return y(s._emitSelectAllBooleanToParent(n.checked))}),r()}if(i&2){let e=p();d("color",e.matFormField==null?null:e.matFormField.color)("checked",e.toggleAllCheckboxChecked)("indeterminate",e.toggleAllCheckboxIndeterminate)("matTooltip",e.toggleAllCheckboxTooltipMessage)("matTooltipPosition",e.toggleAllCheckboxTooltipPosition)}}function bn(i,c){i&1&&h(0,"mat-spinner",7)}function gn(i,c){i&1&&A(0,1)}function fn(i,c){if(i&1&&h(0,"mat-icon",12),i&2){let e=p(2);d("svgIcon",e.closeSvgIcon)}}function _n(i,c){if(i&1&&(o(0,"mat-icon"),a(1),r()),i&2){let e=p(2);l(),w(" ",e.closeIcon," ")}}function xn(i,c){if(i&1){let e=D();o(0,"button",11),u("click",function(){v(e);let n=p();return y(n._reset(!0))}),N(1,gn,1,0)(2,fn,1,1,"mat-icon",12)(3,_n,2,1,"mat-icon"),r()}if(i&2){let e=p();l(),F(e.clearIcon?1:e.closeSvgIcon?2:3)}}function kn(i,c){i&1&&A(0,2)}function vn(i,c){if(i&1&&a(0),i&2){let e=p(2);w(" ",e.noEntriesFoundLabel," ")}}function yn(i,c){if(i&1&&(o(0,"div",9),N(1,kn,1,0)(2,vn,1,1),r()),i&2){let e=p();l(),F(e.noEntriesFound?1:2)}}var Cn=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275dir=Ie({type:i,selectors:[["","ngxMatSelectSearchClear",""]]})}return i})(),Sn=["ariaLabel","clearSearchInput","closeIcon","closeSvgIcon","disableInitialFocus","disableScrollToActiveOnOptionsChanged","enableClearOnEscapePressed","hideClearSearchButton","noEntriesFoundLabel","placeholderLabel","preventHomeEndKeyPropagation","searching"],Mn=new V("mat-selectsearch-default-options"),wn=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275dir=Ie({type:i,selectors:[["","ngxMatSelectNoEntriesFound",""]]})}return i})(),Re=(()=>{class i{matSelect;changeDetectorRef;_viewportRuler;matOption;matFormField;placeholderLabel="Suche";type="text";closeIcon="close";closeSvgIcon;noEntriesFoundLabel="Keine Optionen gefunden";clearSearchInput=!0;searching=!1;disableInitialFocus=!1;enableClearOnEscapePressed=!1;preventHomeEndKeyPropagation=!1;disableScrollToActiveOnOptionsChanged=!1;ariaLabel="dropdown search";showToggleAllCheckbox=!1;toggleAllCheckboxChecked=!1;toggleAllCheckboxIndeterminate=!1;toggleAllCheckboxTooltipMessage="";toggleAllCheckboxTooltipPosition="below";hideClearSearchButton=!1;alwaysRestoreSelectedOptionsMulti=!1;recreateValuesArray=!1;toggleAll=new ne;searchSelectInput;innerSelectSearch;clearIcon;noEntriesFound;get value(){return this._formControl.value}_lastExternalInputValue;onTouched=()=>{};set _options(e){this._options$.next(e)}get _options(){return this._options$.getValue()}_options$=new Fe(null);optionsList$=this._options$.pipe(we(e=>e?e.changes.pipe(re(t=>t.toArray()),Be(e.toArray())):Pe(null)));optionsLength$=this.optionsList$.pipe(re(e=>e?e.length:0));previousSelectedValues;_formControl=new Q("",{nonNullable:!0});_showNoEntriesFound$=Le([this._formControl.valueChanges,this.optionsLength$]).pipe(re(([e,t])=>!!(this.noEntriesFoundLabel&&e&&t===this.getOptionsLengthOffset())));_onDestroy=new Ne;activeDescendant;_removePanelKeydownListener;constructor(e,t,n,s,m,ee){this.matSelect=e,this.changeDetectorRef=t,this._viewportRuler=n,this.matOption=s,this.matFormField=m,this.applyDefaultOptions(ee)}applyDefaultOptions(e){if(e)for(let t of Sn)Object.prototype.hasOwnProperty.call(e,t)&&(this[t]=e[t])}ngOnInit(){this.matOption?(this.matOption.disabled=!0,this.matOption._getHostElement().classList.add("contains-mat-select-search"),this.matOption._getHostElement().setAttribute("role","presentation")):console.error("<ngx-mat-select-search> must be placed inside a <mat-option> element"),this.matSelect.openedChange.pipe(ze(1),T(this._onDestroy)).subscribe(e=>{e?(this.updateInputWidth(),this.disableInitialFocus||this._focus(),this._installPanelKeydownListener()):(this._removePanelKeydownListener?.(),this._removePanelKeydownListener=void 0,this.clearSearchInput&&this._reset())}),this.matSelect.openedChange.pipe(He(1),we(()=>{this._options=this.matSelect.options;let e=this._options.toArray()[this.getOptionsLengthOffset()];return this._options.changes.pipe(Ee(()=>{setTimeout(()=>{let t=this._options.toArray(),n=t[this.getOptionsLengthOffset()],s=this.matSelect._keyManager;s&&this.matSelect.panelOpen&&n&&((!e||!this.matSelect.compareWith(e.value,n.value)||!s.activeItem||!t.find(ee=>this.matSelect.compareWith(ee.value,s.activeItem?.value)))&&s.setActiveItem(this.getOptionsLengthOffset()),setTimeout(()=>{this.updateInputWidth()})),e=n})}))})).pipe(T(this._onDestroy)).subscribe(),this._showNoEntriesFound$.pipe(T(this._onDestroy)).subscribe(e=>{this.matOption&&(e?this.matOption._getHostElement().classList.add("mat-select-search-no-entries-found"):this.matOption._getHostElement().classList.remove("mat-select-search-no-entries-found"))}),this._viewportRuler.change().pipe(T(this._onDestroy)).subscribe(()=>{this.matSelect.panelOpen&&this.updateInputWidth()}),this.initMultipleHandling(),this.optionsList$.pipe(T(this._onDestroy)).subscribe(()=>{this.changeDetectorRef.markForCheck()})}_emitSelectAllBooleanToParent(e){this.toggleAll.emit(e)}ngOnDestroy(){this._removePanelKeydownListener?.(),this._removePanelKeydownListener=void 0,this._onDestroy.next(),this._onDestroy.complete()}_isToggleAllCheckboxVisible(){return this.matSelect.multiple&&this.showToggleAllCheckbox}_handleKeydown(e){(e.key&&e.key.length===1||this.preventHomeEndKeyPropagation&&(e.key==="Home"||e.key==="End"))&&e.stopPropagation(),this.matSelect.multiple&&e.key&&e.key==="Enter"&&setTimeout(()=>this._focus()),this.enableClearOnEscapePressed&&e.key==="Escape"&&this.value&&(this._reset(!0),e.stopPropagation())}_installPanelKeydownListener(){this._removePanelKeydownListener?.(),this._removePanelKeydownListener=void 0;let e=this.matSelect.panel?.nativeElement;if(!e)return;let t=n=>{n.stopPropagation()};e.addEventListener("keydown",t),this._removePanelKeydownListener=()=>e.removeEventListener("keydown",t)}_handleKeyup(e){if(e.key==="ArrowUp"||e.key==="ArrowDown"){let t=this.matSelect._getAriaActiveDescendant(),n=this._options.toArray().findIndex(s=>s.id===t);n!==-1&&(this.unselectActiveDescendant(),this.activeDescendant=this._options.toArray()[n]._getHostElement(),this.activeDescendant.setAttribute("aria-selected","true"),this.searchSelectInput.nativeElement.setAttribute("aria-activedescendant",t))}}writeValue(e){this._lastExternalInputValue=e,this._formControl.setValue(e),this.changeDetectorRef.markForCheck()}onBlur(){this.unselectActiveDescendant(),this.onTouched()}registerOnChange(e){this._formControl.valueChanges.pipe(Ve(t=>t!==this._lastExternalInputValue),Ee(()=>this._lastExternalInputValue=void 0),T(this._onDestroy)).subscribe(e)}registerOnTouched(e){this.onTouched=e}_focus(){if(!this.searchSelectInput||!this.matSelect.panel)return;let e=this.matSelect.panel.nativeElement,t=e.scrollTop;this.searchSelectInput.nativeElement.focus(),e.scrollTop=t}_reset(e){this._formControl.setValue(""),e&&this._focus()}initMultipleHandling(){if(!this.matSelect.ngControl){this.matSelect.multiple&&console.error("the mat-select containing ngx-mat-select-search must have a ngModel or formControl directive when multiple=true");return}this.previousSelectedValues=this.matSelect.ngControl.value,this.matSelect.ngControl.valueChanges&&this.matSelect.ngControl.valueChanges.pipe(T(this._onDestroy)).subscribe(e=>{let t=!1;if(this.matSelect.multiple&&(this.alwaysRestoreSelectedOptionsMulti||this._formControl.value&&this._formControl.value.length)&&this.previousSelectedValues&&Array.isArray(this.previousSelectedValues)){(!e||!Array.isArray(e))&&(e=[]);let n=this.matSelect.options.map(s=>s.value);this.previousSelectedValues.forEach(s=>{!e.some(m=>this.matSelect.compareWith(m,s))&&!n.some(m=>this.matSelect.compareWith(m,s))&&(this.recreateValuesArray?e=[...e,s]:e.push(s),t=!0)})}this.previousSelectedValues=e,t&&this.matSelect._onChange(e)})}updateInputWidth(){if(!this.innerSelectSearch||!this.innerSelectSearch.nativeElement)return;let e=this.innerSelectSearch.nativeElement,t=null;for(;e&&e.parentElement;)if(e=e.parentElement,e.classList.contains("mat-select-panel")){t=e;break}t&&(this.innerSelectSearch.nativeElement.style.width=t.clientWidth+"px")}getOptionsLengthOffset(){return this.matOption?1:0}unselectActiveDescendant(){this.activeDescendant?.removeAttribute("aria-selected"),this.searchSelectInput.nativeElement.removeAttribute("aria-activedescendant")}static \u0275fac=function(t){return new(t||i)(b(X),b(be),b(rt),b(P,8),b(Z,8),b(Mn,8))};static \u0275cmp=k({type:i,selectors:[["ngx-mat-select-search"]],contentQueries:function(t,n,s){if(t&1&&Ge(s,Cn,5)(s,wn,5),t&2){let m;E(m=I())&&(n.clearIcon=m.first),E(m=I())&&(n.noEntriesFound=m.first)}},viewQuery:function(t,n){if(t&1&&B(dn,7,R)(mn,7,R),t&2){let s;E(s=I())&&(n.searchSelectInput=s.first),E(s=I())&&(n.innerSelectSearch=s.first)}},inputs:{placeholderLabel:"placeholderLabel",type:"type",closeIcon:"closeIcon",closeSvgIcon:"closeSvgIcon",noEntriesFoundLabel:"noEntriesFoundLabel",clearSearchInput:"clearSearchInput",searching:"searching",disableInitialFocus:"disableInitialFocus",enableClearOnEscapePressed:"enableClearOnEscapePressed",preventHomeEndKeyPropagation:"preventHomeEndKeyPropagation",disableScrollToActiveOnOptionsChanged:"disableScrollToActiveOnOptionsChanged",ariaLabel:"ariaLabel",showToggleAllCheckbox:"showToggleAllCheckbox",toggleAllCheckboxChecked:"toggleAllCheckboxChecked",toggleAllCheckboxIndeterminate:"toggleAllCheckboxIndeterminate",toggleAllCheckboxTooltipMessage:"toggleAllCheckboxTooltipMessage",toggleAllCheckboxTooltipPosition:"toggleAllCheckboxTooltipPosition",hideClearSearchButton:"hideClearSearchButton",alwaysRestoreSelectedOptionsMulti:"alwaysRestoreSelectedOptionsMulti",recreateValuesArray:"recreateValuesArray"},outputs:{toggleAll:"toggleAll"},features:[pe([{provide:ve,useExisting:ae(()=>i),multi:!0}])],ngContentSelectors:hn,decls:13,vars:14,consts:[["innerSelectSearch",""],["searchSelectInput",""],["matInput","",1,"mat-select-search-input","mat-select-search-hidden"],[1,"mat-select-search-inner","mat-typography","mat-datepicker-content","mat-tab-header"],[1,"mat-select-search-inner-row"],["matTooltipClass","ngx-mat-select-search-toggle-all-tooltip",1,"mat-select-search-toggle-all-checkbox",3,"color","checked","indeterminate","matTooltip","matTooltipPosition"],["autocomplete","off",1,"mat-select-search-input",3,"keydown","keyup","blur","type","formControl","placeholder"],["diameter","16",1,"mat-select-search-spinner"],["mat-icon-button","","aria-label","Clear",1,"mat-select-search-clear"],[1,"mat-select-search-no-entries-found"],["matTooltipClass","ngx-mat-select-search-toggle-all-tooltip",1,"mat-select-search-toggle-all-checkbox",3,"change","color","checked","indeterminate","matTooltip","matTooltipPosition"],["mat-icon-button","","aria-label","Clear",1,"mat-select-search-clear",3,"click"],[3,"svgIcon"]],template:function(t,n){t&1&&(z(pn),h(0,"input",2),o(1,"div",3,0)(3,"div",4),N(4,un,1,5,"mat-checkbox",5),o(5,"input",6,1),u("keydown",function(m){return n._handleKeydown(m)})("keyup",function(m){return n._handleKeyup(m)})("blur",function(){return n.onBlur()}),r(),N(7,bn,1,0,"mat-spinner",7),N(8,xn,4,1,"button",8),A(9),r(),h(10,"mat-divider"),r(),N(11,yn,3,1,"div",9),Qe(12,"async")),t&2&&(l(),_("mat-select-search-inner-multiple",n.matSelect.multiple)("mat-select-search-inner-toggle-all",n._isToggleAllCheckboxVisible()),l(3),F(n._isToggleAllCheckboxVisible()?4:-1),l(),d("type",n.type)("formControl",n._formControl)("placeholder",n.placeholderLabel),C("aria-label",n.ariaLabel),l(2),F(n.searching?7:-1),l(),F(!n.hideClearSearchButton&&n.value&&!n.searching?8:-1),l(3),F(Ye(12,12,n._showNoEntriesFound$)?11:-1))},dependencies:[tt,Y,ye,K,Ce,Vt,Pt,xe,zt,q,W,ut],styles:[".mat-select-search-hidden[_ngcontent-%COMP%]{visibility:hidden}.mat-select-search-inner[_ngcontent-%COMP%]{position:absolute;top:0;left:0;width:100%;z-index:100;font-size:inherit;box-shadow:none;background-color:var(--mat-sys-surface-container, var(--mat-select-panel-background-color, white))}.mat-select-search-inner.mat-select-search-inner-multiple.mat-select-search-inner-toggle-all[_ngcontent-%COMP%]   .mat-select-search-inner-row[_ngcontent-%COMP%]{display:flex;align-items:center}.mat-select-search-input[_ngcontent-%COMP%]{box-sizing:border-box;width:100%;border:none;font-family:inherit;font-size:inherit;color:currentColor;outline:none;background-color:var(--mat-sys-surface-container, var(--mat-select-panel-background-color, white));padding:0 44px 0 16px;height:47px;line-height:47px}[dir=rtl][_nghost-%COMP%]   .mat-select-search-input[_ngcontent-%COMP%], [dir=rtl]   [_nghost-%COMP%]   .mat-select-search-input[_ngcontent-%COMP%]{padding-right:16px;padding-left:44px}.mat-select-search-input[_ngcontent-%COMP%]::placeholder{color:var(--mdc-filled-text-field-input-text-placeholder-color)}.mat-select-search-inner-toggle-all[_ngcontent-%COMP%]   .mat-select-search-input[_ngcontent-%COMP%]{padding-left:5px}.mat-select-search-no-entries-found[_ngcontent-%COMP%]{padding-top:8px}.mat-select-search-clear[_ngcontent-%COMP%]{position:absolute;right:4px;top:0}[dir=rtl][_nghost-%COMP%]   .mat-select-search-clear[_ngcontent-%COMP%], [dir=rtl]   [_nghost-%COMP%]   .mat-select-search-clear[_ngcontent-%COMP%]{right:auto;left:4px}.mat-select-search-spinner[_ngcontent-%COMP%]{position:absolute;right:16px;top:calc(50% - 8px)}[dir=rtl][_nghost-%COMP%]   .mat-select-search-spinner[_ngcontent-%COMP%], [dir=rtl]   [_nghost-%COMP%]   .mat-select-search-spinner[_ngcontent-%COMP%]{right:auto;left:16px}  .mat-mdc-option[aria-disabled=true].contains-mat-select-search{position:sticky;top:-8px;z-index:1;opacity:1;margin-top:-8px;pointer-events:all}  .mat-mdc-option[aria-disabled=true].contains-mat-select-search .mat-icon{margin-right:0;margin-left:0}  .mat-mdc-option[aria-disabled=true].contains-mat-select-search mat-pseudo-checkbox{display:none}  .mat-mdc-option[aria-disabled=true].contains-mat-select-search .mdc-list-item__primary-text{opacity:1}.mat-select-search-toggle-all-checkbox[_ngcontent-%COMP%]{padding-left:5px}[dir=rtl][_nghost-%COMP%]   .mat-select-search-toggle-all-checkbox[_ngcontent-%COMP%], [dir=rtl]   [_nghost-%COMP%]   .mat-select-search-toggle-all-checkbox[_ngcontent-%COMP%]{padding-left:0;padding-right:5px}"],changeDetection:0})}return i})();var Bt=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275mod=H({type:i});static \u0275inj=j({imports:[Re]})}return i})();var In=(i,c)=>[i,c];function Dn(i,c){if(i&1&&(o(0,"mat-option",45)(1,"span",46),a(2),r(),o(3,"span",47),a(4),r()()),i&2){let e=c.$implicit;d("value",e.codigo_tecnico),l(2),x(e.etiqueta),l(2),w("[",e.codigo_tecnico,"]")}}function Tn(i,c){if(i&1){let e=D();o(0,"div",48)(1,"div",49)(2,"mat-icon",50),a(3,"folder"),r(),o(4,"span",51),a(5),r()(),o(6,"button",52),u("click",function(){let n=v(e).$implicit,s=p(2);return y(s.onRemoveLink(n.codigo,s.nodo.codigo_tecnico))}),o(7,"mat-icon"),a(8,"link_off"),r()()()}if(i&2){let e=c.$implicit;l(5),x(e.etiqueta)}}function An(i,c){i&1&&(o(0,"div",53)(1,"mat-icon",54),a(2,"upgrade"),r(),o(3,"p",55),a(4,"Nodo Ra\xEDz del Sistema"),r()())}function On(i,c){if(i&1){let e=D();o(0,"div",56)(1,"div",49)(2,"mat-icon",57),a(3),r(),o(4,"span",51),a(5),r()(),o(6,"button",58),u("click",function(){let n=v(e).$implicit,s=p(2);return y(s.onRemoveLink(s.nodo.codigo_tecnico,n.codigo_tecnico))}),o(7,"mat-icon"),a(8,"link_off"),r()()()}if(i&2){let e=c.$implicit;l(3),x(e.children!=null&&e.children.length?"folder":"insert_drive_file"),l(2),x(e.etiqueta)}}function Rn(i,c){i&1&&(o(0,"div",53)(1,"mat-icon",54),a(2,"token"),r(),o(3,"p",55),a(4,"Sin Hijos definidos"),r()())}function Nn(i,c){if(i&1){let e=D();o(0,"div",92),u("click",function(){let n=v(e).$implicit,s=p(4);return y(s.selectRolForAudit(n.codigo))}),o(1,"div",23)(2,"div",93)(3,"mat-icon",65),a(4,"verified"),r()(),o(5,"div")(6,"h4",66),a(7),r(),o(8,"p",67),a(9),r()()(),o(10,"mat-icon",94),a(11),r()()}if(i&2){let e=c.$implicit,t=p(4);d("ngClass",t.selectedAuditRol()===e.codigo?"border-indigo-500 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20":"bg-white border-slate-100"),l(2),d("ngClass",t.selectedAuditRol()===e.codigo?"bg-indigo-600 text-white":"bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"),l(5),x(e.nombre),l(2),x(e.codigo),l(2),w(" ",t.selectedAuditRol()===e.codigo?"check_circle":"arrow_forward_ios"," ")}}function Fn(i,c){i&1&&(o(0,"div",95)(1,"mat-icon",96),a(2,"security_update_warning"),r(),o(3,"p",97),a(4,"No hay roles asignados directamente"),r()())}function Pn(i,c){if(i&1&&(o(0,"div",86)(1,"h3",87)(2,"mat-icon",88),a(3,"group_work"),r(),a(4," Roles con Acceso Autorizado "),r(),o(5,"div",89),g(6,Nn,12,5,"div",90)(7,Fn,5,0,"div",91),r()()),i&2){let e=p(3);l(6),d("ngForOf",e.rolesConAcceso()),l(),d("ngIf",e.rolesConAcceso().length===0)}}function Ln(i,c){if(i&1&&(o(0,"span",98),a(1),r()),i&2){let e=p(3);l(),me(" ",e.permisosDelRol().length," / ",e.allOperations().length," Operaciones ")}}function jn(i,c){if(i&1){let e=D();o(0,"div",99),u("click",function(){let n=v(e).$implicit,s=p(3);return y(s.selectedAuditRol()?s.togglePermission(n.nombre,n.assigned):null)}),o(1,"mat-icon",100),a(2),r(),o(3,"span",101),a(4),r(),h(5,"div",102),r()}if(i&2){let e=c.$implicit,t=p(3);d("ngClass",Ke(5,In,e.assigned?"bg-indigo-50 border-indigo-200 text-indigo-700":"bg-slate-50/30 border-slate-100 text-slate-400",t.selectedAuditRol()?"hover:scale-[1.02] cursor-pointer active:scale-95":"opacity-60 cursor-default")),l(),d("ngClass",e.assigned?"text-indigo-600":"text-slate-200"),l(),w(" ",e.assigned?"verified_user":"add_moderator"," "),l(2),x(e.nombre),l(),d("ngClass",e.assigned?"bg-indigo-600":"bg-slate-200")}}function Vn(i,c){i&1&&(o(0,"div",103)(1,"p",97),a(2,"Cargando cat\xE1logo de operaciones..."),r()())}function Hn(i,c){if(i&1&&(o(0,"mat-option",45)(1,"span",104),a(2),r()()),i&2){let e=c.$implicit;d("value",e.codigo),l(2),x(e.nombre)}}function zn(i,c){if(i&1&&(o(0,"div",59),g(1,Pn,8,2,"div",60),o(2,"div",61)(3,"div",62)(4,"div",63)(5,"div",23)(6,"div",64)(7,"mat-icon",65),a(8,"verified_user"),r()(),o(9,"div")(10,"h4",66),a(11,"Detalle de Permisos"),r(),o(12,"span",67),a(13," Gestiona los accesos y operaciones sobre este recurso "),r()()(),g(14,Ln,2,2,"span",68),r(),o(15,"div",69),g(16,jn,6,8,"div",70),r(),g(17,Vn,3,0,"div",71),r()(),h(18,"div",72),o(19,"div",73)(20,"h3",74)(21,"mat-icon",75),a(22,"add_moderator"),r(),a(23," Nueva Asignaci\xF3n de Acceso "),r(),o(24,"div",76)(25,"div",18)(26,"h4",77),a(27,"Seleccionar Rol Administrativo"),r(),o(28,"p",78),a(29,"Define qui\xE9n recibir\xE1 los nuevos permisos"),r()(),o(30,"mat-form-field",79)(31,"mat-select",80),g(32,Hn,3,2,"mat-option",30),r()()(),o(33,"div",81)(34,"mat-icon",82),a(35,"lightbulb"),r(),o(36,"p",83),a(37," Al seleccionar un rol arriba, la "),o(38,"span",84),a(39,"Matriz de Operaciones"),r(),a(40," superior se activar\xE1. Usa los botones de la matriz para "),o(41,"span",85),a(42,"Otorgar"),r(),a(43," o "),o(44,"span",85),a(45,"Revocar"),r(),a(46," permisos de forma inmediata para el rol seleccionado. "),r()()()()),i&2){let e=p(2);l(),d("ngIf",!e.selectedAuditRol()),l(2),d("ngClass",e.selectedAuditRol()?"border-l-indigo-500":"border-l-slate-300"),l(11),d("ngIf",e.selectedAuditRol()),l(2),d("ngForOf",e.permissionsMatrix()),l(),d("ngIf",e.allOperations().length===0),l(14),d("formControl",e.rolCtrl),l(),d("ngForOf",e.roles)}}function Bn(i,c){i&1&&(o(0,"div",105)(1,"div",106)(2,"mat-icon",107),a(3,"folder_special"),r()(),o(4,"h3",108),a(5,"Seguridad Restringida: Nodo Ra\xEDz"),r(),o(6,"p",109),a(7," Este recurso es una carpeta estructural de nivel superior. "),o(8,"span",110),a(9,"Asigne permisos en los niveles de Objeto o Sub-Atributo para habilitar el control de acceso."),r()()())}function $n(i,c){if(i&1){let e=D();o(0,"div",3)(1,"div",4),h(2,"div",5),o(3,"div",6)(4,"div",7)(5,"div",8)(6,"span",9),a(7),r(),o(8,"span",10),a(9),r()(),o(10,"h2",11),a(11),r(),o(12,"p",12),a(13),r()(),o(14,"div",13)(15,"button",14),u("click",function(){v(e);let n=p();return y(n.onEdit())}),o(16,"mat-icon"),a(17,"edit"),r()(),o(18,"button",15),u("click",function(){v(e);let n=p();return y(n.onAddChild())}),o(19,"mat-icon"),a(20,"add_box"),r()()()()(),o(21,"div",16),h(22,"div",17),o(23,"div",18)(24,"h4",19)(25,"mat-icon",20),a(26,"sync_alt"),r(),a(27," Vincular Recurso Existente "),r(),o(28,"div",21)(29,"button",22),u("click",function(){v(e);let n=p();return y(n.linkMode.set("hijo"))}),a(30," Como Hijo "),r(),o(31,"button",22),u("click",function(){v(e);let n=p();return y(n.linkMode.set("padre"))}),a(32," Como Padre "),r()()(),o(33,"div",23)(34,"div",24)(35,"p",25),a(36),r(),o(37,"p",26),a(38),r()(),o(39,"mat-form-field",27)(40,"mat-select",28)(41,"mat-option"),h(42,"ngx-mat-select-search",29),r(),g(43,Dn,5,3,"mat-option",30),r()(),o(44,"button",31),u("click",function(){v(e);let n=p();return y(n.onLink())}),o(45,"mat-icon"),a(46,"add_link"),r()()()(),o(47,"mat-tab-group",32)(48,"mat-tab",33)(49,"div",34)(50,"div",35)(51,"div",36)(52,"h3",37)(53,"mat-icon",38),a(54,"north"),r(),a(55," Dependencias Superiores (Padres) "),r(),o(56,"div",7),g(57,Tn,9,1,"div",39)(58,An,5,0,"div",40),r()(),o(59,"div",36)(60,"h3",37)(61,"mat-icon",41),a(62,"south"),r(),a(63," Composici\xF3n Interna (Hijos) "),r(),o(64,"div",7),g(65,On,9,2,"div",42)(66,Rn,5,0,"div",40),r()()()()(),o(67,"mat-tab",43),g(68,zn,47,7,"div",44)(69,Bn,10,0,"ng-template",null,0,he),r()()()}if(i&2){let e=$(70),t=p();l(7),x(t.nodo.tipo_nodo),l(),_("bg-emerald-50",t.nodo.activo)("text-emerald-700",t.nodo.activo)("bg-rose-50",!t.nodo.activo)("text-rose-700",!t.nodo.activo),l(),w(" ",t.nodo.activo?"Activo":"Inhabilitado"," "),l(2),x(t.nodo.etiqueta),l(2),x(t.nodo.codigo_tecnico),l(16),_("bg-indigo-600",t.linkMode()==="hijo")("text-white",t.linkMode()==="hijo"),l(2),_("bg-amber-600",t.linkMode()==="padre")("text-white",t.linkMode()==="padre"),l(5),w(" ",t.linkMode()==="hijo"?"Ser\xE1 hijo de ":"Ser\xE1 padre de "," "),l(2),x(t.nodo.etiqueta),l(2),d("formControl",t.searchHijoCtrl),l(2),d("formControl",t.searchFilterCtrl),l(),d("ngForOf",t.allNodes),l(14),d("ngForOf",t.parents),l(),d("ngIf",t.parents.length===0),l(7),d("ngForOf",t.nodo.children),l(),d("ngIf",!(t.nodo.children!=null&&t.nodo.children.length)),l(2),d("ngIf",!t.isRootFolder())("ngIfElse",e)}}function Un(i,c){i&1&&(o(0,"div",111)(1,"div",112)(2,"mat-icon",113),a(3,"alt_route"),r()(),o(4,"h3",114),a(5,"Hub de Gesti\xF3n"),r(),o(6,"p",115),a(7,"Selecciona un elemento de la jerarqu\xEDa para abrir el Hub administrativo y gestionar sus relaciones y permisos."),r()())}var $t=class i{constructor(c,e,t){this.accesosSvc=c;this.snackBar=e;this.dialog=t;Ue(()=>{this.nodo&&(this.resetAudit(),this.loadRolesConAcceso())},{allowSignalWrites:!0})}nodoSignal=S(null);set nodo(c){this.nodoSignal.set(c)}get nodo(){return this.nodoSignal()}parents=[];allNodes=[];allLinks=[];roles=[];operations=[];onReloadTree;searchHijoCtrl=new Q("");searchFilterCtrl=new Q("");rolCtrl=new Q("");permisosAsignados=S([]);isRootFolder=ue(()=>this.nodoSignal()?.tipo_nodo==="OBJ_ATTR"&&(!this.parents||this.parents.length===0));groupedPermissions=ue(()=>{let c=this.permisosAsignados(),e=this.roles,t={};return c.forEach(n=>{let s=n.USUARIO||n.usuario||n.ROL||n.rol||n.USER||n.usuario_codigo||n.codigo_usuario;if(!s){let L=Object.keys(n).find(oe=>oe.toUpperCase().includes("USUARIO")||oe.toUpperCase().includes("ROL")||oe.toUpperCase().includes("USER")||oe.toUpperCase().includes("CODIGO"));L&&(s=n[L])}s=s||"Desconocido";let m=e.find(L=>L.codigo===s||L.ID===s||L.nombre===s),ee=m?m.nombre:s;t[s]||(t[s]={userCode:s,displayName:ee,permissions:[]}),t[s].permissions.push(n)}),Object.values(t)});rolesConAcceso=S([]);selectedAuditRol=S(null);permisosDelRol=S([]);allOperations=S([]);permissionsMatrix=ue(()=>{let c=this.permisosDelRol();return this.allOperations().map(t=>({nombre:t.nombre_op||t,assigned:c.some(n=>n.op===(t.nombre_op||t))}))});resetAudit(){this.selectedAuditRol.set(null),this.rolesConAcceso.set([]),this.permisosDelRol.set([])}loadRolesConAcceso(){if(!this.nodo||!this.nodo.id_nodo){console.warn("[NodeDetailHub] loadRolesConAcceso >> No hay ID de nodo para auditar");return}console.log("[NodeDetailHub] loadRolesConAcceso >> Nodo ID:",this.nodo.id_nodo),this.accesosSvc.getOperaciones().subscribe(c=>this.allOperations.set(c)),this.accesosSvc.getRolesPorNodo(this.nodo.id_nodo).subscribe({next:c=>{console.log("[NodeDetailHub] Roles recibidos:",c),this.rolesConAcceso.set(c)}})}togglePermission(c,e){if(!this.selectedAuditRol()||!this.nodo)return;let t=this.selectedAuditRol(),n=this.nodo.codigo_tecnico;e?this.accesosSvc.revocarPermiso(t,n,c).subscribe(()=>{this.snackBar.open(`Permiso ${c} revocado`,"OK",{duration:2e3}),this.selectRolForAudit(t)}):this.accesosSvc.otorgarPermiso(t,n,c).subscribe(()=>{this.snackBar.open(`Permiso ${c} otorgado`,"OK",{duration:2e3}),this.selectRolForAudit(t)})}selectRolForAudit(c){this.selectedAuditRol.set(c),c&&this.nodo?(console.log(`[NodeDetailHub] Auditando permisos para Rol: ${c} y Nodo: ${this.nodo.codigo_tecnico}`),this.permisosDelRol.set([]),this.accesosSvc.getPermisos(c,this.nodo.codigo_tecnico,1,100).subscribe({next:e=>{console.log("[NodeDetailHub] Permisos detallados recibidos:",e.data?.length||0),this.permisosDelRol.set(e.data||[])},error:e=>{console.error("[NodeDetailHub] Error cargando permisos del rol:",e),this.snackBar.open("Error al cargar detalle de permisos","Cerrar",{duration:3e3})}})):this.permisosDelRol.set([])}loadPermisos(){this.selectedAuditRol()?this.selectRolForAudit(this.selectedAuditRol()):this.loadRolesConAcceso()}ngOnInit(){this.accesosSvc.getOperaciones().subscribe(c=>this.allOperations.set(c)),this.loadPermisos(),this.rolCtrl.valueChanges.subscribe(c=>{c&&this.selectRolForAudit(c)})}onEdit(){if(!this.nodo)return;this.dialog.open(ie,{width:"500px",data:{nodo:this.nodo,title:"Editar Nodo"}}).afterClosed().subscribe(e=>{e&&this.accesosSvc.upsertNodo(e).subscribe({next:()=>{this.snackBar.open("Nodo actualizado","Cerrar",{duration:2e3}),this.onReloadTree?.()}})})}onAddChild(){if(!this.nodo)return;this.dialog.open(ie,{width:"500px",data:{nodo:void 0,title:"Crear Nodo Hijo"}}).afterClosed().subscribe(e=>{e&&this.accesosSvc.upsertNodo(e).subscribe({next:()=>{this.accesosSvc.enlazarNodos(this.nodo.codigo_tecnico,e.codigo).subscribe({next:()=>{this.snackBar.open("Hijo creado y vinculado correctamente","Cerrar",{duration:2e3}),this.onReloadTree?.()},error:t=>this.snackBar.open("Error al vincular: "+t.message,"Cerrar")})},error:t=>this.snackBar.open("Error al crear nodo: "+t.message,"Cerrar")})})}linkMode=S("hijo");onLink(){if(!this.nodo||!this.searchHijoCtrl.value)return;let c=this.searchHijoCtrl.value,e=this.linkMode()==="hijo"?c:this.nodo.codigo_tecnico,t=this.linkMode()==="hijo"?this.nodo.codigo_tecnico:c,n=this.allLinks.filter(s=>s.hijo.trim().toUpperCase()===e.trim().toUpperCase()).map(s=>s.padre);if(n.length>0){let s=n.map(m=>this.accesosSvc.deleteEnlace(m,e));je(s).subscribe({next:()=>this.executeLinking(t,e),error:m=>this.snackBar.open("Error al limpiar v\xEDnculos anteriores: "+m.message,"Cerrar")})}else this.executeLinking(t,e)}executeLinking(c,e){this.accesosSvc.enlazarNodos(c,e).subscribe({next:()=>{let t=this.linkMode()==="hijo"?"Hijo movido correctamente":"Padre actualizado correctamente";this.snackBar.open(t,"Cerrar",{duration:2e3}),this.searchHijoCtrl.reset(),this.onReloadTree?.()},error:t=>this.snackBar.open("Error al vincular: "+t.message,"Cerrar")})}onRemoveLink(c,e){this.dialog.open(Te,{width:"400px",data:{title:"Quitar V\xEDnculo",message:`\xBFEliminar relaci\xF3n entre ${c} y ${e}?`}}).afterClosed().subscribe(n=>{n&&this.accesosSvc.deleteEnlace(c,e).subscribe({next:()=>{this.snackBar.open("V\xEDnculo eliminado","Cerrar",{duration:2e3}),this.onReloadTree?.()}})})}onGrantPermission(c){let e=this.rolCtrl.value;if(!e||!this.nodo){this.snackBar.open("Selecciona un rol primero","Cerrar");return}this.accesosSvc.otorgarPermiso(e,this.nodo.codigo_tecnico,c).subscribe({next:()=>{this.snackBar.open(`Permiso ${c} otorgado al rol ${e}`,"Cerrar",{duration:2e3}),this.loadPermisos()},error:t=>this.snackBar.open("Error: "+t.message,"Cerrar")})}onRevokePermission(c,e,t){this.dialog.open(Te,{width:"400px",data:{title:"Revocar Permiso",message:`\xBFConfirma revocar el permiso ${t} para ${c}?`}}).afterClosed().subscribe(s=>{s&&this.accesosSvc.revocarPermiso(c,e,t).subscribe({next:()=>{this.snackBar.open("Permiso revocado","Cerrar",{duration:2e3}),this.loadPermisos()}})})}static \u0275fac=function(e){return new(e||i)(b(ke),b(gt),b(Et))};static \u0275cmp=k({type:i,selectors:[["app-node-detail-hub"]],inputs:{nodo:"nodo",parents:"parents",allNodes:"allNodes",allLinks:"allLinks",roles:"roles",operations:"operations",onReloadTree:"onReloadTree"},decls:2,vars:2,consts:[["rootFolderMsg",""],["class","flex flex-col h-full animate-in slide-in-from-right-4 duration-500",4,"ngIf"],["class","flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 p-12 text-center group",4,"ngIf"],[1,"flex","flex-col","h-full","animate-in","slide-in-from-right-4","duration-500"],[1,"bg-white","rounded-2xl","border","border-slate-100","p-4","shadow-sm","relative","overflow-hidden","mb-3"],[1,"absolute","top-0","right-0","w-32","h-32","bg-indigo-50","rounded-full","-mr-16","-mt-16","opacity-40","blur-2xl"],[1,"relative","flex","justify-between","items-start"],[1,"space-y-1.5"],[1,"flex","items-center","gap-1.5"],[1,"px-2","py-0.5","bg-indigo-50","text-indigo-700","rounded-full","text-[9px]","font-black","uppercase","tracking-widest"],[1,"px-2","py-0.5","rounded-full","text-[9px]","font-black","uppercase","tracking-widest"],[1,"text-2xl","font-black","text-slate-900","tracking-tight","leading-none"],[1,"text-slate-400","font-mono","text-[9px]","uppercase","tracking-widest","font-bold"],[1,"flex","gap-2"],["matTooltip","Editar Atributos del Nodo",1,"btn-action","btn-action-edit",3,"click"],["matTooltip","Crear y Vincular Nuevo Hijo",1,"btn-action","btn-action-create",3,"click"],[1,"bg-slate-900","rounded-2xl","p-4","text-white","flex","items-center","gap-4","mb-4","shadow-xl","shadow-slate-200","relative","overflow-hidden"],[1,"absolute","top-0","right-0","w-24","h-24","bg-white/5","rounded-full","-mr-12","-mt-12"],[1,"flex-1"],[1,"text-xs","font-black","uppercase","tracking-tight","flex","items-center","gap-2"],[1,"!text-sm","text-indigo-400"],[1,"flex","items-center","gap-2","mt-1"],[1,"px-2","py-0.5","rounded-lg","text-[8px]","font-black","uppercase","tracking-widest","border","border-white/10","hover:bg-white/10","transition-all",3,"click"],[1,"flex","items-center","gap-3"],[1,"text-right"],[1,"text-[8px]","font-black","text-indigo-300","uppercase","tracking-widest"],[1,"text-[9px]","font-bold","text-white","truncate","max-w-[120px]"],["appearance","fill",1,"!h-[42px]","custom-white-field-mini","min-w-[240px]"],["placeholder","Seleccionar recurso...",1,"!text-[10px]","font-bold",3,"formControl"],["placeholderLabel","Filtrar por nombre...",3,"formControl"],[3,"value",4,"ngFor","ngForOf"],["matTooltip","Ejecutar Vinculaci\xF3n",1,"btn-action","btn-action-link",3,"click"],[1,"flex-1","bg-white","rounded-2xl","border","border-slate-100","shadow-sm","overflow-hidden","custom-hub-tabs"],["label","Estructura y Jerarqu\xEDa"],[1,"p-4","space-y-4"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-3"],[1,"bg-slate-50/50","rounded-xl","p-3","border","border-slate-100"],[1,"text-[9px]","font-black","text-slate-400","uppercase","tracking-widest","mb-2","flex","items-center","gap-2"],[1,"!text-[10px]","text-amber-500"],["class","flex items-center justify-between p-2 bg-white rounded-lg group hover:bg-amber-50 transition-all border border-slate-100",4,"ngFor","ngForOf"],["class","py-8 text-center border border-dashed border-slate-200 rounded-lg",4,"ngIf"],[1,"!text-[10px]","text-indigo-500"],["class","flex items-center justify-between p-2 bg-white rounded-lg group hover:bg-indigo-50 transition-all border border-slate-100",4,"ngFor","ngForOf"],["label","Seguridad y Roles"],["class","p-4 space-y-6",4,"ngIf","ngIfElse"],[3,"value"],[1,"text-[10px]","font-bold","text-slate-700"],[1,"text-[8px]","text-slate-400","font-mono","ml-2"],[1,"flex","items-center","justify-between","p-2","bg-white","rounded-lg","group","hover:bg-amber-50","transition-all","border","border-slate-100"],[1,"flex","items-center","gap-2"],[1,"text-amber-600","!text-xs"],[1,"text-[11px]","font-bold","text-slate-700"],["matTooltip","Quitar Dependencia",1,"btn-action","btn-action-delete","btn-action-sm","opacity-0","group-hover:opacity-100",3,"click"],[1,"py-8","text-center","border","border-dashed","border-slate-200","rounded-lg"],[1,"text-slate-200","!text-2xl","mb-1"],[1,"text-[9px]","font-black","text-slate-300","uppercase","tracking-widest","italic"],[1,"flex","items-center","justify-between","p-2","bg-white","rounded-lg","group","hover:bg-indigo-50","transition-all","border","border-slate-100"],[1,"text-indigo-600","!text-xs"],["matTooltip","Quitar Vinculo con Hijo",1,"btn-action","btn-action-delete","btn-action-sm","opacity-0","group-hover:opacity-100",3,"click"],[1,"p-4","space-y-6"],["class","animate-in fade-in slide-in-from-top-4 duration-700",4,"ngIf"],[1,"animate-in","slide-in-from-bottom-4","duration-500","mt-6"],[1,"bg-white","rounded-[24px]","border","border-slate-100","shadow-sm","overflow-hidden","border-l-4",3,"ngClass"],[1,"bg-slate-50/80","px-4","py-3","border-b","border-slate-100","flex","items-center","justify-between"],[1,"w-10","h-10","rounded-xl","bg-indigo-600","text-white","flex","items-center","justify-center","shadow-lg","shadow-indigo-100"],[1,"!text-sm"],[1,"text-[11px]","font-black","text-slate-800","uppercase","tracking-tight"],[1,"text-[8px]","font-bold","text-slate-400","uppercase","tracking-widest"],["class","px-2.5 py-1 bg-white text-[8px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-50 rounded-lg shadow-sm",4,"ngIf"],[1,"p-4","grid","grid-cols-2","sm:grid-cols-3","lg:grid-cols-4","gap-3"],["class","group flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",3,"ngClass","click",4,"ngFor","ngForOf"],["class","p-8 text-center bg-slate-50/30",4,"ngIf"],[1,"h-px","bg-slate-100"],[1,"space-y-4"],[1,"text-[10px]","font-black","text-slate-400","uppercase","tracking-[0.2em]","mb-4","flex","items-center","gap-2","px-1"],[1,"!text-[14px]","text-emerald-500"],[1,"flex","items-center","gap-4","bg-slate-50","p-4","rounded-2xl","border","border-slate-100"],[1,"text-xs","font-black","uppercase","tracking-tight","text-slate-700"],[1,"text-[9px]","text-slate-400","font-bold","uppercase","tracking-widest","mt-1"],["appearance","fill",1,"!h-[44px]","min-w-[280px]","custom-white-field-mini"],["placeholder","Buscar Rol en el Sistema...",1,"!text-[11px]","font-bold",3,"formControl"],[1,"p-4","bg-indigo-50/50","rounded-2xl","border","border-indigo-100/50","flex","items-start","gap-3"],[1,"text-indigo-500","!text-lg"],[1,"text-[10px]","text-indigo-800","leading-relaxed","font-medium"],[1,"font-black","italic"],[1,"font-black"],[1,"animate-in","fade-in","slide-in-from-top-4","duration-700"],[1,"text-[9px]","font-black","text-slate-400","uppercase","tracking-[0.2em]","mb-4","flex","items-center","gap-2","px-1"],[1,"!text-[12px]","text-amber-500"],[1,"grid","grid-cols-1","sm:grid-cols-2","gap-3","px-1"],["class","group p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between border-2",3,"ngClass","click",4,"ngFor","ngForOf"],["class","col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/20",4,"ngIf"],[1,"group","p-4","rounded-2xl","shadow-sm","hover:shadow-md","hover:border-indigo-200","transition-all","cursor-pointer","flex","items-center","justify-between","border-2",3,"click","ngClass"],[1,"w-10","h-10","rounded-xl","flex","items-center","justify-center","transition-colors",3,"ngClass"],[1,"!text-[10px]","text-slate-200","group-hover:text-indigo-300","group-hover:translate-x-1","transition-all"],[1,"col-span-full","py-12","text-center","border-2","border-dashed","border-slate-100","rounded-[32px]","bg-slate-50/20"],[1,"!text-4xl","text-slate-100","mb-2"],[1,"text-[9px]","text-slate-300","font-bold","uppercase","tracking-widest","italic"],[1,"px-2.5","py-1","bg-white","text-[8px]","font-black","text-indigo-600","uppercase","tracking-widest","border","border-indigo-50","rounded-lg","shadow-sm"],[1,"group","flex","flex-col","items-center","justify-center","p-4","rounded-2xl","border-2","transition-all",3,"click","ngClass"],[1,"!text-2xl","mb-2","transition-colors",3,"ngClass"],[1,"text-[10px]","font-black","uppercase","tracking-[0.1em]","text-center"],[1,"mt-3","w-6","h-1","rounded-full","transition-colors",3,"ngClass"],[1,"p-8","text-center","bg-slate-50/30"],[1,"text-[11px]","font-bold"],[1,"flex-1","flex","flex-col","items-center","justify-center","p-12","text-center","h-[500px]"],[1,"w-28","h-28","rounded-[40px]","bg-amber-50","text-amber-500","flex","items-center","justify-center","mb-8","shadow-2xl","shadow-amber-100/50","animate-bounce","duration-[4000ms]"],[1,"!text-5xl"],[1,"text-2xl","font-black","text-slate-800","tracking-tight","mb-3"],[1,"text-slate-400","max-w-sm","mx-auto","text-[11px]","font-bold","uppercase","tracking-[0.2em]","leading-relaxed"],[1,"block","mt-6","text-indigo-500","font-black"],[1,"flex-1","flex","flex-col","items-center","justify-center","bg-slate-50/50","rounded-2xl","border-2","border-dashed","border-slate-100","p-12","text-center","group"],[1,"w-20","h-20","rounded-full","bg-white","shadow-sm","flex","items-center","justify-center","mb-4","group-hover:scale-110","transition-transform","duration-500"],[1,"!text-4xl","text-slate-200"],[1,"text-lg","font-black","text-slate-300","uppercase","tracking-tighter"],[1,"text-slate-300","max-w-xs","mx-auto","mt-2","font-medium","text-[10px]","leading-relaxed"]],template:function(e,t){e&1&&g(0,$n,71,31,"div",1)(1,Un,8,0,"div",2),e&2&&(d("ngIf",t.nodo),l(),d("ngIf",!t.nodo))},dependencies:[fe,Xe,ge,Je,Y,K,Ce,St,ht,mt,pt,_e,q,W,Se,Z,Me,X,P,st,xe,Bt,Re],styles:["[_nghost-%COMP%]{display:block;height:100%}"]})};export{Pt as a,Gn as b,ie as c,Bt as d,$t as e};
