import{a as I,b as Ge}from"./chunk-GAPVYWDB.js";import{a as we,b as ve,c as De,d as Me,e as Ee,f as ke,g as Te,h as Ie,i as Ae,j as He,k as Oe,l as Re,m as Pe,n as Fe}from"./chunk-UXBOM47X.js";import{a as xe,b as Se}from"./chunk-4KGHPK4M.js";import{A as Ce,t as ge,w as be,z as ye}from"./chunk-EZZT5SDG.js";import{a as _e,c as fe,f as he}from"./chunk-EERINNJX.js";import{A as de,Fa as ue,N as me,aa as pe,g as re,h as ie,i as oe,m as ae,v as se,y as ce,z as le}from"./chunk-F3EBUNGJ.js";import{$ as N,A as G,Aa as $,Ab as K,Eb as d,Fb as a,Gb as l,Hb as M,Hc as ne,Ib as E,Jb as y,Kb as U,Kc as w,Lb as C,Mb as x,Ob as k,Sb as _,Ub as s,Va as o,Vb as W,Wb as A,Yb as Z,Z as V,Zb as H,_b as O,ba as p,cb as L,cc as J,dc as X,ec as S,ga as f,gc as m,h as P,ha as h,hc as ee,ia as B,ib as D,ic as T,j as F,jb as q,kb as Q,oa as u,ob as g,qc as te,ta as z,xa as j,yb as b,zb as Y}from"./chunk-IXRD3AB4.js";var $e=["mat-sort-header",""],Le=["*",[["","matSortHeaderIcon",""]]],qe=["*","[matSortHeaderIcon]"];function Qe(t,i){t&1&&(B(),E(0,"svg",3),U(1,"path",4),y())}function Ye(t,i){t&1&&(E(0,"div",2),A(1,1,null,Qe,2,0),y())}var Ve=new N("MAT_SORT_DEFAULT_OPTIONS"),v=(()=>{class t{_defaultOptions;_initializedStream=new F(1);sortables=new Map;_stateChanges=new P;active;start="asc";get direction(){return this._direction}set direction(e){this._direction=e}_direction="";disableClear;disabled=!1;sortChange=new u;initialized=this._initializedStream;constructor(e){this._defaultOptions=e}register(e){this.sortables.set(e.id,e)}deregister(e){this.sortables.delete(e.id)}sort(e){this.active!=e.id?(this.active=e.id,this.direction=e.start?e.start:this.start):this.direction=this.getNextSortDirection(e),this.sortChange.emit({active:this.active,direction:this.direction})}getNextSortDirection(e){if(!e)return"";let n=e?.disableClear??this.disableClear??!!this._defaultOptions?.disableClear,r=Ke(e.start||this.start,n),c=r.indexOf(this.direction)+1;return c>=r.length&&(c=0),r[c]}ngOnInit(){this._initializedStream.next()}ngOnChanges(){this._stateChanges.next()}ngOnDestroy(){this._stateChanges.complete(),this._initializedStream.complete()}static \u0275fac=function(n){return new(n||t)(L(Ve,8))};static \u0275dir=Q({type:t,selectors:[["","matSort",""]],hostAttrs:[1,"mat-sort"],inputs:{active:[0,"matSortActive","active"],start:[0,"matSortStart","start"],direction:[0,"matSortDirection","direction"],disableClear:[2,"matSortDisableClear","disableClear",w],disabled:[2,"matSortDisabled","disabled",w]},outputs:{sortChange:"matSortChange"},exportAs:["matSort"],features:[j]})}return t})();function Ke(t,i){let e=["asc","desc"];return t=="desc"&&e.reverse(),i||e.push(""),e}var Ne=(()=>{class t{_sort=p(v,{optional:!0});_columnDef=p(we,{optional:!0});_changeDetectorRef=p(ne);_focusMonitor=p(me);_elementRef=p($);_ariaDescriber=p(pe,{optional:!0});_renderChanges;_animationsDisabled=ue();_recentlyCleared=z(null);_sortButton;id;arrowPosition="after";start;disabled=!1;get sortActionDescription(){return this._sortActionDescription}set sortActionDescription(e){this._updateSortActionDescription(e)}_sortActionDescription="Sort";disableClear;constructor(){p(se).load(_e);let e=p(Ve,{optional:!0});this._sort,e?.arrowPosition&&(this.arrowPosition=e?.arrowPosition)}ngOnInit(){!this.id&&this._columnDef&&(this.id=this._columnDef.name),this._sort.register(this),this._renderChanges=G(this._sort._stateChanges,this._sort.sortChange).subscribe(()=>this._changeDetectorRef.markForCheck()),this._sortButton=this._elementRef.nativeElement.querySelector(".mat-sort-header-container"),this._updateSortActionDescription(this._sortActionDescription)}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,!0).subscribe(()=>{Promise.resolve().then(()=>this._recentlyCleared.set(null))})}ngOnDestroy(){this._focusMonitor.stopMonitoring(this._elementRef),this._sort.deregister(this),this._renderChanges?.unsubscribe(),this._sortButton&&this._ariaDescriber?.removeDescription(this._sortButton,this._sortActionDescription)}_toggleOnInteraction(){if(!this._isDisabled()){let e=this._isSorted(),n=this._sort.direction;this._sort.sort(this),this._recentlyCleared.set(e&&!this._isSorted()?n:null)}}_handleKeydown(e){(e.keyCode===32||e.keyCode===13)&&(e.preventDefault(),this._toggleOnInteraction())}_isSorted(){return this._sort.active==this.id&&(this._sort.direction==="asc"||this._sort.direction==="desc")}_isDisabled(){return this._sort.disabled||this.disabled}_getAriaSortAttribute(){return this._isSorted()?this._sort.direction=="asc"?"ascending":"descending":"none"}_renderArrow(){return!this._isDisabled()||this._isSorted()}_updateSortActionDescription(e){this._sortButton&&(this._ariaDescriber?.removeDescription(this._sortButton,this._sortActionDescription),this._ariaDescriber?.describe(this._sortButton,e)),this._sortActionDescription=e}static \u0275fac=function(n){return new(n||t)};static \u0275cmp=D({type:t,selectors:[["","mat-sort-header",""]],hostAttrs:[1,"mat-sort-header"],hostVars:3,hostBindings:function(n,r){n&1&&_("click",function(){return r._toggleOnInteraction()})("keydown",function(R){return r._handleKeydown(R)})("mouseleave",function(){return r._recentlyCleared.set(null)}),n&2&&(b("aria-sort",r._getAriaSortAttribute()),S("mat-sort-header-disabled",r._isDisabled()))},inputs:{id:[0,"mat-sort-header","id"],arrowPosition:"arrowPosition",start:"start",disabled:[2,"disabled","disabled",w],sortActionDescription:"sortActionDescription",disableClear:[2,"disableClear","disableClear",w]},exportAs:["matSortHeader"],attrs:$e,ngContentSelectors:qe,decls:4,vars:17,consts:[[1,"mat-sort-header-container","mat-focus-indicator"],[1,"mat-sort-header-content"],[1,"mat-sort-header-arrow"],["viewBox","0 -960 960 960","focusable","false","aria-hidden","true"],["d","M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z"]],template:function(n,r){n&1&&(W(Le),E(0,"div",0)(1,"div",1),A(2),y(),Y(3,Ye,3,0,"div",2),y()),n&2&&(S("mat-sort-header-sorted",r._isSorted())("mat-sort-header-position-before",r.arrowPosition==="before")("mat-sort-header-descending",r._sort.direction==="desc")("mat-sort-header-ascending",r._sort.direction==="asc")("mat-sort-header-recently-cleared-ascending",r._recentlyCleared()==="asc")("mat-sort-header-recently-cleared-descending",r._recentlyCleared()==="desc")("mat-sort-header-animations-disabled",r._animationsDisabled),b("tabindex",r._isDisabled()?null:0)("role",r._isDisabled()?null:"button"),o(3),K(r._renderArrow()?3:-1))},styles:[`.mat-sort-header {
  cursor: pointer;
}

.mat-sort-header-disabled {
  cursor: default;
}

.mat-sort-header-container {
  display: flex;
  align-items: center;
  letter-spacing: normal;
  outline: 0;
}
[mat-sort-header].cdk-keyboard-focused .mat-sort-header-container, [mat-sort-header].cdk-program-focused .mat-sort-header-container {
  border-bottom: solid 1px currentColor;
}
.mat-sort-header-container::before {
  margin: calc(calc(var(--mat-focus-indicator-border-width, 3px) + 2px) * -1);
}

.mat-sort-header-content {
  display: flex;
  align-items: center;
}

.mat-sort-header-position-before {
  flex-direction: row-reverse;
}

@keyframes _mat-sort-header-recently-cleared-ascending {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-25%);
    opacity: 0;
  }
}
@keyframes _mat-sort-header-recently-cleared-descending {
  from {
    transform: translateY(0) rotate(180deg);
    opacity: 1;
  }
  to {
    transform: translateY(25%) rotate(180deg);
    opacity: 0;
  }
}
.mat-sort-header-arrow {
  height: 12px;
  width: 12px;
  position: relative;
  transition: transform 225ms cubic-bezier(0.4, 0, 0.2, 1), opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  overflow: visible;
  color: var(--mat-sort-arrow-color, var(--mat-sys-on-surface));
}
.mat-sort-header.cdk-keyboard-focused .mat-sort-header-arrow, .mat-sort-header.cdk-program-focused .mat-sort-header-arrow, .mat-sort-header:hover .mat-sort-header-arrow {
  opacity: 0.54;
}
.mat-sort-header .mat-sort-header-sorted .mat-sort-header-arrow {
  opacity: 1;
}
.mat-sort-header-descending .mat-sort-header-arrow {
  transform: rotate(180deg);
}
.mat-sort-header-recently-cleared-ascending .mat-sort-header-arrow {
  transform: translateY(-25%);
}
.mat-sort-header-recently-cleared-ascending .mat-sort-header-arrow {
  transition: none;
  animation: _mat-sort-header-recently-cleared-ascending 225ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.mat-sort-header-recently-cleared-descending .mat-sort-header-arrow {
  transition: none;
  animation: _mat-sort-header-recently-cleared-descending 225ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.mat-sort-header-animations-disabled .mat-sort-header-arrow {
  transition-duration: 0ms;
  animation-duration: 0ms;
}
.mat-sort-header-arrow > svg, .mat-sort-header-arrow [matSortHeaderIcon] {
  width: 24px;
  height: 24px;
  fill: currentColor;
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -12px 0 0 -12px;
  transform: translateZ(0);
}
.mat-sort-header-arrow, [dir=rtl] .mat-sort-header-position-before .mat-sort-header-arrow {
  margin: 0 0 0 6px;
}
.mat-sort-header-position-before .mat-sort-header-arrow, [dir=rtl] .mat-sort-header-arrow {
  margin: 0 6px 0 0;
}
`],encapsulation:2,changeDetection:0})}return t})(),Be=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=q({type:t});static \u0275inj=V({imports:[ce]})}return t})();var We=()=>[5,10,25,100];function Ze(t,i){if(t&1&&(a(0,"th",17),m(1),l()),t&2){let e=s().$implicit;o(),T(" ",e.header," ")}}function Je(t,i){if(t&1){let e=k();a(0,"button",24),_("click",function(r){f(e);let c=s(2).$implicit;return s(2).onToggle.emit(c),h(r.stopPropagation())}),a(1,"mat-icon",25),m(2," chevron_right "),l()()}if(t&2){let e=s(2).$implicit,n=s(2);o(),S("rotate-90",n.isExpanded==null?null:n.isExpanded(e.codigo_tecnico))}}function Xe(t,i){t&1&&M(0,"div",26)}function et(t,i){if(t&1&&(C(0),a(1,"div",20),g(2,Je,3,2,"button",21)(3,Xe,1,0,"div",22),a(4,"span",23),m(5),l()(),x()),t&2){let e=s().$implicit,n=s().$implicit,r=s();o(),X("padding-left",n.key===r.columns[0].key?e.level*20:0,"px"),o(),d("ngIf",n.key===r.columns[0].key&&e.hasChildren),o(),d("ngIf",n.key===r.columns[0].key&&!e.hasChildren&&e.level>0),o(2),ee(e[n.key])}}function tt(t,i){if(t&1&&(C(0),a(1,"span",27),m(2),l(),x()),t&2){let e=s().$implicit,n=s().$implicit;o(),d("ngClass",e[n.key]?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"),o(),T(" ",e[n.key]?"Activo":"Inactivo"," ")}}function nt(t,i){if(t&1){let e=k();C(0),a(1,"div",28)(2,"button",29),_("click",function(){f(e);let r=s().$implicit,c=s(2);return h(c.onEdit.emit(r))}),a(3,"mat-icon",30),m(4,"edit"),l()(),a(5,"button",31),_("click",function(){f(e);let r=s().$implicit,c=s(2);return h(c.onDelete.emit(r))}),a(6,"mat-icon",30),m(7,"delete"),l()()(),x()}}function rt(t,i){if(t&1&&(a(0,"td",18),g(1,et,6,5,"ng-container",19)(2,tt,3,2,"ng-container",19)(3,nt,8,0,"ng-container",19),l()),t&2){let e=s().$implicit;o(),d("ngIf",e.type!=="action"&&e.type!=="boolean"),o(),d("ngIf",e.type==="boolean"),o(),d("ngIf",e.type==="action")}}function it(t,i){if(t&1&&(C(0,14),g(1,Ze,2,1,"th",15)(2,rt,4,3,"td",16),x()),t&2){let e=i.$implicit;d("matColumnDef",e.key)}}function ot(t,i){t&1&&M(0,"tr",32)}function at(t,i){if(t&1){let e=k();a(0,"tr",33),_("click",function(){let r=f(e).$implicit,c=s();return h(c.onRowClick.emit(r))}),l()}}function st(t,i){if(t&1&&(a(0,"tr",34)(1,"td",35)(2,"div",36)(3,"mat-icon",37),m(4,"search_off"),l(),a(5,"p",38),m(6),l()()()()),t&2){let e=s(),n=J(6);o(),b("colspan",e.columns.length),o(5),T('No se encontraron datos que coincidan con "',n.value,'"')}}var ze=class t{set data(i){this.dataSource.data=i||[]}columns=[];total=0;pageSize=5;pageIndex=0;onEdit=new u;onDelete=new u;onRowClick=new u;onToggle=new u;pageChange=new u;isExpanded;dataSource=new Fe([]);paginator;sort;get displayedColumns(){return this.columns.map(i=>i.key)}ngAfterViewInit(){this.dataSource.paginator=this.paginator,this.dataSource.sort=this.sort}applyFilter(i){let e=i.target.value;this.dataSource.filter=e.trim().toLowerCase()}static \u0275fac=function(e){return new(e||t)};static \u0275cmp=D({type:t,selectors:[["app-generic-table"]],viewQuery:function(e,n){if(e&1&&Z(I,5)(v,5),e&2){let r;H(r=O())&&(n.paginator=r.first),H(r=O())&&(n.sort=r.first)}},inputs:{data:"data",columns:"columns",total:"total",pageSize:"pageSize",pageIndex:"pageIndex",isExpanded:"isExpanded"},outputs:{onEdit:"onEdit",onDelete:"onDelete",onRowClick:"onRowClick",onToggle:"onToggle",pageChange:"pageChange"},decls:17,vars:6,consts:[["input",""],[1,"table-container","mat-elevation-z8","bg-white","rounded-2xl","shadow-sm","border","border-gray-100","overflow-hidden"],[1,"p-6","border-b","border-gray-50","bg-gray-50/30"],["appearance","outline",1,"w-full","!mb-0"],["matInput","","placeholder","Escribe para filtrar resultados...",3,"keyup"],["matSuffix","",1,"material-icons","text-gray-400"],[1,"overflow-x-auto"],["mat-table","","matSort","",1,"w-full",3,"dataSource"],[3,"matColumnDef",4,"ngFor","ngForOf"],["mat-header-row","",4,"matHeaderRowDef"],["mat-row","","class","hover:bg-blue-50/30 transition-colors duration-150 cursor-pointer",3,"click",4,"matRowDef","matRowDefColumns"],["class","mat-row",4,"matNoDataRow"],[1,"bg-gray-50/50","border-t","border-gray-50"],["aria-label","Seleccionar p\xE1gina",1,"!bg-transparent",3,"pageSizeOptions"],[3,"matColumnDef"],["mat-header-cell","","mat-sort-header","","class","bg-white py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50",4,"matHeaderCellDef"],["mat-cell","","class","py-4 px-6 border-b border-gray-50",4,"matCellDef"],["mat-header-cell","","mat-sort-header","",1,"bg-white","py-4","px-6","text-xs","font-bold","text-gray-400","uppercase","tracking-widest","border-b","border-gray-50"],["mat-cell","",1,"py-4","px-6","border-b","border-gray-50"],[4,"ngIf"],[1,"flex","items-center","gap-2"],["mat-icon-button","","class","!w-6 !h-6 !leading-none shrink-0",3,"click",4,"ngIf"],["class","w-6 h-6 shrink-0",4,"ngIf"],[1,"text-sm","text-gray-700","font-medium","truncate"],["mat-icon-button","",1,"!w-6","!h-6","!leading-none","shrink-0",3,"click"],[1,"!text-[14px]","transition-transform","duration-200"],[1,"w-6","h-6","shrink-0"],[1,"px-2","py-1","rounded-full","text-[10px]","font-bold","uppercase","tracking-tight",3,"ngClass"],[1,"flex","items-center","gap-1"],["mat-icon-button","","title","Editar",1,"!text-blue-500","hover:bg-blue-50","transition-colors",3,"click"],[1,"material-icons"],["mat-icon-button","","title","Eliminar",1,"!text-red-500","hover:bg-red-50","transition-colors",3,"click"],["mat-header-row",""],["mat-row","",1,"hover:bg-blue-50/30","transition-colors","duration-150","cursor-pointer",3,"click"],[1,"mat-row"],[1,"mat-cell","p-12","text-center"],[1,"flex","flex-col","items-center","gap-3","text-gray-400"],[1,"material-icons","text-5xl","opacity-20"],[1,"text-sm","font-medium"]],template:function(e,n){e&1&&(a(0,"div",1)(1,"div",2)(2,"mat-form-field",3)(3,"mat-label"),m(4,"Buscar en la tabla"),l(),a(5,"input",4,0),_("keyup",function(c){return n.applyFilter(c)}),l(),a(7,"mat-icon",5),m(8,"search"),l()()(),a(9,"div",6)(10,"table",7),g(11,it,3,1,"ng-container",8)(12,ot,1,0,"tr",9)(13,at,1,0,"tr",10)(14,st,7,2,"tr",11),l()(),a(15,"div",12),M(16,"mat-paginator",13),l()()),e&2&&(o(10),d("dataSource",n.dataSource),o(),d("ngForOf",n.columns),o(),d("matHeaderRowDef",n.displayedColumns),o(),d("matRowDefColumns",n.displayedColumns),o(3),d("pageSizeOptions",te(5,We)))},dependencies:[ae,re,ie,oe,Pe,ve,Me,Ie,Ee,De,Ae,ke,Te,He,Oe,Re,Ge,I,Be,v,Ne,de,le,he,fe,Se,xe,ye,ge,be,Ce],encapsulation:2})};export{ze as a};
